import { mock_meal_plans } from "$lib/mocks/meal-plans";
import { get_recipe_by_id, mock_recipes } from "$lib/mocks/recipes";
import type { MealPlan, MealPlanEntry } from "$lib/types/planning";
import { expand_meal_plan_entries } from "$lib/utils/planning";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

export type PlanHistorySummary = {
	id: string;
	name: string;
	period: MealPlan["period"];
	start_date?: string;
	end_date?: string;
	total_occurrences: number;
	shopping_item_count: number;
	recurring_series_count: number;
	top_recipe_names: string[];
	recent_activity: {
		id: string;
		recipe_name: string;
		date: string;
		recurrence_ends_on?: string;
	}[];
};

function count_recurring_series(entries: MealPlanEntry[]): number {
	const series_ids = new Set(
		entries
			.map((entry) => entry.series_id)
			.filter((series_id): series_id is string => Boolean(series_id)),
	);

	return series_ids.size;
}

function get_top_recipe_names(plan: MealPlan): string[] {
	const expanded_entries = expand_meal_plan_entries(
		plan.entries,
		plan.start_date,
		plan.end_date,
	);
	const counts = new Map<string, number>();

	for (const entry of expanded_entries) {
		counts.set(entry.recipe_id, (counts.get(entry.recipe_id) ?? 0) + 1);
	}

	return [...counts.entries()]
		.sort((first, second) => second[1] - first[1])
		.slice(0, 3)
		.map(([recipe_id]) => get_recipe_by_id(recipe_id)?.name ?? recipe_id);
}

function build_recent_activity(
	plan: MealPlan,
): PlanHistorySummary["recent_activity"] {
	const expanded_entries = expand_meal_plan_entries(
		plan.entries,
		plan.start_date,
		plan.end_date,
	)
		.sort((first, second) =>
			second.occurrence_date.localeCompare(first.occurrence_date),
		)
		.slice(0, 4);

	return expanded_entries.map((entry) => ({
		id: `${plan.id}-${entry.id}-${entry.occurrence_date}`,
		recipe_name: get_recipe_by_id(entry.recipe_id)?.name ?? entry.recipe_id,
		date: entry.occurrence_date,
		recurrence_ends_on: entry.recurrence_rule?.ends_on,
	}));
}

export function build_plan_history_summaries(
	plans: MealPlan[],
): PlanHistorySummary[] {
	return plans.map((plan) => {
		const expanded_entries = expand_meal_plan_entries(
			plan.entries,
			plan.start_date,
			plan.end_date,
		);
		const shopping_list = calculate_shopping_list(mock_recipes, plan);

		return {
			id: plan.id,
			name: plan.name,
			period: plan.period,
			start_date: plan.start_date,
			end_date: plan.end_date,
			total_occurrences: expanded_entries.length,
			shopping_item_count: shopping_list.length,
			recurring_series_count: count_recurring_series(plan.entries),
			top_recipe_names: get_top_recipe_names(plan),
			recent_activity: build_recent_activity(plan),
		};
	});
}

export const mock_plan_history = build_plan_history_summaries(mock_meal_plans);
