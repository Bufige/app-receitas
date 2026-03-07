# Copilot Instructions

## Stack

- SvelteKit 2 (Svelte 5, runes mode)
- TypeScript (strict)
- Styling uses SCSS (`<style lang="scss">`) — do not introduce other styling systems (no Tailwind, no CSS-in-JS).
- Data fetching uses `@tanstack/svelte-query` v6 — do not use SvelteKit `load` functions for API calls.
- Linting/formatting uses Biome — do not introduce ESLint or Prettier configs.
- The backend is external; this is a frontend-only project.

## Project Structure

- Components live in `$lib/components/ui/` (reusable primitives) and `$lib/components/layout/` (app shell).
- API fetch functions live in `$lib/api/` — one file per resource (e.g., `auth.ts`, `posts.ts`). All use the shared client from `$lib/api/client.ts`.
- TanStack Query definitions live in `$lib/queries/` — one file per resource with `createQuery`/`createMutation` wrappers. Query keys are defined in `$lib/queries/keys.ts`.
- Shared TypeScript types live in `$lib/types/`.
- Global reactive state (non-query) lives in `$lib/stores/` using `.svelte.ts` files with Svelte 5 runes (`$state`, `$derived`).
- Utility/helper functions live in `$lib/utils/`.
- Global styles live in `$lib/assets/styles/global.scss`.
- Use the `$lib/` alias for all imports from `src/lib/`. Avoid relative imports that traverse up (e.g., `../../lib/`).

## Svelte 5 Conventions

- Use runes: `$props()`, `$state()`, `$derived()`, `$effect()`, `$bindable()`.
- Use `{@render children()}` for slot content — not `<slot />`.
- Use `onclick={handler}` — not `on:click={handler}`.
- Use `{#snippet name()}...{/snippet}` when passing render content as props.
- Do not use legacy Svelte 3/4 patterns (`export let`, `$:`, stores from `svelte/store`, `createEventDispatcher`).

## Styling & UI

- Prefer existing components in `$lib/components/*` before creating new ones.
- Use scoped `<style lang="scss">` blocks in `.svelte` files for component styles.
- If you need a new button look, extend the shared `Button` component instead of creating ad-hoc buttons.
- Avoid hard-coded colors — prefer SCSS variables or CSS custom properties defined in `global.scss`.

## Data Fetching (TanStack Query)

- Never call `fetch` directly in components. Use the API layer (`$lib/api/`) + query layer (`$lib/queries/`).
- Always wrap TanStack Query arguments in a function for reactivity: `createQuery(() => ({ ... }))`.
- For mutations that change cached data, invalidate or update the query cache in `onSuccess`.
- The `QueryClientProvider` is already wired in the root `+layout.svelte` with `enabled: browser`.

## Routing

- Use SvelteKit file-based routing (`src/routes/`).
- Use route groups `(groupName)/` for distinct layouts without affecting the URL.
- Use `+page.svelte` for pages, `+layout.svelte` for layouts, `+error.svelte` for error boundaries.
- Do not use `+page.server.ts` or `+layout.server.ts` for data loading — all data comes from the external API via TanStack Query.

## i18n (Paraglide)

- Internationalization uses `@inlang/paraglide-js` v2 — do not introduce other i18n libraries.
- Message files live in `messages/` (one JSON per locale: `en.json`, `pt-br.json`). The generated code lives in `$lib/paraglide/` (gitignored, never edit).
- No locale-prefixed route folders — `hooks.ts` reroutes `/pt-br/*` transparently via `deLocalizeUrl`.
- Never hardcode user-facing strings. Import message functions: `import * as m from '$lib/paraglide/messages.js'` and use `m.key_name()`.
- Use key prefixes to namespace messages: `auth_login_title`, `dashboard_welcome`, `common_save`.
- Always use `localizeHref()` from `$lib/paraglide/runtime` for internal links — never raw `href="/path"`.
- The base locale (`en`) has no URL prefix. Non-base locales get a prefix (e.g., `/pt-br/auth/login`).
- To switch locale, link to `localizeHref(currentPath, { locale: 'pt-br' })` — Paraglide handles the rest.