import { browser } from "$app/environment";
import { mock_meal_plans } from "$lib/mocks/meal-plans";
import { mock_recipes } from "$lib/mocks/recipes";
import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
import type {
	MealPlan,
	MealPlanEntry,
	PlanningPreset,
	RecurrenceRule,
	ShoppingItemStatus,
} from "$lib/types/planning";
import {
	detect_meal_plan_conflicts,
	get_preset_range,
} from "$lib/utils/planning";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

const PLAN_STORAGE_KEY = "meal_plan";
const STATUS_STORAGE_KEY = "shopping_item_statuses";

function clone_plan(plan: MealPlan): MealPlan {
	return JSON.parse(JSON.stringify(plan)) as MealPlan;
}

function default_plan(): MealPlan {
	return clone_plan(mock_meal_plans[0]);
}

function load_plan(): MealPlan {
	if (!browser) {
		return default_plan();
	}

	try {
		const stored = localStorage.getItem(PLAN_STORAGE_KEY);

		if (!stored) {
			return default_plan();
		}

		return {
			...default_plan(),
			...(JSON.parse(stored) as MealPlan),
		};
	} catch {
		return default_plan();
	}
}

function save_plan(plan: MealPlan) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
	} catch {
		return;
	}
}

function load_statuses(): Record<string, ShoppingItemStatus> {
	if (!browser) {
		return {};
	}

	try {
		const stored = localStorage.getItem(STATUS_STORAGE_KEY);
		return stored
			? (JSON.parse(stored) as Record<string, ShoppingItemStatus>)
			: {};
	} catch {
		return {};
	}
}

function save_statuses(statuses: Record<string, ShoppingItemStatus>) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statuses));
	} catch {
		return;
	}
}

let meal_plan = $state<MealPlan>(default_plan());
let shopping_item_statuses = $state<Record<string, ShoppingItemStatus>>({});
let initialized = $state(false);

function hydrate() {
	if (!browser || initialized) {
		return;
	}

	meal_plan = load_plan();
	shopping_item_statuses = load_statuses();
	initialized = true;
}

function persist_plan() {
	save_plan(meal_plan);
}

function persist_statuses() {
	save_statuses(shopping_item_statuses);
}

function update_plan(updates: Partial<MealPlan>) {
	meal_plan = { ...meal_plan, ...updates };
	persist_plan();
}

function build_entry_id(): string {
	return crypto.randomUUID();
}

function build_series_id(): string {
	return `series-${crypto.randomUUID()}`;
}

export function useMealPlanStore() {
	hydrate();
	const household_profile = useHouseholdProfileStore();

	return {
		get mealPlan() {
			return meal_plan;
		},
		get recipes() {
			return mock_recipes;
		},
		get conflicts() {
			return detect_meal_plan_conflicts(
				meal_plan.entries,
				meal_plan.start_date,
				meal_plan.end_date,
			);
		},
		get shoppingList() {
			return calculate_shopping_list(
				mock_recipes,
				meal_plan,
				shopping_item_statuses,
			);
		},
		get shoppingItemStatuses() {
			return shopping_item_statuses;
		},
		setPeriod(period: MealPlan["period"]) {
			update_plan({ period });
		},
		setPlanningPreset(preset: PlanningPreset) {
			const range = get_preset_range(preset);
			update_plan({
				planning_preset: preset,
				start_date: range.start_date,
				end_date: range.end_date,
			});
		},
		setCustomRange(start_date: string, end_date: string) {
			update_plan({
				planning_preset: "custom_range",
				start_date,
				end_date,
			});
		},
		setName(name: string) {
			update_plan({ name });
		},
		addEntry(entry: {
			recipe_id: string;
			date: string;
			meal_type: MealPlanEntry["meal_type"];
			servings?: number;
			recurrence_rule?: RecurrenceRule;
		}) {
			const next_entry: MealPlanEntry = {
				id: build_entry_id(),
				recipe_id: entry.recipe_id,
				date: entry.date,
				meal_type: entry.meal_type,
				servings: entry.servings ?? household_profile.profile.default_servings,
				recurrence_rule: entry.recurrence_rule,
				series_id: entry.recurrence_rule ? build_series_id() : undefined,
			};
			meal_plan = {
				...meal_plan,
				entries: [...meal_plan.entries, next_entry],
			};
			persist_plan();
		},
		updateEntry(entry_id: string, updates: Partial<MealPlanEntry>) {
			meal_plan = {
				...meal_plan,
				entries: meal_plan.entries.map((entry) =>
					entry.id === entry_id ? { ...entry, ...updates } : entry,
				),
			};
			persist_plan();
		},
		updateSeries(series_id: string, updates: Partial<MealPlanEntry>) {
			meal_plan = {
				...meal_plan,
				entries: meal_plan.entries.map((entry) =>
					entry.series_id === series_id ? { ...entry, ...updates } : entry,
				),
			};
			persist_plan();
		},
		removeEntry(entry_id: string) {
			meal_plan = {
				...meal_plan,
				entries: meal_plan.entries.filter((entry) => entry.id !== entry_id),
			};
			persist_plan();
		},
		setShoppingItemStatus(ingredient_id: string, status: ShoppingItemStatus) {
			shopping_item_statuses = {
				...shopping_item_statuses,
				[ingredient_id]: status,
			};
			persist_statuses();
		},
		reset() {
			meal_plan = default_plan();
			shopping_item_statuses = {};
			persist_plan();
			persist_statuses();
		},
	};
}
