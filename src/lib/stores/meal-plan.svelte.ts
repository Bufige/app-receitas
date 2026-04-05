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

const LEGACY_PLAN_STORAGE_KEY = "meal_plan";
const PLANS_STORAGE_KEY = "meal_plans";
const ACTIVE_PLAN_STORAGE_KEY = "active_meal_plan_id";
const STATUS_STORAGE_KEY = "shopping_item_statuses";

function clone_plan(plan: MealPlan): MealPlan {
	return JSON.parse(JSON.stringify(plan)) as MealPlan;
}

function default_plans(): MealPlan[] {
	return mock_meal_plans.map((plan) => clone_plan(plan));
}

function default_plan(): MealPlan {
	return clone_plan(default_plans()[0]);
}

function default_active_plan_id(plans: MealPlan[] = default_plans()): string {
	return plans[0]?.id ?? "";
}

function get_active_plan(plans: MealPlan[], active_plan_id: string): MealPlan {
	return (
		plans.find((plan) => plan.id === active_plan_id) ??
		plans[0] ??
		default_plan()
	);
}

function load_plans(): MealPlan[] {
	if (!browser) {
		return default_plans();
	}

	try {
		const stored_plans = localStorage.getItem(PLANS_STORAGE_KEY);

		if (stored_plans) {
			const parsed = JSON.parse(stored_plans) as MealPlan[];
			return parsed.length > 0 ? parsed : default_plans();
		}

		const legacy_plan = localStorage.getItem(LEGACY_PLAN_STORAGE_KEY);

		if (!legacy_plan) {
			return default_plans();
		}

		const fallback_plans = default_plans();
		return [
			{
				...fallback_plans[0],
				...(JSON.parse(legacy_plan) as MealPlan),
			},
			...fallback_plans.slice(1),
		];
	} catch {
		return default_plans();
	}
}

function save_plans(plans: MealPlan[]) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
	} catch {
		return;
	}
}

function load_active_plan_id(plans: MealPlan[]): string {
	if (!browser) {
		return default_active_plan_id(plans);
	}

	try {
		const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
		if (stored && plans.some((plan) => plan.id === stored)) {
			return stored;
		}

		return default_active_plan_id(plans);
	} catch {
		return default_active_plan_id(plans);
	}
}

function save_active_plan_id(active_plan_id: string) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, active_plan_id);
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

let meal_plans = $state<MealPlan[]>(default_plans());
let active_plan_id = $state(default_active_plan_id());
let shopping_item_statuses = $state<Record<string, ShoppingItemStatus>>({});
let initialized = $state(false);

function hydrate() {
	if (!browser || initialized) {
		return;
	}

	meal_plans = load_plans();
	active_plan_id = load_active_plan_id(meal_plans);
	shopping_item_statuses = load_statuses();
	initialized = true;
}

function persist_plans() {
	save_plans(meal_plans);
	save_active_plan_id(active_plan_id);
}

function persist_statuses() {
	save_statuses(shopping_item_statuses);
}

function update_plan(updates: Partial<MealPlan>) {
	const current_plan = get_active_plan(meal_plans, active_plan_id);
	meal_plans = meal_plans.map((plan) =>
		plan.id === current_plan.id ? { ...plan, ...updates } : plan,
	);
	persist_plans();
}

function build_entry_id(): string {
	return crypto.randomUUID();
}

function build_series_id(): string {
	return `series-${crypto.randomUUID()}`;
}

function build_status_key(plan_id: string, ingredient_id: string): string {
	return `${plan_id}:${ingredient_id}`;
}

function get_active_plan_statuses(): Record<string, ShoppingItemStatus> {
	const current_plan = get_active_plan(meal_plans, active_plan_id);
	const prefix = `${current_plan.id}:`;

	return Object.fromEntries(
		Object.entries(shopping_item_statuses)
			.filter(([key]) => key.startsWith(prefix))
			.map(([key, value]) => [key.slice(prefix.length), value]),
	) as Record<string, ShoppingItemStatus>;
}

export function useMealPlanStore() {
	hydrate();
	const household_profile = useHouseholdProfileStore();

	return {
		get mealPlans() {
			return meal_plans;
		},
		get activePlanId() {
			return active_plan_id;
		},
		get mealPlan() {
			return get_active_plan(meal_plans, active_plan_id);
		},
		get recipes() {
			return mock_recipes;
		},
		get conflicts() {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			return detect_meal_plan_conflicts(
				current_plan.entries,
				current_plan.start_date,
				current_plan.end_date,
			);
		},
		get shoppingList() {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			return calculate_shopping_list(
				mock_recipes,
				current_plan,
				get_active_plan_statuses(),
			);
		},
		get shoppingItemStatuses() {
			return get_active_plan_statuses();
		},
		selectPlan(plan_id: string) {
			if (!meal_plans.some((plan) => plan.id === plan_id)) {
				return;
			}

			active_plan_id = plan_id;
			persist_plans();
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
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			const next_entry: MealPlanEntry = {
				id: build_entry_id(),
				recipe_id: entry.recipe_id,
				date: entry.date,
				meal_type: entry.meal_type,
				servings: entry.servings ?? household_profile.profile.default_servings,
				recurrence_rule: entry.recurrence_rule,
				series_id: entry.recurrence_rule ? build_series_id() : undefined,
			};
			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id
					? { ...plan, entries: [...plan.entries, next_entry] }
					: plan,
			);
			persist_plans();
		},
		updateEntry(entry_id: string, updates: Partial<MealPlanEntry>) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id
					? {
							...plan,
							entries: plan.entries.map((entry) =>
								entry.id === entry_id ? { ...entry, ...updates } : entry,
							),
						}
					: plan,
			);
			persist_plans();
		},
		updateSeries(series_id: string, updates: Partial<MealPlanEntry>) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id
					? {
							...plan,
							entries: plan.entries.map((entry) =>
								entry.series_id === series_id
									? { ...entry, ...updates }
									: entry,
							),
						}
					: plan,
			);
			persist_plans();
		},
		removeEntry(entry_id: string) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id
					? {
							...plan,
							entries: plan.entries.filter((entry) => entry.id !== entry_id),
						}
					: plan,
			);
			persist_plans();
		},
		setShoppingItemStatus(ingredient_id: string, status: ShoppingItemStatus) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			shopping_item_statuses = {
				...shopping_item_statuses,
				[build_status_key(current_plan.id, ingredient_id)]: status,
			};
			persist_statuses();
		},
		reset() {
			meal_plans = default_plans();
			active_plan_id = default_active_plan_id(meal_plans);
			shopping_item_statuses = {};
			persist_plans();
			persist_statuses();
		},
	};
}
