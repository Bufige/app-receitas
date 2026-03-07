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
