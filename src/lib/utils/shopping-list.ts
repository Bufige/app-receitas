import type {
	ExpandedMealPlanEntry,
	MealPlan,
	MealType,
	ShoppingItemStatus,
	ShoppingListItem,
} from "$lib/types/planning";
import type { Recipe } from "$lib/types/recipe";
import {
	expand_meal_plan_entries,
	get_preset_range,
} from "$lib/utils/planning";

function round_quantity(value: number): number {
	return Math.round(value * 100) / 100;
}

export function build_planned_meal_key(entry: {
	source_entry_id: string;
	occurrence_date: string;
	meal_type: MealType;
}): string {
	return `${entry.source_entry_id}:${entry.occurrence_date}:${entry.meal_type}`;
}

export function filter_occurrences_by_selected_meals(
	occurrences: ExpandedMealPlanEntry[],
	selected_keys: string[],
): ExpandedMealPlanEntry[] {
	if (selected_keys.length === 0) {
		return [];
	}

	return occurrences.filter((entry) =>
		selected_keys.includes(build_planned_meal_key(entry)),
	);
}

export function calculate_shopping_list_from_occurrences(
	recipes: Recipe[],
	occurrences: ExpandedMealPlanEntry[],
	item_statuses: Record<string, ShoppingItemStatus | undefined> = {},
): ShoppingListItem[] {
	const recipe_map = new Map(recipes.map((recipe) => [recipe.id, recipe]));
	const aggregated_items = new Map<string, ShoppingListItem>();

	for (const occurrence of occurrences) {
		const recipe = recipe_map.get(occurrence.recipe_id);

		if (!recipe) {
			continue;
		}

		const serving_factor = occurrence.servings / recipe.servings;

		for (const ingredient of recipe.ingredients) {
			const current_item = aggregated_items.get(ingredient.id);
			const next_quantity = round_quantity(
				ingredient.quantity * serving_factor,
			);

			if (current_item) {
				current_item.total_quantity = round_quantity(
					current_item.total_quantity + next_quantity,
				);
				continue;
			}

			aggregated_items.set(ingredient.id, {
				ingredient_id: ingredient.id,
				name: ingredient.name,
				total_quantity: next_quantity,
				unit: ingredient.unit,
				category: ingredient.category,
				status: item_statuses[ingredient.id] ?? "pending",
			});
		}
	}

	return [...aggregated_items.values()].sort((first, second) => {
		if (first.category === second.category) {
			return first.name.localeCompare(second.name);
		}

		return first.category.localeCompare(second.category);
	});
}

export function calculate_shopping_list(
	recipes: Recipe[],
	meal_plan: MealPlan,
	item_statuses: Record<string, ShoppingItemStatus | undefined> = {},
): ShoppingListItem[] {
	const fallback_range = meal_plan.planning_preset
		? get_preset_range(meal_plan.planning_preset)
		: undefined;
	const start_date = meal_plan.start_date ?? fallback_range?.start_date;
	const end_date = meal_plan.end_date ?? fallback_range?.end_date;
	const expanded_entries = expand_meal_plan_entries(
		meal_plan.entries,
		start_date,
		end_date,
	);

	return calculate_shopping_list_from_occurrences(
		recipes,
		expanded_entries,
		item_statuses,
	);
}

export function group_shopping_list_by_category(items: ShoppingListItem[]): {
	category: string;
	items: ShoppingListItem[];
}[] {
	const grouped_items = new Map<string, ShoppingListItem[]>();

	for (const item of items) {
		const category_items = grouped_items.get(item.category) ?? [];
		category_items.push(item);
		grouped_items.set(item.category, category_items);
	}

	return [...grouped_items.entries()].map(([category, category_items]) => ({
		category,
		items: category_items,
	}));
}
