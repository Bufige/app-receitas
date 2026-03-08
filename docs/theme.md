# Theme System

## How it works

Themes are driven by CSS custom properties on `<html data-theme="...">`. All colors and shadows are defined in `$lib/assets/styles/global.scss`.

- **Light** — `:root` (default, no `data-theme` attribute needed)
- **Dark** — `[data-theme='dark']`

## Available tokens

| Token                               | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| `--bg`                              | Page background                    |
| `--surface`                         | Card/panel background              |
| `--text`                            | Primary text color                 |
| `--text-muted`                      | Secondary/muted text               |
| `--placeholder`                     | Input placeholder text             |
| `--border`                          | Borders and dividers               |
| `--primary` / `--primary-hover`     | Primary brand color + hover        |
| `--secondary` / `--secondary-hover` | Secondary brand color + hover      |
| `--success`                         | Success state                      |
| `--warning`                         | Warning state                      |
| `--error`                           | Error/danger state                 |
| `--black` / `--white`               | Absolute neutrals                  |
| `--box-shadow`                      | Default elevation                  |
| `--high-box-shadow`                 | High elevation (modals, dropdowns) |
| `--soft-box-shadow`                 | Subtle elevation (cards)           |
| `--bg-overlay`                      | Hero background overlay color      |
| `--bg-offset`                       | Hero background horizontal offset  |
| `--bg-image`                        | Hero background image URL          |

## Usage in components

Always use CSS custom properties — never hardcode colors:

```scss
// ✅ Correct
.card {
  background-color: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--soft-box-shadow);
}

// ❌ Wrong
.card {
  background-color: #ffffff;
  color: #121212;
}
```

## Theme store

Import `useThemeStore` from `$lib/stores/theme.svelte`:

```svelte
<script lang="ts">
  import { useThemeStore } from '$lib/stores/theme.svelte';
  const theme = useThemeStore();
</script>

<!-- Toggle dark/light -->
<button onclick={() => theme.toggle()}>
  {theme.current === 'dark' ? '☀️' : '🌙'}
</button>

<!-- Set a specific theme -->
<button onclick={() => theme.set('dark')}>Dark</button>

<!-- Read current theme -->
<p>Current: {theme.current}</p>
```

### API

| Method/Property   | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `theme.current`   | Reactive — current theme name (`'light'` or `'dark'`)              |
| `theme.toggle()`  | Switches between `light` and `dark`                                |
| `theme.set(name)` | Sets any theme by name                                             |
| `theme.init()`    | Reads from `localStorage` or OS preference (called in root layout) |

## Adding a new theme

1. Add a `[data-theme='your-theme']` block in `global.scss` overriding the tokens:

```scss
[data-theme='solarized'] {
  --bg: #fdf6e3;
  --surface: #eee8d5;
  --text: #657b83;
  --text-muted: #93a1a1;
  // ...override all tokens
}
```

2. Switch to it: `theme.set('solarized')`.

No component changes needed — everything adapts automatically.

## FOUC prevention

An inline `<script>` in `app.html` reads `localStorage` and sets `data-theme` before the page renders, so there's no flash of the wrong theme on load.

## Theme-dependent images (flash prevention)

When an image changes between themes (e.g., hero backgrounds), **do not** use JS-derived URLs (`$derived`, `style:background-image`). During a full page reload (e.g., locale switch), the JS hasn't hydrated yet, so the browser briefly shows the wrong image or no image — causing a visible flash.

### The pattern

1. **Place images in `static/`** — they get stable, predictable URLs (e.g., `/background-day.webp`).

2. **Set the image URL as a CSS custom property per theme** in `global.scss`:

```scss
:root {
  --bg-image: url('/background-day.webp');
}

[data-theme='dark'] {
  --bg-image: url('/background-night.webp');
}
```

3. **Use the variable in your component styles** — no inline `style:` needed:

```scss
main {
  background-image: var(--bg-image);
}
```

4. **Preload both images in `app.html`** so the browser fetches them early:

```html
<link rel="preload" href="/background-day.webp" as="image" type="image/webp" />
<link rel="preload" href="/background-night.webp" as="image" type="image/webp" />
```

### Why this works

- The FOUC prevention script in `app.html` sets `data-theme` **before** any rendering.
- CSS custom properties resolve immediately — the correct `--bg-image` is applied on first paint.
- Preloading ensures the image is already in the browser cache when CSS requests it.
- No JS hydration delay — the image is correct from the very first frame.
