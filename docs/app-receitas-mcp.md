# App Receitas MCP

## Goal
Document the current frontend ↔ backend integrations for recipe generation, meal-plan persistence, calendar regeneration, shopping-list refreshes, and backend/UI date normalization.

## Main Integrations

### Homepage Weekly Generation
1. The CTA in `src/routes/+page.svelte` calls `meal_plan_store.ensureReady()`.
2. The frontend selects the default `home` household and updates its local default servings to `2` before generation.
3. The frontend requests `GET /recipes/random` through `recipesApi.random()` with only:
   - `amount`: `14`
4. The backend resolves that request through `RandomRecipesUseCase`.
5. Returned backend recipes are mapped with `backend_recipe_to_ui_recipe()`.
6. The mapped recipes are merged into the local recipe catalog with `meal_plan_store.mergeRecipes()`.
7. The homepage resolves the target range with `get_preset_range("this_week")`.
8. The homepage builds `7 × 2` entries (`lunch` and `dinner`) using `collect_plan_dates()`.
9. The plan is replaced in one batched store operation with `meal_plan_store.replacePlan()` using:
   - `period: "week"`
   - `planning_preset: "this_week"`
   - `start_date`
   - `end_date`
   - `entries`
10. That single store update syncs the current plan to `PUT /meal-plans/:meal_plan_id`.

### Recipe Detail by Slug
1. The detail route is `src/routes/recipes/[slug]/+page.svelte`.
2. On access, the page creates a TanStack query with `createQuery()`.
3. The frontend requests `GET /recipes/:recipe_id` through `recipesApi.get(recipe_slug)`.
4. The backend `GetRecipeUseCase` inspects the route parameter with `z.uuid().safeParse(...)`:
   - valid UUID → `recipeRepository.getById(...)`
   - otherwise → `recipeRepository.getBySlug(...)`
5. Returned backend recipes are mapped with `backend_recipe_to_ui_recipe()` before rendering.
6. The page keeps a local fallback from `meal_plan_store.recipes` while the remote query resolves.
7. The detail route can therefore open correctly from slug-based frontend URLs without requiring the recipe to be preloaded in local state.

### Calendar Regeneration
1. The planner calendar page in `src/routes/planner/calendar/+page.svelte` supports:
   - `this_week`
   - `next_two_weeks`
   - `this_month`
2. Calendar actions build a recipe pool locally with `build_recipe_pool()`.
3. The page generates `lunch` and `dinner` entries for every day in the selected range.
4. The page commits the full regeneration with `meal_plan_store.replacePlan()`.
5. `replacePlan()` updates:
   - `period`
   - `planning_preset`
   - `start_date`
   - `end_date`
   - `entries`
6. This batching avoids the earlier request spam from repeated `setPeriod()` / `setPlanningPreset()` / `clearPlan()` / `addEntry()` calls.
7. The result is one plan sync and one shopping-list refresh instead of one request per generated meal.

### Meal Plan Syncing
1. The API wrapper in `src/lib/api/meal-plans.ts` handles:
   - `GET /meal-plans`
   - `GET /meal-plans/:meal_plan_id`
   - `POST /meal-plans`
   - `PUT /meal-plans/:meal_plan_id`
   - `DELETE /meal-plans/:meal_plan_id`
   - `GET /meal-plans/:meal_plan_id/shopping-list`
2. The store in `src/lib/stores/meal-plan.svelte.ts` keeps the active API-backed plan in local state.
3. Any local plan mutation routes through `update_local_plan()`.
4. `update_local_plan()` schedules `sync_remote_plan()`.
5. `sync_remote_plan()` sends the full plan payload to `mealPlansApi.update()`.
6. After a successful update, the store refreshes `GET /meal-plans/:meal_plan_id/shopping-list` once.
7. Batched entry updates like homepage generation, calendar regeneration, and day-level calendar saves should prefer a single `replacePlan()` or `replaceEntries()` call so only one remote sync is scheduled.

### Shopping List Integration
1. The shopping list for the active plan is fetched with `mealPlansApi.getShoppingList()`.
2. Backend shopping-list items are mapped with `backend_shopping_list_to_ui_items()`.
3. Local item completion state is stored separately in `shopping_item_statuses`.
4. The frontend no longer calculates shopping quantities, serving proportions, or ingredient aggregation locally for the active plan.
5. `meal_plan_store.shoppingList` now returns backend shopping-list items plus local status overlays only.
6. Batched plan replacement clears saved shopping statuses for the current plan before syncing the new plan shape.

### Date Normalization
1. The backend validates `start_date` and `end_date` as ISO datetimes.
2. `src/lib/api/meal-plans.ts` normalizes outgoing date-only values like `YYYY-MM-DD` to UTC datetimes:
   - start boundary → `T00:00:00Z`
   - end boundary → `T23:59:59Z`
3. `src/lib/utils/backend-adapters.ts` normalizes incoming backend meal-plan dates back to `YYYY-MM-DD` for the UI.
4. `parse_iso_date()` in `src/lib/utils/planning.ts` accepts both date-only strings and full ISO datetimes.
5. This keeps:
   - calendar overview rendering
   - plan date expansion
   - recurrence handling
   - generated date collection
   consistent across frontend and backend formats.

## Frontend Files
- `src/routes/+page.svelte`
- `src/routes/recipes/[slug]/+page.svelte`
- `src/routes/planner/calendar/+page.svelte`
- `src/lib/api/recipes.ts`
- `src/lib/api/meal-plans.ts`
- `src/lib/queries/keys.ts`
- `src/lib/stores/meal-plan.svelte.ts`
- `src/lib/utils/backend-adapters.ts`
- `src/lib/utils/planning.ts`
- `src/lib/utils/recipe-generation.ts`

## Backend Files
- `src/routes/recipes.ts`
- `src/usecases/Recipe/GetRecipe/GetRecipeController.ts`
- `src/usecases/Recipe/GetRecipe/GetRecipeDTO.ts`
- `src/usecases/Recipe/GetRecipe/GetRecipeUseCase.ts`
- `src/usecases/Recipe/GetRecipe/GetRecipeValidate.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesController.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesUseCase.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesDTO.ts`
- `src/interfaces/IRecipeRepository.ts`
- `src/repositories/postgresql/RecipeRepository.ts`
- `src/usecases/MealPlan/CreateMealPlan/CreateMealPlanValidate.ts`
- `src/usecases/MealPlan/UpdateMealPlan/UpdateMealPlanValidate.ts`
- `src/usecases/MealPlan/sharedSchemas.ts`

## Notes
- The guest meal plan is updated in place; it is not recreated on every homepage generation.
- The homepage random recipe request currently requires only `amount`, even though the API wrapper still supports optional recipe filters.
- The homepage now uses `replacePlan()` instead of a separate preset update plus `replaceEntries()` so weekly generation triggers only one plan sync.
- The calendar uses `replacePlan()` because it must change both the date range and the generated entries in one remote sync.
- The recipe detail page now depends on the backend route and supports slug-based URLs even when the local recipe catalog is empty.
- `GetRecipeUseCase` explicitly branches by UUID vs slug using `zod`, instead of always querying by `id` first.
- Shopping-list totals and quantities for the active plan are backend-owned; the frontend only groups returned items and overlays local status state.
- Backend recipe and meal-plan payloads are adapted into the UI model before rendering, so recipe pages, planner views, and shopping lists all read from a consistent frontend shape.