import { mock_meal_plans } from "$lib/mocks/meal-plans";
import { mock_recipes } from "$lib/mocks/recipes";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

export const mock_shopping_list = calculate_shopping_list(
	mock_recipes,
	mock_meal_plans[0],
);

export const mock_shopping_lists_by_time_range = mock_meal_plans.map(
	(plan) => ({
		plan_id: plan.id,
		name: plan.name,
		planning_preset: plan.planning_preset,
		start_date: plan.start_date,
		end_date: plan.end_date,
		items: calculate_shopping_list(mock_recipes, plan),
	}),
);
