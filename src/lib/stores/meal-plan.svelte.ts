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
	type PlanWindowValidationResult,
	validate_meal_plan_entry_window,
} from "$lib/utils/planning";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

const LEGACY_PLAN_STORAGE_KEY = "meal_plan";
const PLANS_STORAGE_KEY = "meal_plans";
const ACTIVE_PLAN_STORAGE_KEY = "active_meal_plan_id";
const STATUS_STORAGE_KEY = "shopping_item_statuses";
const DEFAULT_HOME_HOUSEHOLD_ID = "household-home-001";

function clone_plan(plan: MealPlan): MealPlan {
	return JSON.parse(JSON.stringify(plan)) as MealPlan;
}

function normalize_plan(plan: MealPlan): MealPlan {
	return {
		...plan,
		household_id: plan.household_id ?? DEFAULT_HOME_HOUSEHOLD_ID,
	};
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

function get_plans_for_household(
	plans: MealPlan[],
	household_id: string,
): MealPlan[] {
	return plans.filter((plan) => plan.household_id === household_id);
}

function get_active_plan(
	plans: MealPlan[],
	active_plan_id: string,
	household_id: string,
): MealPlan {
	const visible_plans = get_plans_for_household(plans, household_id);

	return (
		visible_plans.find((plan) => plan.id === active_plan_id) ??
		visible_plans[0] ??
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
			const parsed = (JSON.parse(stored_plans) as MealPlan[]).map((plan) =>
				normalize_plan(plan),
			);
			return parsed.length > 0 ? parsed : default_plans();
		}

		const legacy_plan = localStorage.getItem(LEGACY_PLAN_STORAGE_KEY);

		if (!legacy_plan) {
			return default_plans();
		}

		const fallback_plans = default_plans();
		return [
			normalize_plan({
				...fallback_plans[0],
				...(JSON.parse(legacy_plan) as MealPlan),
			}),
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

function resolve_active_plan_id(
	plans: MealPlan[],
	preferred_household_id?: string,
): string {
	if (preferred_household_id) {
		const household_plan = plans.find(
			(plan) => plan.household_id === preferred_household_id,
		);

		if (household_plan) {
			return household_plan.id;
		}
	}

	return default_active_plan_id(plans);
}

function filter_entries_for_plan_window(plan: MealPlan): MealPlanEntry[] {
	return plan.entries.filter(
		(entry) => validate_meal_plan_entry_window(entry, plan).ok,
	);
}

function update_active_plan_range(
	household_id: string,
	updates: Pick<MealPlan, "planning_preset" | "start_date" | "end_date">,
) {
	const current_plan = get_active_plan(
		meal_plans,
		active_plan_id,
		household_id,
	);
	const next_plan: MealPlan = {
		...current_plan,
		...updates,
	};
	const filtered_entries = filter_entries_for_plan_window(next_plan);
	const removed_entries = current_plan.entries.length - filtered_entries.length;

	meal_plans = meal_plans.map((plan) =>
		plan.id === current_plan.id
			? {
					...next_plan,
					entries: filtered_entries,
				}
			: plan,
	);
	persist_plans();

	return { removedEntries: removed_entries };
}

function update_plan(household_id: string, updates: Partial<MealPlan>) {
	const current_plan = get_active_plan(
		meal_plans,
		active_plan_id,
		household_id,
	);
	meal_plans = meal_plans.map((plan) =>
		plan.id === current_plan.id ? { ...plan, ...updates } : plan,
	);
	persist_plans();
}

function build_entry_id(): string {
	return crypto.randomUUID();
}

function build_plan_id(): string {
	return `meal-plan-${crypto.randomUUID()}`;
}

function build_plan_name(plans: MealPlan[], household_name: string): string {
	return `${household_name} Plan ${plans.length + 1}`;
}

function build_series_id(): string {
	return `series-${crypto.randomUUID()}`;
}

function build_empty_plan(
	plans: MealPlan[],
	household: { id: string; name: string },
): MealPlan {
	const range = get_preset_range("this_week");
	const household_plans = get_plans_for_household(plans, household.id);

	return {
		id: build_plan_id(),
		household_id: household.id,
		name: build_plan_name(household_plans, household.name),
		period: "week",
		planning_preset: "this_week",
		start_date: range.start_date,
		end_date: range.end_date,
		entries: [],
	};
}

function build_status_key(plan_id: string, ingredient_id: string): string {
	return `${plan_id}:${ingredient_id}`;
}

function get_active_plan_statuses(
	household_id: string,
): Record<string, ShoppingItemStatus> {
	const current_plan = get_active_plan(
		meal_plans,
		active_plan_id,
		household_id,
	);
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
		get allMealPlans() {
			return meal_plans;
		},
		get mealPlans() {
			return get_plans_for_household(
				meal_plans,
				household_profile.activeHouseholdId,
			);
		},
		get activePlanId() {
			return get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			).id;
		},
		get mealPlan() {
			return get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
		},
		get recipes() {
			return mock_recipes;
		},
		get conflicts() {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			return detect_meal_plan_conflicts(
				current_plan.entries,
				current_plan.start_date,
				current_plan.end_date,
			);
		},
		get shoppingList() {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			return calculate_shopping_list(
				mock_recipes,
				current_plan,
				get_active_plan_statuses(household_profile.activeHouseholdId),
			);
		},
		get shoppingItemStatuses() {
			return get_active_plan_statuses(household_profile.activeHouseholdId);
		},
		selectPlan(plan_id: string) {
			if (!meal_plans.some((plan) => plan.id === plan_id)) {
				return;
			}

			active_plan_id = plan_id;
			persist_plans();
		},
		createPlan(household_id = household_profile.activeHouseholdId) {
			const household =
				household_profile.profiles.find(
					(profile) => profile.id === household_id,
				) ?? household_profile.profile;
			const next_plan = build_empty_plan(meal_plans, household);
			meal_plans = [next_plan, ...meal_plans];
			active_plan_id = next_plan.id;
			persist_plans();
		},
		setPeriod(period: MealPlan["period"]) {
			update_plan(household_profile.activeHouseholdId, { period });
		},
		setPlanningPreset(preset: PlanningPreset) {
			const range = get_preset_range(preset);
			return update_active_plan_range(household_profile.activeHouseholdId, {
				planning_preset: preset,
				start_date: range.start_date,
				end_date: range.end_date,
			});
		},
		setCustomRange(start_date: string, end_date: string) {
			return update_active_plan_range(household_profile.activeHouseholdId, {
				planning_preset: "custom_range",
				start_date,
				end_date,
			});
		},
		setName(name: string) {
			update_plan(household_profile.activeHouseholdId, { name });
		},
		addEntry(entry: {
			recipe_id: string;
			date: string;
			meal_type: MealPlanEntry["meal_type"];
			servings?: number;
			recurrence_rule?: RecurrenceRule;
		}): PlanWindowValidationResult {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			const next_entry: MealPlanEntry = {
				id: build_entry_id(),
				recipe_id: entry.recipe_id,
				date: entry.date,
				meal_type: entry.meal_type,
				servings: entry.servings ?? household_profile.profile.default_servings,
				recurrence_rule: entry.recurrence_rule,
				series_id: entry.recurrence_rule ? build_series_id() : undefined,
			};
			const validation = validate_meal_plan_entry_window(
				next_entry,
				current_plan,
			);

			if (!validation.ok) {
				return validation;
			}

			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id
					? { ...plan, entries: [...plan.entries, next_entry] }
					: plan,
			);
			persist_plans();
			return { ok: true };
		},
		updateEntry(
			entry_id: string,
			updates: Partial<MealPlanEntry>,
		): PlanWindowValidationResult {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			const current_entry = current_plan.entries.find(
				(entry) => entry.id === entry_id,
			);

			if (!current_entry) {
				return { ok: true };
			}

			const next_entry = { ...current_entry, ...updates };
			const validation = validate_meal_plan_entry_window(
				next_entry,
				current_plan,
			);

			if (!validation.ok) {
				return validation;
			}

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
			return { ok: true };
		},
		updateSeries(
			series_id: string,
			updates: Partial<MealPlanEntry>,
		): PlanWindowValidationResult {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			const series_entries = current_plan.entries.filter(
				(entry) => entry.series_id === series_id,
			);

			const invalid_entry = series_entries.find((entry) => {
				const validation = validate_meal_plan_entry_window(
					{ ...entry, ...updates },
					current_plan,
				);

				return !validation.ok;
			});

			if (invalid_entry) {
				return validate_meal_plan_entry_window(
					{ ...invalid_entry, ...updates },
					current_plan,
				);
			}

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
			return { ok: true };
		},
		removeEntry(entry_id: string) {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
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
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			shopping_item_statuses = {
				...shopping_item_statuses,
				[build_status_key(current_plan.id, ingredient_id)]: status,
			};
			persist_statuses();
		},
		clearPlan() {
			const current_plan = get_active_plan(
				meal_plans,
				active_plan_id,
				household_profile.activeHouseholdId,
			);
			meal_plans = meal_plans.map((plan) =>
				plan.id === current_plan.id ? { ...plan, entries: [] } : plan,
			);
			shopping_item_statuses = Object.fromEntries(
				Object.entries(shopping_item_statuses).filter(
					([key]) => !key.startsWith(`${current_plan.id}:`),
				),
			) as Record<string, ShoppingItemStatus>;
			persist_plans();
			persist_statuses();
		},
		deleteHouseholdPlans(
			household_id: string,
			next_household_id = household_profile.activeHouseholdId,
		) {
			const deleted_plan_ids = meal_plans
				.filter((plan) => plan.household_id === household_id)
				.map((plan) => plan.id);

			if (deleted_plan_ids.length === 0) {
				return;
			}

			meal_plans = meal_plans.filter(
				(plan) => plan.household_id !== household_id,
			);
			shopping_item_statuses = Object.fromEntries(
				Object.entries(shopping_item_statuses).filter(
					([key]) =>
						!deleted_plan_ids.some((plan_id) => key.startsWith(`${plan_id}:`)),
				),
			) as Record<string, ShoppingItemStatus>;
			active_plan_id = resolve_active_plan_id(meal_plans, next_household_id);
			persist_plans();
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
