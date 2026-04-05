# UI Improvement Guide

## Goal

Evolve `app-receitas` from a solid MVP into a more premium, modern, and conversion-focused food planning experience.

The right visual direction for this project is **editorial food warmth + product clarity**:

- From high-end food sites on Awwwards: rich contrast, stronger visual storytelling, premium spacing, layered surfaces, and tasteful motion.
- From `ifood.com.br`: direct CTAs, immediate task clarity, simple hierarchy, and obvious next actions.

The result should feel **app-like and efficient**, but still **delicious, warm, and memorable**.

## Core Design Direction

### What to keep

- Warm food-oriented atmosphere
- Rounded UI language
- Clear route structure
- Card-based content organization

### What to improve

- Make the homepage more action-oriented and less generic
- Increase visual contrast between sections and surfaces
- Use a more refined brand palette with one dominant accent
- Add motion that feels intentional, not decorative
- Introduce stronger hierarchy for CTA, supporting text, and proof points
- Make the product feel more premium on desktop while staying mobile-first

## Visual Inspiration Summary

### Awwwards food/drink patterns worth borrowing

- Large, confident headlines with tighter supporting copy
- Fewer competing colors; stronger use of one hero accent
- Layered backgrounds with soft gradients and subtle texture
- Editorial rhythm: oversized hero, tight cards, premium spacing
- Motion used for reveal, hover lift, and image presence — not constant animation
- Product photography or food imagery used as emotional anchors

### iFood patterns worth borrowing

- Immediate clarity about what the user can do next
- Search, browse, and primary actions surfaced above the fold
- Easy category scanning
- Strong CTA contrast
- Small trust/reassurance cues close to the main action

### Recommended hybrid for this project

- **Awwwards mood** for brand feeling
- **iFood clarity** for usability

This app should not feel like a restaurant landing page. It should feel like a **beautiful meal-planning product**.

## Recommended Color Palette

The current palette is already warm, but it is a bit soft and too close in value. The next iteration should create a clearer separation between:

- base background
- elevated surfaces
- accent actions
- fresh food-support colors

### Palette concept

- **Primary:** tomato-orange for action and brand energy
- **Secondary:** saffron for warmth and highlights
- **Support:** herb green for freshness and success states
- **Base:** cream and espresso neutrals for appetite and readability
- **Accent:** berry/red-plum used sparingly for premium depth

## Proposed Tokens

### Light theme

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#fff7f0` | Main page background |
| `--surface` | `#fffdf9` | Cards and panels |
| `--surface-muted` | `#fff1e6` | Section contrast and soft blocks |
| `--text` | `#251815` | Main text |
| `--text-muted` | `#6d5a51` | Secondary copy |
| `--placeholder` | `#b59f93` | Inputs |
| `--border` | `#ead6ca` | Borders/dividers |
| `--primary` | `#f05a28` | Main CTA, active states |
| `--primary-hover` | `#d94c1d` | CTA hover |
| `--secondary` | `#ffbf47` | Pills, highlights, badges |
| `--secondary-hover` | `#efa92a` | Secondary hover |
| `--success` | `#5ea56b` | Success/healthy/fresh states |
| `--warning` | `#d9952f` | Warning |
| `--error` | `#d7503b` | Error |
| `--accent-berry` | `#9f3d56` | Premium accent, sparse usage |
| `--shadow-soft` | `rgba(112, 61, 28, 0.10) 0px 10px 30px` | Soft cards |
| `--shadow-strong` | `rgba(89, 42, 14, 0.18) 0px 18px 45px` | Hero/floating surfaces |

### Dark theme

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#17110f` | Main page background |
| `--surface` | `#221916` | Cards and panels |
| `--surface-muted` | `#2c211d` | Section contrast |
| `--text` | `#fff2e8` | Main text |
| `--text-muted` | `#cab1a3` | Secondary copy |
| `--placeholder` | `#8f776b` | Inputs |
| `--border` | `#4a362d` | Borders/dividers |
| `--primary` | `#ff7b47` | Main CTA |
| `--primary-hover` | `#ff6830` | CTA hover |
| `--secondary` | `#ffd166` | Highlights |
| `--secondary-hover` | `#ffc64a` | Secondary hover |
| `--success` | `#7cc587` | Success/freshness |
| `--warning` | `#efb24a` | Warning |
| `--error` | `#f0715b` | Error |
| `--accent-berry` | `#c46281` | Premium accent |
| `--shadow-soft` | `rgba(0, 0, 0, 0.24) 0px 10px 30px` | Soft cards |
| `--shadow-strong` | `rgba(0, 0, 0, 0.45) 0px 18px 45px` | Hero/floating surfaces |

## Color Usage Rules

A strong palette works because of restraint, not because of quantity.

### Use colors like this

- `--bg` and `--surface`: about 70–75% of the interface
- `--primary`: about 10–12%, reserved for the most important actions
- `--secondary`: about 8–10%, used for tags, highlights, and supporting emphasis
- `--success`: only for positive state, fresh food cues, completion, and confirmations
- `--accent-berry`: very rare, used for premium moments, not routine buttons

### Avoid

- Using orange on everything
- Putting multiple saturated colors side by side in the same card
- Using yellow for body text or long labels
- Making all cards the same elevation and background value

## Homepage Recommendations for `src/routes/+page.svelte`

The current homepage is clean, but it feels like a placeholder hero. It needs to become more direct, more useful, and more emotionally food-oriented.

### Current issues

- The content is centered and generic, which reduces urgency
- CTAs are present, but the value proposition is still too abstract
- There is no visual proof of recipes, planning, or shopping outcomes
- The feature cards are useful but visually uniform
- The section lacks motion hierarchy and a strong focal point

## Recommended Homepage Structure

### 1. Split hero instead of purely centered hero

Use a two-part layout on desktop:

- **Left:** message, direct CTA stack, trust/value bullets
- **Right:** recipe image collage, planner preview card, or shopping summary card

On mobile, keep it stacked.

### 2. Make the headline more task-oriented

The homepage should say what the user can do immediately.

Better hero direction:

- Plan meals faster
- Turn recipes into a shopping list
- Organize recurring meals for the week

The current tone can stay warm, but the copy should be shorter and more outcome-based.

### 3. Make the main CTA unmistakable

Use one primary action and one secondary action:

- **Primary:** browse recipes
- **Secondary:** open planner

The primary CTA should feel like the obvious next step. Increase visual dominance using:

- stronger fill color
- larger horizontal padding
- icon support if appropriate
- slightly elevated shadow on hover/focus

### 4. Add a proof strip under the CTAs

Right below the actions, add 2–3 short proof/value items:

- recurring recipes
- automatic shopping list
- default household servings

These should be presented as compact pills or mini-stat cards.

### 5. Replace equal feature cards with staggered emphasis

Right now, all three feature cards have the same weight.

Instead:

- make one card visually featured
- use icons or supporting imagery
- vary background intensity slightly
- keep copy short and skimmable

## Motion and Animation Guidance

The project already uses theme/view transitions. The next step is **component-level motion discipline**.

### Motion principles

- Fast and subtle
- Support hierarchy and affordance
- Never block the task
- Respect `prefers-reduced-motion`

### Recommended motion tokens

- `120ms`: micro-interactions
- `180ms`: buttons, chips, hover lifts
- `240ms`: cards and panels entering or changing emphasis
- `320ms`: hero image/content reveal

### Recommended easing

- Standard UI: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Entrance: `cubic-bezier(0.16, 1, 0.3, 1)`

### Good motion opportunities

- CTA hover: slight lift + shadow increase + background deepen
- Feature card hover: `translateY(-2px)` with subtle border emphasis
- Hero image or preview card: soft fade/slide on initial load
- Tag/filter chips: background and border transition
- Floating actions: soft entrance from below, no bouncing

### Avoid

- Large parallax
- Infinite floating animations
- Slow fade-ins on important content
- Simultaneous motion on multiple unrelated elements

## Suggested Interaction Improvements

### CTA hierarchy

Across the app, define these levels consistently:

- **Primary:** the next best action on the page
- **Secondary:** useful but not dominant
- **Tertiary:** low-emphasis navigation/action links
- **Ghost/Chip:** lightweight filters and support actions

### Card design

Recipe and feature cards should feel more tactile:

- slightly larger radius for premium softness
- stronger image-to-content contrast
- clearer metadata grouping
- hover should change elevation and border together

### Section rhythm

Introduce clearer alternation between:

- plain background sections
- muted surface sections
- content sections with stronger imagery

This prevents the site from feeling like one long undifferentiated canvas.

### Trust and clarity cues

Add small reassurance items around actions:

- “Build your week in minutes”
- “Shopping list updates automatically”
- “Recurring meals supported”

These should be concise and appear near the hero or planner entry points.

## Typography Recommendations

The current type direction is good, but the hierarchy can be sharper.

### Recommended adjustments

- Use bolder hero weights with tighter max-width
- Keep paragraph lines shorter for better scanning
- Increase contrast between heading and body sizes
- Use short eyebrow labels above major sections
- Reserve accent color for emphasis words, not full sentences

### Suggested sizing direction

- Hero title mobile: `2.25rem` to `2.5rem`
- Hero title desktop: `4rem` to `4.75rem`
- Hero body: `1rem` mobile, `1.125rem` desktop
- Section titles: `1.5rem` to `2rem`
- Supporting labels: `0.8125rem` to `0.9rem`

## Imagery Direction

Food products win visually when imagery feels real and appetizing.

### Use images to support product outcomes

Instead of using imagery only decoratively, pair it with product utility:

- recipe thumbnail + prep time
- weekly plan mini preview
- shopping list summary snippet

### Image style recommendation

- natural light
- close crop
- saturated food tones
- minimal background clutter
- consistent aspect ratio

## Quick Wins

These changes should noticeably improve the UI with minimal product risk.

### High impact, low effort

1. Update the global color tokens toward the proposed palette
2. Rework homepage hero into a split layout
3. Make the primary CTA larger and more dominant
4. Add a proof/value strip below the hero CTA
5. Add motion tokens and standard hover transitions for buttons/cards
6. Introduce `--surface-muted` and alternate section backgrounds
7. Tighten hero copy so it describes the immediate task outcome

## Proposed Homepage Content Hierarchy

A good structure for `src/routes/+page.svelte` would be:

1. **Eyebrow**: simple utility promise
2. **Hero title**: meal planning outcome
3. **Short description**: one sentence maximum, highly concrete
4. **Primary CTA**: browse recipes
5. **Secondary CTA**: plan the week
6. **Proof strip**: recurring meals, shopping list, household defaults
7. **Visual preview block**: recipe + planner + shopping summary
8. **Feature section**: 3 cards, but with one highlighted

## Example Creative Direction for the Hero

### Tone

- direct
- warm
- useful
- not corporate

### Messaging style

Prefer:

- practical outcomes
- shorter verbs
- fewer adjectives

Avoid:

- generic “discover” language everywhere
- long mission-style paragraphs
- equally weighted actions

## Suggested Implementation Phases

### Phase 1 — Visual Foundation

- update theme tokens in `global.scss`
- add `--surface-muted`
- define motion duration/easing tokens
- refine shadows and surface contrast

### Phase 2 — Homepage Refresh

- redesign `src/routes/+page.svelte`
- add split hero
- strengthen CTA hierarchy
- add proof strip and preview area
- improve feature card composition

### Phase 3 — System Polish

- standardize hover/focus states
- normalize section spacing rhythm
- unify card elevation behavior
- improve imagery presentation across pages

### Phase 4 — Premium Touches

- staggered reveal on first viewport sections
- richer planner preview visuals
- microinteractions for chips, cards, and floating actions

## Recommendation Summary

If only one design direction is chosen, choose this:

**Warm editorial palette + product-first clarity + subtle premium motion**.

That combination fits this project much better than either:

- a purely artistic food-site aesthetic, or
- a purely utilitarian grocery-app look

It keeps the app appetizing, but still fast and actionable.
