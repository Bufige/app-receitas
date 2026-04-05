import { mock_meal_plans } from "$lib/mocks/meal-plans";
import { mock_recipes } from "$lib/mocks/recipes";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

export const mock_shopping_list = calculate_shopping_list(
	mock_recipes,
	mock_meal_plans[0],
);
