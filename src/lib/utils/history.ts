import type { MealPlan, MealPlanEntry } from "$lib/types/planning";
import type { Recipe } from "$lib/types/recipe";
import {
	expand_meal_plan_entries,
	format_iso_date,
	parse_iso_date,
} from "$lib/utils/planning";

function get_recipe_name(recipes: Recipe[], recipe_id: string): string {
	return recipes.find((recipe) => recipe.id === recipe_id)?.name ?? recipe_id;
}

export type PlanHistoryRange = {
	start_date?: string;
	end_date?: string;
};

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
		plan_id: string;
		plan_name: string;
		recipe_name: string;
		date: string;
		recurrence_ends_on?: string;
	}[];
};

function clamp_plan_range(
	plan: MealPlan,
	range?: PlanHistoryRange,
): PlanHistoryRange | null {
	const plan_start = plan.start_date
		? parse_iso_date(plan.start_date)
		: undefined;
	const plan_end = plan.end_date ? parse_iso_date(plan.end_date) : undefined;
	const range_start = range?.start_date
		? parse_iso_date(range.start_date)
		: undefined;
	const range_end = range?.end_date
		? parse_iso_date(range.end_date)
		: undefined;

	const effective_start =
		plan_start && range_start
			? new Date(Math.max(plan_start.getTime(), range_start.getTime()))
			: (plan_start ?? range_start);
	const effective_end =
		plan_end && range_end
			? new Date(Math.min(plan_end.getTime(), range_end.getTime()))
			: (plan_end ?? range_end);

	if (effective_start && effective_end && effective_start > effective_end) {
		return null;
	}

	return {
		start_date: effective_start ? format_iso_date(effective_start) : undefined,
		end_date: effective_end ? format_iso_date(effective_end) : undefined,
	};
}

function get_history_occurrences(plan: MealPlan, range?: PlanHistoryRange) {
	const effective_range = clamp_plan_range(plan, range);

	if (!effective_range) {
		return [];
	}

	return expand_meal_plan_entries(
		plan.entries,
		effective_range.start_date,
		effective_range.end_date,
	);
}

function count_recurring_series(entries: MealPlanEntry[]): number {
	const series_ids = new Set(
		entries
			.map((entry) => entry.series_id)
			.filter((series_id): series_id is string => Boolean(series_id)),
	);

	return series_ids.size;
}

function build_top_recipe_names(
	recipes: Recipe[],
	occurrences: ReturnType<typeof get_history_occurrences>,
): string[] {
	const counts = new Map<string, number>();

	for (const entry of occurrences) {
		counts.set(entry.recipe_id, (counts.get(entry.recipe_id) ?? 0) + 1);
	}

	return [...counts.entries()]
		.sort((first, second) => second[1] - first[1])
		.slice(0, 3)
		.map(([recipe_id]) => get_recipe_name(recipes, recipe_id));
}

function build_recent_activity(
	plan: MealPlan,
	recipes: Recipe[],
	range?: PlanHistoryRange,
): PlanHistorySummary["recent_activity"] {
	const expanded_entries = get_history_occurrences(plan, range)
		.sort((first, second) =>
			second.occurrence_date.localeCompare(first.occurrence_date),
		)
		.slice(0, 4);

	return expanded_entries.map((entry) => ({
		id: `${plan.id}-${entry.id}-${entry.occurrence_date}`,
		plan_id: plan.id,
		plan_name: plan.name,
		recipe_name: get_recipe_name(recipes, entry.recipe_id),
		date: entry.occurrence_date,
		recurrence_ends_on: entry.recurrence_rule?.ends_on,
	}));
}

export function build_history_top_recipe_names(
	plans: MealPlan[],
	recipes: Recipe[],
	range?: PlanHistoryRange,
): string[] {
	const counts = new Map<string, number>();

	for (const plan of plans) {
		for (const occurrence of get_history_occurrences(plan, range)) {
			counts.set(
				occurrence.recipe_id,
				(counts.get(occurrence.recipe_id) ?? 0) + 1,
			);
		}
	}

	return [...counts.entries()]
		.sort((first, second) => second[1] - first[1])
		.slice(0, 5)
		.map(([recipe_id]) => get_recipe_name(recipes, recipe_id));
}

export function build_history_recent_activity(
	plans: MealPlan[],
	recipes: Recipe[],
	range?: PlanHistoryRange,
): PlanHistorySummary["recent_activity"] {
	return plans
		.flatMap((plan) => build_recent_activity(plan, recipes, range))
		.sort((first, second) => second.date.localeCompare(first.date))
		.slice(0, 8);
}

export function build_plan_history_summaries(
	plans: MealPlan[],
	recipes: Recipe[],
	range?: PlanHistoryRange,
): PlanHistorySummary[] {
	return plans.map((plan) => {
		const effective_range = clamp_plan_range(plan, range);
		const expanded_entries = effective_range
			? get_history_occurrences(plan, range)
			: [];
		const active_entry_ids = new Set(
			expanded_entries.map((entry) => entry.source_entry_id),
		);
		const active_entries = plan.entries.filter((entry) =>
			active_entry_ids.has(entry.id),
		);

		return {
			id: plan.id,
			name: plan.name,
			period: plan.period,
			start_date: effective_range?.start_date ?? plan.start_date,
			end_date: effective_range?.end_date ?? plan.end_date,
			total_occurrences: expanded_entries.length,
			shopping_item_count: 0,
			recurring_series_count: count_recurring_series(active_entries),
			top_recipe_names: build_top_recipe_names(recipes, expanded_entries),
			recent_activity: build_recent_activity(plan, recipes, range),
		};
	});
}
