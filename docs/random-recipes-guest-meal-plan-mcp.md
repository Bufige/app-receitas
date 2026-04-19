# Random Recipes Guest Meal Plan MCP

## Goal
Use the backend `RandomRecipesUseCase` to generate a weekly guest meal plan from real API recipes instead of recycling the local recipe catalog in the homepage CTA flow.

## Flow
1. The homepage CTA in `src/routes/+page.svelte` calls `recipesApi.random()`.
2. The frontend sends:
   - `amount`: `14`
   - `country`: inferred from `infer_recipe_location()`
   - `region`: inferred from `infer_recipe_location()` when available
   - `prep_time_max`: `60`
3. The backend route `GET /recipes/random` resolves through `RandomRecipesUseCase`.
4. The frontend maps the returned backend recipes with `backend_recipe_to_ui_recipe()`.
5. The mapped recipes are merged into the client recipe catalog.
6. The current guest meal plan is replaced in one store operation and synced to `PUT /meal-plans/:meal_plan_id`.

## Frontend Files
- `src/lib/api/recipes.ts`
- `src/lib/queries/recipes.ts`
- `src/lib/stores/meal-plan.svelte.ts`
- `src/lib/utils/backend-adapters.ts`
- `src/routes/+page.svelte`

## Backend Files
- `src/routes/recipes.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesController.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesUseCase.ts`
- `src/usecases/Recipe/RandomRecipes/RandomRecipesDTO.ts`

## Notes
- The guest plan is not recreated on every click; the current API-backed plan is updated.
- The recipe catalog is upserted locally so recipe names, detail pages, and planner UI continue to resolve the newly generated recipes.
- The store uses a single `replaceEntries()` call to avoid a burst of incremental plan updates.