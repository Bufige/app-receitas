# Responsivity Instructions

**Mobile-first is imperative.** Every component, layout, and page must be designed for small screens first. Desktop enhancements come via `min-width` media queries — never the other way around.

When building responsive layouts in Svelte components:

## Rules

- Define responsiveness only via CSS — use `@media` queries inside scoped `<style lang="scss">` blocks.
- Do not introduce JS-based responsive logic (no `window.innerWidth` checks, no resize observers for layout switching).
- Prefer mobile-first rules: base styles for small screens, `@media (min-width: ...)` overrides for larger screens.
- Breakpoint logic must be explicit and readable — use the shared variables and mixins from `$lib/assets/styles/breakpoints.scss`. No magic numbers scattered across files.
- Available breakpoints: `$sm` (640px), `$md` (768px), `$lg` (1024px), `$xl` (1280px), `$xxl` (1536px).
- Prefer using the provided mixins (`@include sm`, `@include md`, etc.) over writing raw `@media` queries.

## Component Responsivity

### Primitives (Button, Input, Badge, etc.)
- Primitives should use `width: 100%` as the mobile base, scaling to `width: auto` at `md+`.
- Primitives do NOT own outer spacing (no margin, no gap on themselves). Spacing between siblings is the parent's job.
- Size variants (`small`, `medium`, `large`) use relative units (`rem`, `em`) so they scale naturally — no breakpoint overrides needed for sizing.

### Layout Wrappers (ButtonGroup, FormActions, etc.)
- Use wrapper components to control spacing (`gap`) and direction (`flex-direction`) between groups of primitives.
- Mobile base: stack vertically (`flex-direction: column`, `width: 100%`).
- Desktop override: switch to horizontal (`flex-direction: row`, `width: auto`).
- Gap is passed as a prop on the wrapper, not on individual children.

### Layout Components (Header, Sidebar, Page shells)
- These own their responsive behavior — padding, height, visibility toggling at breakpoints.
- Use `.title { display: none }` → `@include md { display: inline }` patterns for content that hides/shows at breakpoints.

## Layout at the Usage Site

- If a shared layout component (e.g., a flex wrapper) needs responsive overrides, do NOT modify the shared component itself.
- Instead, apply responsive styles at the usage site — either directly in the parent component's `<style>` block, or by wrapping the component in a container element with scoped responsive rules.
- Keep layout component semantics consistent (a row stays a row, a column stays a column). Change spacing, wrapping, or visibility — not the axis.

## Example

```svelte
<!-- Page-level layout with responsive grid -->
<div class="card-grid">
  {#each items as item}
    <Card {item} />
  {/each}
</div>

<!-- Grouped actions using ButtonGroup wrapper -->
<ButtonGroup>
  <Button variant="primary">Save</Button>
  <Button>Cancel</Button>
</ButtonGroup>

<style lang="scss">
  @use '$lib/assets/styles/breakpoints' as *;

  .card-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @include md {
      grid-template-columns: repeat(2, 1fr);
    }

    @include lg {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
```

## Goal

Make responsive behavior local, explicit, and isolated — defined at the point of use, not buried in shared primitives or driven by runtime JS. Primitives fill their container on mobile and shrink to content on desktop. Spacing between elements is always the parent's responsibility.
