# Mock Backend Entity Alignment Plan

## Goal
Align the frontend mock source data with the backend entity model for `Profile`, `Recipe`, `MealPlan`, and `Ingredient` while keeping the current UI and stores working.

## Approach
1. Add a backend-shaped fixture source in `src/lib/mocks/backend-entities.ts`.
2. Keep the existing frontend exports in `src/lib/mocks/` as adapters so the app can continue consuming the current frontend types.
3. Mirror backend naming in the raw mock source:
   - `Profile.type`
   - `Profile.default_serving`
   - `Profile.ingredients_disliked`
   - `Recipe.tags` as pivots with nested `tag`
   - `Recipe.ingredients` as pivots with nested `ingredient`
   - `MealPlan.profile_id`
   - `MealPlan.recipes` as `MealPlanRecipe[]`
4. Convert backend-shaped meal plan recipes into frontend `entries` by expanding each `day_of_week` across the configured `start_date` and `end_date`.
5. Preserve existing frontend helper exports such as `mock_recipes`, `mock_meal_plans`, `mock_household_profiles`, and `mock_shopping_list`.

## Data Mapping Rules
- Backend `Profile.type` maps to frontend `HouseholdProfile.kind`.
- Backend `Profile.default_serving` maps to frontend `HouseholdProfile.default_servings`.
- Backend `Profile.ingredients_disliked` maps to frontend `HouseholdProfile.disliked_ingredients`.
- Backend `RecipeTag.tag.name` maps to frontend `Recipe.tags[]`.
- Backend `RecipeIngredient.ingredient` maps to frontend ingredient display fields.
- Backend ingredient categories stay in backend singular form like `grain`, `vegetable`, `spice`, and `oil`.
- Backend `MealPlan.period` maps from `weekly | monthly` to frontend `week | month`.

## Follow-up Work
- Revisit frontend domain types so they can eventually consume backend-shaped payloads directly instead of adapter-mapped fixtures.
- Add a shared transformation layer for real API responses and mocks to avoid duplicate mapping logic.
- Expand shopping list grouping labels if the UI needs friendlier names for backend ingredient categories.
- Replace any remaining frontend-only mock field names with backend-compatible naming over time.
