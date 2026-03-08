# Memorial Creation Flow

## Overview

Users can create a pet memorial **without logging in**. A client-side anonymous session identifier ties uploads and draft data to the visitor. Once they register or log in, the backend associates everything with their account. The backend handles cleanup of orphaned anonymous data on a regular schedule, so the frontend doesn't worry about it.

---

## Anonymous Session

### Client-Side Identifier

- On first visit to the memorial wizard, generate a **UUIDv4** via `crypto.randomUUID()`.
- Persist it in `localStorage` under the key `anon_session_id`.
- If one already exists, reuse it.
- Store lives at `$lib/stores/anonymous-session.svelte.ts`, exporting `useAnonymousSession()` with `{ sessionId, clear() }`.
- Follows the same Svelte 5 runes pattern as `magic-link-cooldown.svelte.ts`.

### API Header

- The shared API client (`$lib/api/client.ts`) reads `anon_session_id` from `localStorage` and sends it as an **`X-Anonymous-Session`** header on every request.
- When an `Authorization` (auth token) header is also present, both headers are sent — the backend uses this overlap window to merge anonymous data into the authenticated user's account.

### Claim on Auth

- On successful **login or register** (in `$lib/queries/auth.ts` `onSuccess` callbacks), the frontend calls `POST /auth/claim-session` with the `anon_session_id`.
- The backend migrates all uploads and drafts from that anonymous session to the authenticated user.
- The frontend then calls `clear()` on the anonymous session store to remove the localStorage key.

---

## Memorial Wizard

### Route Structure

Sub-routes under `src/routes/(memorial)/create/` for URL-driven navigation with full browser back/forward support:

```
src/routes/(memorial)/create/
├── +layout.svelte        ← wizard chrome (progress stepper, back/next)
├── step-1/+page.svelte   ← Pet details
├── step-2/+page.svelte   ← Media upload
├── step-3/+page.svelte   ← Tribute
└── step-4/+page.svelte   ← Preview & submit
```

Each step is a standalone page. The layout provides the shared stepper UI and navigation buttons. Users can navigate freely between completed steps.

### Step 1 — Pet Details

| Field           | Type         | Required | Notes                       |
| --------------- | ------------ | -------- | --------------------------- |
| Pet name        | text input   | yes      |                             |
| Species         | select/radio | yes      | Dog, Cat, Bird, Other, etc. |
| Sex             | select/radio | no       | Male, Female, Unknown       |
| Breed           | text input   | no       |                             |
| Date of birth   | date picker  | no       |                             |
| Date of passing | date picker  | no       |                             |

Uses existing `Input` and `Button` components. Species selector may need a new `Select` or `RadioGroup` component.

### Step 2 — Media Upload

- Drag-and-drop zone + file picker button.
- Accepts images and videos (formats/size limits enforced by backend).
- Files are stored **locally in memory** (as `File` objects / object URLs) — they are **not uploaded yet**.
- Thumbnails are generated client-side for preview.
- Users can reorder and remove media before proceeding.
- A reasonable limit on number of files (e.g., 10–20) shown in the UI.

### Step 3 — Tribute

- A textarea for a tribute message / personal note.
- Optional quote or epitaph field.
- Character count indicator.

### Step 4 — Preview & Submit

- Read-only summary of all previous steps: pet info, media thumbnails, tribute text.
- "Edit" links per section to jump back to the relevant step.
- **Submit** button:
  - Uploads all media files to the backend in a **deferred batch** (with progress indicator per file).
  - Sends the memorial creation payload with references to the uploaded media.
  - If the user is **authenticated**: creates the memorial under their account.
  - If the user is **anonymous**: creates the memorial under the anonymous session, then prompts the user to register/login to claim it.

---

## Draft Persistence (Auto-Save)

- The memorial draft store (`$lib/stores/memorial-draft.svelte.ts`) holds the full wizard state with `$state` runes:
  - `currentStep` (number)
  - `petDetails` (name, species, sex, breed, dates)
  - `mediaFiles` (array of `{ id, file, previewUrl, order }`) — **note:** `File` objects cannot be serialized to localStorage, so only metadata (name, size, type, order) is persisted; the actual files are held in memory and must be re-selected if the page is hard-refreshed.
  - `tribute` (text, quote)
- **Auto-save on every field change** using `$effect` that writes to `localStorage` under key `memorial_draft`.
- On wizard init, the store hydrates from localStorage if a draft exists.
- `reset()` clears both the `$state` and localStorage.
- The anonymous session ID is stored separately (see above) and referenced by the draft implicitly.

### Draft Store Shape

```typescript
type MemorialDraft = {
  currentStep: number;
  petDetails: {
    name: string;
    species: string;
    sex: string;         // "male" | "female" | "unknown"
    breed: string;
    birthDate: string;   // ISO date string or empty
    passingDate: string;  // ISO date string or empty
  };
  media: {
    id: string;           // client-generated UUID
    fileName: string;
    fileSize: number;
    fileType: string;
    order: number;
  }[];
  tribute: {
    message: string;
    quote: string;
  };
};
```

---

## Types

New file: `$lib/types/memorial.ts`

```typescript
export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "other";
export type PetSex = "male" | "female" | "unknown";

export type PetDetails = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string;
  birthDate: string;
  passingDate: string;
};

export type MediaItem = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  order: number;
};

export type TributeData = {
  message: string;
  quote: string;
};

export type MemorialDraft = {
  currentStep: number;
  petDetails: PetDetails;
  media: MediaItem[];
  tribute: TributeData;
};

export type MemorialMediaUploadResponse = {
  id: string;
  url: string;
  thumbnailUrl: string;
};

export type Memorial = {
  id: string;
  petDetails: PetDetails;
  media: MemorialMediaUploadResponse[];
  tribute: TributeData;
  userId: string | null;
  anonymousSessionId: string | null;
  createdAt: string;
};
```

---

## API Layer

New file: `$lib/api/memorial.ts`

| Endpoint              | Method | Body                          | Auth            | Description                               |
| --------------------- | ------ | ----------------------------- | --------------- | ----------------------------------------- |
| `/memorials/upload`   | POST   | `FormData` (file + sessionId) | anon or auth    | Upload a single media file                |
| `/memorials`          | POST   | `MemorialDraft` JSON          | anon or auth    | Create the memorial with media references |
| `/auth/claim-session` | POST   | `{ sessionId }`               | auth (required) | Merge anonymous session into authed user  |

The `uploadMedia` function must use `FormData` instead of JSON (skip the default `Content-Type: application/json` header in the API client).

---

## Query Layer

New file: `$lib/queries/memorial.ts`

- `createUploadMediaMutation()` — calls `memorialApi.uploadMedia(file)`, returns uploaded media references.
- `createMemorialMutation()` — calls `memorialApi.create(draft)`, invalidates relevant caches on success.

New keys in `$lib/queries/keys.ts`:

```typescript
memorial: {
  all: ["memorial"] as const,
  detail: (id: string) => [...queryKeys.memorial.all, id] as const,
},
```

---

## i18n Keys

Prefix: `memorial_`

### English (`messages/en.json`)

```
memorial_create_title          → "Create a memorial"
memorial_create_subtitle       → "Celebrate the life of your beloved companion."
memorial_step_details          → "Details"
memorial_step_media            → "Photos & Videos"
memorial_step_tribute          → "Tribute"
memorial_step_preview          → "Preview"
memorial_next                  → "Next"
memorial_previous              → "Back"
memorial_submit                → "Create memorial"
memorial_pet_name_label        → "Pet name"
memorial_pet_name_placeholder  → "What was their name?"
memorial_species_label         → "Species"
memorial_sex_label             → "Sex"
memorial_breed_label           → "Breed"
memorial_breed_placeholder     → "e.g., Golden Retriever"
memorial_birth_date_label      → "Date of birth"
memorial_passing_date_label    → "Date of passing"
memorial_upload_prompt         → "Drag photos or videos here, or click to browse"
memorial_upload_limit          → "Up to {max} files"
memorial_tribute_label         → "Your tribute"
memorial_tribute_placeholder   → "Share a memory, a story, or simply what they meant to you..."
memorial_quote_label           → "Epitaph or quote"
memorial_quote_placeholder     → "A short phrase to remember them by"
memorial_preview_title         → "Preview your memorial"
memorial_preview_edit          → "Edit"
memorial_uploading             → "Uploading media... {current} of {total}"
memorial_submit_anonymous      → "Create & sign up to save"
memorial_submit_authenticated  → "Create memorial"
```

### Portuguese (`messages/pt-br.json`)

Equivalent keys with Portuguese translations.

---

## Wizard Layout (`(memorial)/create/+layout.svelte`)

### Progress Stepper

- Horizontal stepper showing all 4 steps with labels.
- Current step highlighted with `--primary` color.
- Completed steps show a checkmark icon.
- Steps are clickable only if already visited (prevents skipping ahead).
- Mobile: condensed to step numbers with current label below.

### Navigation

- **Back** button (secondary/default variant) — navigates to previous step or exits wizard on step 1.
- **Next** button (primary variant) — validates current step, then navigates forward.
- On step 4, the Next button becomes **Submit** (primary variant).
- Navigation uses `goto(localizeHref('/create/step-N'))`.

---

## Upload Flow (Deferred Batch)

1. **Step 2**: User selects files → stored as `File` objects in the draft store's in-memory state + metadata persisted to localStorage.
2. **Step 4 (Preview)**: Thumbnails rendered from in-memory `File` objects via `URL.createObjectURL()`.
3. **On Submit**:
   - For each file, call `POST /memorials/upload` with `FormData` containing the file and the anonymous session ID.
   - Show a progress bar: "Uploading 3 of 7..."
   - Collect the returned media IDs/URLs.
   - Then call `POST /memorials` with the full draft + media references.
4. **On failure**: Retry individual failed uploads. Already-uploaded files are not re-sent (track upload status per file).

---

## Post-Submit Flow

### Authenticated User
- Memorial is created → redirect to the memorial page (`/memorial/:id`).

### Anonymous User
- Memorial is created under the anonymous session → show a prompt:
  > "Your memorial has been created! Sign up to make sure it's saved to your account."
- Two options:
  - **Sign up** → redirects to `/register?returnTo=/memorial/:id` with the anonymous session still active.
  - **Continue without account** → redirects to the memorial page (accessible via a shareable link, but not editable without an account).

---

## File Structure Summary

```
src/
├── lib/
│   ├── api/
│   │   └── memorial.ts              ← API functions
│   ├── queries/
│   │   └── memorial.ts              ← TanStack Query wrappers
│   ├── stores/
│   │   ├── anonymous-session.svelte.ts  ← anonymous session ID
│   │   └── memorial-draft.svelte.ts     ← wizard draft state + auto-save
│   ├── types/
│   │   └── memorial.ts              ← TypeScript types
│   └── components/
│       └── ui/
│           ├── Stepper/index.svelte  ← progress stepper (new)
│           ├── FileUpload/index.svelte ← drag-and-drop upload zone (new)
│           └── Select/index.svelte   ← species selector (new, if needed)
├── routes/
│   └── (memorial)/
│       └── create/
│           ├── +layout.svelte        ← wizard chrome
│           ├── step-1/+page.svelte   ← pet details
│           ├── step-2/+page.svelte   ← media upload
│           ├── step-3/+page.svelte   ← tribute
│           └── step-4/+page.svelte   ← preview & submit
└── messages/
    ├── en.json                       ← + memorial_* keys
    └── pt-br.json                    ← + memorial_* keys
```