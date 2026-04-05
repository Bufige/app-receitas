# App receitas

## Overview

This application helps users plan meals for a week or month based on a list of recipes. Each recipe contains the ingredients required, the preparation steps, and the quantity needed for each ingredient.

The main business goal is to let users build a meal plan, then automatically calculate a consolidated shopping list showing how much of each ingredient they need to buy.

The current frontend already supports keeping multiple saved meal plans and switching the active plan across the planner, planned meals view, and shopping list. This makes it possible to compare different planning horizons such as `this_week`, `next_week`, `this_month`, and `custom_range` without losing previously configured plans.

The planner experience now also supports creating empty plans, configuring them in a tabbed workflow, and reviewing the active range in a calendar overview tab that maps all planned meals across the selected interval.

The profile history view has also evolved beyond a static summary. Users can now review all saved plans together, filter history by a specific plan, or constrain the analysis to a custom date interval.

Since this is a frontend-only project for now, the immediate priority is to define the data structures the UI expects and to work with mocked data until the backend contract is implemented.

Recipes themselves are managed by an administrator. Regular users do not create recipes directly; they browse the available recipe catalog, build meal plans, and generate shopping lists from those administrator-provided recipes.

---

## Product Goal

- Allow users to browse or search recipes.
- Let users choose recipes for specific days or periods.
- Support planning for different durations, such as a full week or full month.
- Offer planning horizon presets such as `this_week`, `next_week`, `this_month`, and `custom_range`.
- Allow users to keep multiple saved meal plans and switch the active plan by range, name, or plan id.
- Allow users to create a brand-new empty plan without overwriting seeded or previously saved plans.
- Allow users to schedule recurring recipes across days, weeks, months, or years from a calendar view.
- Keep the active plan strict, so planned meals and recurring series remain inside the selected plan window.
- Let users define a default household serving size and override servings per planned meal.
- Aggregate ingredient quantities across selected recipes.
- Let users review planning history by plan, date interval, or the full saved history.
- Present a final shopping list that is easy to understand and review.

---

## Core User Flow

### 1. Browse Recipes

Users should be able to:

- view a list of available recipes;
- search recipes by name;
- later filter by category, difficulty, meal type, or preparation time.

Each recipe card should show at least:

- recipe name;
- short description;
- estimated servings;
- preparation time;
- cover image;
- quick action to view details or add to a plan.

### 2. View Recipe Details

When opening a recipe, the user should see:

- recipe title;
- description;
- ingredients list;
- preparation instructions;
- servings information;
- estimated time;
- optional tags such as breakfast, lunch, dinner, healthy, quick, etc.

### 3. Build a Meal Plan

Users should be able to:

- choose a planning period (weekly or monthly);
- choose a planning preset such as `this_week`, `next_week`, `this_month`, or a custom date range;
- create an empty plan and name it before assigning any meals;
- switch between previously created plans without overwriting the currently selected planner context;
- assign recipes to specific days and meals;
- repeat the same recipe on multiple days if desired;
- select a date in a calendar and define a recurrence for the next days, weeks, months, or years;
- edit only one recurring occurrence or the entire recurring series;
- change servings per recipe selection when needed;
- review the active interval in a calendar overview before leaving the planner;
- keep all saved entries inside the active plan window when changing presets or custom dates.

The planner should also help prevent confusing schedules by warning users when a meal slot is already occupied or when the same time period becomes overloaded.

This is important because the ingredient calculation should depend not only on the recipe itself, but also on how many times it appears in the plan, whether it is recurring, and how many servings are needed.

Recurring planning should be considered a core feature, not an optional enhancement. A user should be able to pick a recipe, choose a calendar date, and say that they will eat it repeatedly for a defined interval and duration.

The current planner model is intentionally strict: if a one-time meal or a recurring series falls outside the active plan range, it should be rejected or pruned so the planner, planned meals view, shopping list, and calendar overview all describe the same interval.

### 4. Generate a Shopping List

After a plan is created, the app should:

- combine all ingredients from the selected recipes;
- sum repeated ingredients across multiple recipes;
- show total quantities grouped by ingredient;
- let users track shopping progress by marking items as bought, skipped, or already available at home;
- let users filter the shopping calculation by selected planned meals inside the active plan;
- keep a persistent shopping progress indicator visible while reviewing the list;
- optionally group by category later, such as vegetables, meat, dairy, grains, etc.

Example:

- Recipe A uses `2 tomatoes`
- Recipe B uses `3 tomatoes`
- Final shopping list shows `5 tomatoes`

Example 2:
- Recipe A uses `1 kg of rice`
- Recipe B uses `2 kg of rice`
- Final shopping list shows `3 kg of rice`

---

## Frontend Scope

For the frontend, the most important responsibility right now is to establish a stable contract for:

- recipe data;
- meal plan data;
- shopping list calculation input and output;
- mock files that simulate backend responses.

This allows the interface and user flows to be built before the backend is ready.

The frontend should also reflect the ownership rules clearly:

- administrators manage the recipe catalog;
- users manage their own meal plans and shopping lists;
- users may later be allowed to suggest recipes, but that is a future feature and not part of the initial contract.

The initial contract should also leave room for:

- household-level preferences that influence servings and planning defaults;
- editing recurring series without breaking the calendar model;
- history-level filtering by saved plan or date interval;
- tracking shopping list item status across a planning period.

---

## Main Entities

### Recipe

A recipe represents a meal the user can select from the administrator-managed catalog.

Suggested shape:

```ts
type Recipe = {
	id: string;
	slug: string;
	name: string;
	description?: string;
	image_url?: string;
	servings: number;
	preparation_time_in_minutes: number;
	tags?: string[];
	ingredients: RecipeIngredient[];
	instructions: RecipeInstruction[];
};
```

The `description`, `image_url`, and `tags` fields are optional and can be omitted when the recipe is still incomplete or has no extra presentation metadata yet.

For the initial version, recipes are treated as read-only data for regular users.

### Recipe Ingredient

Each ingredient must be detailed enough for future aggregation.

```ts
type RecipeIngredient = {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
};
```

Examples of `unit`:

- `g`
- `kg`
- `ml`
- `l`
- `unit`

### Recipe Instruction

```ts
type RecipeInstruction = {
	step: number;
	description: string;
};
```

### Meal Plan

The meal plan represents the recipes selected by the user across a time period.

In the current frontend experience, users can maintain more than one meal plan at the same time. One plan is treated as the active selection, and related screens such as the planner, planned meals page, and shopping list page all react to that selected plan.

```ts
type MealPlan = {
	id: string;
	name: string;
	period: 'week' | 'month';
	planning_preset?: 'this_week' | 'next_week' | 'this_month' | 'custom_range';
	start_date?: string;
	end_date?: string;
	entries: MealPlanEntry[];
};
```

### Meal Plan Entry

Each entry links one recipe to a specific date and meal type.

```ts
type MealPlanEntry = {
	id: string;
	recipe_id: string;
	date: string;
	meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	servings: number;
	recurrence_rule?: RecurrenceRule;
	series_id?: string;
};
```

The optional `series_id` helps link recurring entries that belong to the same recurrence series, which is useful when editing a single occurrence versus the entire series.

### Recurrence Rule

Recurring recipes should be represented explicitly so the frontend and backend can distinguish a one-time entry from a repeated one.

```ts
type RecurrenceRule = {
	frequency: 'day' | 'week' | 'month' | 'year';
	interval: number;
	ends_on?: string;
	occurrence_count?: number;
};
```

- `frequency` defines how often the recipe repeats.
- `interval` defines the gap between repetitions, such as every `2` weeks.
- `ends_on` can be used when the user wants to stop on a specific date.
- `occurrence_count` can be used when the user wants a fixed number of repetitions.

### Shopping List Item

This is the final aggregated result shown to the user.

```ts
type ShoppingListItem = {
	ingredient_id: string;
	name: string;
	total_quantity: number;
	unit: string;
	category: string;
	status?: 'pending' | 'bought' | 'skipped' | 'already_available';
};
```

### Household Profile

The household profile stores defaults that make meal planning faster and more personalized.

```ts
type HouseholdProfile = {
	id: string;
	name: string;
	default_servings: number;
	dietary_preferences?: string[];
	disliked_ingredients?: string[];
};
```

This model is especially useful because users often plan for the same household size repeatedly, and later it can support budget-aware and seasonal suggestions.

---

## Important Calculation Rule

The shopping list should not simply copy ingredients from recipes. It must calculate totals based on:

- the ingredient quantity in the recipe;
- the number of servings defined in the recipe;
- the number of servings chosen in the meal plan;
- how many times that recipe appears in the plan.

If a meal plan entry includes a recurrence rule, the shopping list calculation must expand that recurrence into all planned occurrences inside the selected period before aggregating ingredient totals.

Example:

- A recipe serves `2` people
- It uses `200 g` of rice
- The user selects it for `4` servings

Then the adjusted ingredient amount becomes:

$$
200 \times \frac{4}{2} = 400
$$

So the shopping list should use `400 g` of rice for that recipe selection.

---

## Suggested Mock Data Strategy

Until the backend exists, mocked data should live in separate frontend files so the contract is explicit and easy to inspect.

Suggested structure:

```text
src/lib/mocks/
├── recipes.ts
├── meal-plans.ts
└── shopping-list.ts
```

### `recipes.ts`

Should export a list of recipe objects.

```ts
export const mock_recipes: Recipe[] = [];
```

### `meal-plans.ts`

Should export one or more sample plans for weekly and monthly usage.

```ts
export const mock_meal_plans: MealPlan[] = [];
```

### `household-profile.ts`

Should export the household defaults used to prefill servings and future planning preferences.

```ts
export const mock_household_profile: HouseholdProfile = {
	id: 'household-001',
	name: 'Default Household',
	default_servings: 4,
	dietary_preferences: [],
	disliked_ingredients: []
};
```

### `shopping-list.ts`

Can export either:

- a mocked final shopping list; or
- a helper that calculates the shopping list from recipes and meal plan entries.

This second option is better because it proves the frontend logic with realistic data.

---

## Example Recipe Object

```ts
const recipe_example: Recipe = {
	id: 'recipe-spaghetti-bolognese',
	slug: 'spaghetti-bolognese',
	name: 'Spaghetti Bolognese',
	description: 'Classic pasta dish with ground beef and tomato sauce.',
	image_url: '/images/recipes/spaghetti-bolognese.jpg',
	servings: 4,
	preparation_time_in_minutes: 45,
	tags: ['pasta', 'dinner', 'family'],
	ingredients: [
		{
			id: 'ingredient-spaghetti',
			name: 'Spaghetti',
			quantity: 500,
			unit: 'g',
			category: 'grains'
		},
		{
			id: 'ingredient-ground-beef',
			name: 'Ground beef',
			quantity: 400,
			unit: 'g',
			category: 'meat'
		},
		{
			id: 'ingredient-tomato-sauce',
			name: 'Tomato sauce',
			quantity: 300,
			unit: 'ml',
			category: 'canned'
		}
	],
	instructions: [
		{ step: 1, description: 'Boil the spaghetti until al dente.' },
		{ step: 2, description: 'Cook the ground beef in a pan.' },
		{ step: 3, description: 'Add tomato sauce and simmer.' },
		{ step: 4, description: 'Combine and serve.' }
	]
};
```

---

## Example Meal Plan Object

```ts
const meal_plan_example: MealPlan = {
	id: 'meal-plan-week-001',
	name: 'Weekly Family Plan',
	period: 'week',
	planning_preset: 'this_week',
	start_date: '2026-04-06',
	end_date: '2026-04-12',
	entries: [
		{
			id: 'entry-001',
			recipe_id: 'recipe-spaghetti-bolognese',
			date: '2026-04-06',
			meal_type: 'dinner',
			servings: 4
		},
		{
			id: 'entry-002',
			recipe_id: 'recipe-spaghetti-bolognese',
			date: '2026-04-09',
			meal_type: 'lunch',
			servings: 2,
			series_id: 'series-001',
			recurrence_rule: {
				frequency: 'week',
				interval: 1,
				ends_on: '2026-06-25'
			}
		}
	]
};
```

In this example, the second entry repeats every week until `2026-06-25`, so the shopping list generator must count every occurrence that falls inside the selected planning period.

---

## Example Shopping List Output

```ts
const shopping_list_example: ShoppingListItem[] = [
	{
		ingredient_id: 'ingredient-spaghetti',
		name: 'Spaghetti',
		total_quantity: 1000,
		unit: 'g',
		category: 'grains',
		status: 'pending'
	},
	{
		ingredient_id: 'ingredient-ground-beef',
		name: 'Ground beef',
		total_quantity: 800,
		unit: 'g',
		category: 'meat',
		status: 'bought'
	},
	{
		ingredient_id: 'ingredient-tomato-sauce',
		name: 'Tomato sauce',
		total_quantity: 600,
		unit: 'ml',
		category: 'canned',
		status: 'already_available'
	}
];
```

This example represents the final aggregated shopping list output after combining all meal plan entries in the selected period and summing repeated ingredients.

### Example Shopping List Output With Recurrence

If the selected planning period includes the full recurring range from `2026-04-09` to `2026-06-25`, the second meal plan entry repeats `12` times.

Because that recurring entry uses `2` servings for a recipe that normally serves `4`, each occurrence contributes half of the base ingredient quantities:

- `250 g` of spaghetti per occurrence
- `200 g` of ground beef per occurrence
- `150 ml` of tomato sauce per occurrence

That produces the following aggregated result when combined with the one-time dinner entry on `2026-04-06`:

```ts
const recurring_shopping_list_example: ShoppingListItem[] = [
	{
		ingredient_id: 'ingredient-spaghetti',
		name: 'Spaghetti',
		total_quantity: 3500,
		unit: 'g',
		category: 'grains'
	},
	{
		ingredient_id: 'ingredient-ground-beef',
		name: 'Ground beef',
		total_quantity: 2800,
		unit: 'g',
		category: 'meat'
	},
	{
		ingredient_id: 'ingredient-tomato-sauce',
		name: 'Tomato sauce',
		total_quantity: 2100,
		unit: 'ml',
		category: 'canned'
	}
];
```

This example shows why recurrence must be expanded before aggregation. The final shopping list depends on both the recurrence schedule and the serving adjustment for each occurrence.

---

## Initial Frontend Screens

To make the product easier to build incrementally, the first version can focus on these screens:

1. **Recipe list page**
2. **Recipe details page**
3. **Meal plan builder page with calendar recurrence controls**
4. **Shopping list page with item status tracking**
5. **Household profile page for defaults and preferences**

This keeps the app focused on the primary value: selecting meals and understanding what to buy.

Note for later: a recipe suggestion flow can be added in the future so users can submit ideas or requests for new recipes, which an administrator can then review and add to the official catalog.

Another important next step is a **profile page** where users can review their meal planning history and other relevant personal data, such as previous meal plans, recurring recipe choices, and past shopping lists.

Other strong future extensions include:

- **shared household planning**, so multiple people in the same household can collaborate on the calendar and shopping list;
- **recipe suggestion flow**, where users submit ideas and administrators approve them into the catalog;
- **profile history page**, where users can revisit previous plans, shopping results, and recurring planning patterns.

The current frontend now includes that profile history page and supports filtering it by plan or custom date interval.

---

## Questions the Frontend Contract Should Already Answer

Before the backend is created, this document should make the following clear:

- What fields exist on a recipe?
- How are ingredients represented?
- How does a user selection become a meal plan entry?
- How does the app calculate ingredient totals?
- What mocked data files are needed to support UI development?

If these answers are stable, the backend can later mirror the same object structure with minimal friction.

---

## Implementation Status

The frontend foundation described in this document has already been implemented with mocked data and working screens for the core user flow.

In addition to the original MVP foundation, the current frontend also includes:

- multiple mocked meal plans covering `this_week`, `next_week`, `this_month`, and `custom_range`;
- active plan selection shared between the planner, planned meals page, and shopping list page;
- empty-plan creation for starting a new planning setup without modifying seeded examples;
- a tabbed planner flow with setup, meal entry, entry list, and calendar overview tabs;
- strict active-plan window validation so out-of-range meals and recurrences are rejected or pruned;
- recurrence-aware shopping list aggregation tied to the selected plan;
- shopping list status tracking per active plan;
- meal-occurrence filtering inside the shopping list;
- a floating shopping progress widget for quick progress visibility;
- a profile history page that can filter saved plan summaries by selected plan or custom date interval.

The remaining work is now focused on future extensions rather than the original MVP foundation.

---

## Frontend Checklist

This checklist reflects the current implementation status of the frontend.

### Phase 1 — Foundation

- [x] **Create shared TypeScript types**
	- Add the base types for `Recipe`, `RecipeIngredient`, `RecipeInstruction`, `MealPlan`, `MealPlanEntry`, `RecurrenceRule`, `ShoppingListItem`, and `HouseholdProfile`.
	- This should live under `src/lib/types/` and become the single source of truth for the frontend contract.

- [x] **Create mock data files**
	- Add `src/lib/mocks/recipes.ts`, `src/lib/mocks/meal-plans.ts`, `src/lib/mocks/household-profile.ts`, and `src/lib/mocks/shopping-list.ts`.
	- These files should mirror the documented examples in this file.

- [x] **Implement the shopping list calculation helper**
	- Build a helper that expands recurring entries, scales ingredient quantities by servings, aggregates equal ingredients, and returns `ShoppingListItem[]`.
	- This logic should live in `src/lib/utils/` so components stay focused on presentation.

- [x] **Implement planning preset helpers**
	- Add utilities for `this_week`, `next_week`, `this_month`, and `custom_range`.
	- These helpers should produce consistent `start_date` and `end_date` values for the meal plan.

### Phase 2 — Planning State

- [x] **Create the household profile store**
	- Store defaults such as `default_servings` and other household planning preferences.
	- This should live in `src/lib/stores/` using the project rune-based store pattern.

- [x] **Create the meal planning store**
	- Store current plan data, entries, recurrence edits, selected period, and any calendar conflict state.
	- This state layer should be designed so one-time and recurring entries are easy to update.

- [x] **Support multiple saved meal plans with active selection**
	- Keep more than one mocked meal plan available at the same time.
	- Let the UI switch the active plan consistently across the planner, planned meals page, and shopping list page.

- [x] **Support empty-plan creation and strict plan windows**
	- Let users create a fresh plan with no meals assigned.
	- Keep the active plan range authoritative by rejecting or pruning out-of-range entries and recurrences.

- [x] **Add recurrence expansion and series editing support**
	- Support both editing a single occurrence and editing the full recurring series.
	- Keep `series_id` handling explicit so future backend integration is straightforward.

- [x] **Add conflict detection logic**
	- Warn when the same meal slot already has a recipe or when a selected time range becomes overloaded.
	- This should happen before finalizing meal plan changes in the UI.

### Phase 3 — MVP Screens

- [x] **Build the recipe list page**
	- Show recipes from mocked data with search and the basic recipe card information.
	- Keep the first version simple and optimized for quick browsing.

- [x] **Build the recipe details page**
	- Show ingredients, instructions, servings, timing, and tags.
	- Include a clear call to add the recipe to the meal plan.

- [x] **Build the meal plan builder page**
	- Add calendar-based planning, meal slot assignment, servings override, recurrence creation, and recurrence editing.
	- This is the main workflow screen and should be treated as the core experience.
	- The current implementation also includes a tabbed flow and a calendar overview tab for the active range.

- [x] **Build the shopping list page**
	- Show aggregated items, grouped totals, and status tracking such as `pending`, `bought`, `skipped`, and `already_available`.
	- This page should consume the calculation helper output instead of duplicating logic.
	- The current implementation also supports meal-level filtering and a persistent progress widget.

- [x] **Build the household profile page**
	- Let users configure default servings and household preferences relevant to the current MVP.
	- This page should connect directly to the household profile store.

### Phase 4 — Follow-Up Features

- [x] **Add profile history page**
	- Show previous meal plans, recurring planning patterns, and past shopping summaries.
	- This supports retention and helps users reuse successful plans.
	- The current implementation also supports filtering the history by saved plan or custom date interval.

- [ ] **Add recipe suggestion flow**
	- Let users submit recipe ideas for administrator review.
	- Keep it separate from the administrator-managed recipe catalog.

- [ ] **Add shared household planning**
	- Allow multiple household members to collaborate on meal planning and shopping progress.
	- This should come later, after the single-user flow is stable.

### Definition Of Done For MVP

- [x] A user can browse recipes from mocked data.
- [x] A user can open recipe details and add a recipe to a meal plan.
- [x] A user can create one-time and recurring meal plan entries from a calendar.
- [x] A user can generate an aggregated shopping list with serving-aware totals.
- [x] A user can mark shopping list items by status.
- [x] A user can configure default household servings.