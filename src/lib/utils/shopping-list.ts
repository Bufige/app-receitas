import type {
	ExpandedMealPlanEntry,
	MealType,
	ShoppingListItem,
} from "$lib/types/planning";

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
