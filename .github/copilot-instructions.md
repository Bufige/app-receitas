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

## Code Conventions
- Use Svelte 5 runes and patterns consistently. Do not mix legacy Svelte 3/4 syntax with Svelte 5 features.
- Keep components focused and reusable. If a component grows beyond a single responsibility, consider breaking it into smaller pieces.
- Always prefer existing components and utilities before creating new ones. Check `$lib/components/` and `$lib/utils/` before adding new code.
- Avoid ad-hoc styles and hardcoded values. Use SCSS variables, mixins, and CSS custom properties defined in `global.scss` for consistency.
- Write clean, readable code with clear naming conventions. Avoid abbreviations and unclear variable names. Use descriptive names for components, props, functions, and variables.
- USE DRY PRINCIPLES: If you find yourself repeating code, extract it into a reusable component, function, or style. NEVER copy-paste code across files.

## Svelte 5 Conventions

- Use runes: `$props()`, `$state()`, `$derived()`, `$effect()`, `$bindable()`.
- Use `{@render children()}` for slot content — not `<slot />`.
- Use `onclick={handler}` — not `on:click={handler}`.
- Use `{#snippet name()}...{/snippet}` when passing render content as props.
- Do not use legacy Svelte 3/4 patterns (`export let`, `$:`, stores from `svelte/store`, `createEventDispatcher`).

## Styling & UI

- **Mobile-first is imperative.** Base styles target small screens; desktop enhancements use `min-width` media queries via breakpoint mixins (`@include md`, `@include lg`, etc.) from `$lib/assets/styles/breakpoints.scss`. Never use `max-width` queries.
- **Accessibility is imperative.** Every interactive element must be keyboard-operable and have a visible focus indicator (`:focus-visible`). Use semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<a>`) — never use `<div>` for interactive controls. Add proper ARIA attributes when native semantics are insufficient (e.g., custom dropdowns need `role="listbox"`, `role="option"`, `aria-expanded`, `aria-selected`). All images/icons must have `aria-label` or `aria-hidden="true"` as appropriate. Announce dynamic state changes (theme, locale) via the `announce()` utility from `$lib/utils/announce.ts` and the `#announcer` live region. Respect `prefers-reduced-motion` — reduced-motion styles are global but add `@media (prefers-reduced-motion: reduce)` for component-specific transitions when needed. Use the `.sr-only` class from `global.scss` for visually hidden but screen-reader-accessible content. Never hardcode ARIA label strings — use i18n keys with the `a11y_` prefix.
- Prefer existing components in `$lib/components/*` before creating new ones.
- Use scoped `<style lang="scss">` blocks in `.svelte` files for component styles.
- If you need a new button look, extend the shared `Button` component instead of creating ad-hoc buttons.
- Avoid hard-coded colors — prefer SCSS variables or CSS custom properties defined in `global.scss`.
- Do not use BEM naming (`block__element--modifier`). Svelte scopes styles automatically — use simple, descriptive class names (`.content`, `.spinner`, `.primary`).
- Keep SCSS clean and DRY: avoid deep nesting (max 2 levels), extract repeated values into CSS custom properties, and use `&:hover`, `&:disabled` pseudo-selectors instead of separate classes.

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
- Use `localizeHref()` from `$lib/paraglide/runtime` for internal links to ensure proper locale handling. Do not hardcode `href="/path"`.

## i18n (Paraglide)

- Internationalization uses `@inlang/paraglide-js` v2 — do not introduce other i18n libraries.
- Message files live in `messages/` (one JSON per locale: `en.json`, `pt-br.json`). The generated code lives in `$lib/paraglide/` (gitignored, never edit).
- Ignore the generated `src/lib/paraglide/` folder during normal feature work and fixes. Treat it as build output, not source-of-truth application code.
- If i18n text needs to change, update only the source message files in `messages/` and regenerate the output when appropriate instead of hand-editing generated Paraglide files.
- No locale-prefixed route folders — `hooks.ts` reroutes `/pt-br/*` transparently via `deLocalizeUrl`.
- Never hardcode user-facing strings. Import message functions: `import * as m from '$lib/paraglide/messages.js'` and use `m.key_name()`.
- Use key prefixes to namespace messages: `auth_login_title`, `dashboard_welcome`, `common_save`.
- Always use `localizeHref()` from `$lib/paraglide/runtime` for internal links — never raw `href="/path"`.
- The base locale (`en`) has no URL prefix. Non-base locales get a prefix (e.g., `/pt-br/auth/login`).
- To switch locale, link to `localizeHref(currentPath, { locale: 'pt-br' })` — Paraglide handles the rest.
- Use `import * as m from '$lib/paraglide/messages.js';` to access localized messages.

## Icons
- Use `@iconify/svelte` for icons. Import specific icons from `@iconify-icons/` (e.g., `import { home } from '@iconify-icons/mdi/home';`).
- Do not use SVG files or other icon libraries. Stick to Iconify for consistency and ease of use.
- For common icons (e.g., theme toggle), consider creating a shared `Icon` component that wraps Iconify and provides consistent styling.