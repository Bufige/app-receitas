import { browser } from "$app/environment";
import { mealPlansApi } from "$lib/api/meal-plans";
import { recipesApi } from "$lib/api/recipes";
import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
import type { BackendMealPlan } from "$lib/types/backend";
import type {
	MealPlan,
	MealPlanEntry,
	PlanningPreset,
	RecurrenceRule,
	ShoppingItemStatus,
	ShoppingListItem,
} from "$lib/types/planning";
import type { Recipe } from "$lib/types/recipe";
import {
	backend_meal_plan_to_ui_plan,
	backend_recipe_to_ui_recipe,
	backend_shopping_list_to_ui_items,
	ui_entry_to_backend_recipe_slot,
} from "$lib/utils/backend-adapters";
import {
	detect_meal_plan_conflicts,
	get_preset_range,
	type PlanWindowValidationResult,
	validate_meal_plan_entry_window,
} from "$lib/utils/planning";
import { calculate_shopping_list } from "$lib/utils/shopping-list";

const ACTIVE_PLAN_STORAGE_KEY = "active_meal_plan_id";
const STATUS_STORAGE_KEY = "shopping_item_statuses";
const GUEST_PLAN_STORAGE_KEY = "guest_meal_plan_id";
const DEFAULT_HOME_HOUSEHOLD_ID = "household-home-default";

function default_plan(household_id = DEFAULT_HOME_HOUSEHOLD_ID): MealPlan {
	const range = get_preset_range("this_week");

	return {
		id: "",
		household_id,
		name: "My plan",
		period: "week",
		planning_preset: "this_week",
		start_date: range.start_date,
		end_date: range.end_date,
		entries: [],
	};
}

function build_entry_id(): string {
	return crypto.randomUUID();
}

function build_plan_name(plans: MealPlan[]): string {
	return `Plan ${plans.length + 1}`;
}

function build_series_id(): string {
	return `series-${crypto.randomUUID()}`;
}

function get_plans_for_household(
	plans: MealPlan[],
	household_id: string,
): MealPlan[] {
	const matching_plans = plans.filter(
		(plan) => plan.household_id === household_id,
	);

	return matching_plans.length > 0 ? matching_plans : plans;
}

function get_active_plan(plans: MealPlan[], active_plan_id: string): MealPlan {
	return (
		plans.find((plan) => plan.id === active_plan_id) ??
		plans[0] ??
		default_plan()
	);
}

function load_active_plan_id(plans: MealPlan[]): string {
	if (!browser) {
		return plans[0]?.id ?? "";
	}

	try {
		const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
		if (stored && plans.some((plan) => plan.id === stored)) {
			return stored;
		}

		return plans[0]?.id ?? "";
	} catch {
		return plans[0]?.id ?? "";
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

function build_status_key(plan_id: string, ingredient_id: string): string {
	return `${plan_id}:${ingredient_id}`;
}

function get_active_plan_statuses(
	plan_id: string,
	statuses: Record<string, ShoppingItemStatus>,
): Record<string, ShoppingItemStatus> {
	const prefix = `${plan_id}:`;

	return Object.fromEntries(
		Object.entries(statuses)
			.filter(([key]) => key.startsWith(prefix))
			.map(([key, value]) => [key.slice(prefix.length), value]),
	) as Record<string, ShoppingItemStatus>;
}

function apply_statuses(
	items: ShoppingListItem[],
	statuses: Record<string, ShoppingItemStatus>,
): ShoppingListItem[] {
	return items.map((item) => ({
		...item,
		status: statuses[item.ingredient_id] ?? item.status ?? "pending",
	}));
}

function map_backend_plans(meal_plans: BackendMealPlan[]): MealPlan[] {
	return meal_plans.map((plan) => backend_meal_plan_to_ui_plan(plan));
}

function normalize_profile_id(household_id?: string): string | undefined {
	if (!household_id || household_id.startsWith("household-")) {
		return undefined;
	}

	return household_id;
}

function to_backend_period(period: MealPlan["period"]): "weekly" | "monthly" {
	return period === "month" ? "monthly" : "weekly";
}

let meal_plans = $state<MealPlan[]>([]);
let recipe_catalog = $state<Recipe[]>([]);
let shopping_lists_by_plan_id = $state<Record<string, ShoppingListItem[]>>({});
let active_plan_id = $state("");
let shopping_item_statuses = $state<Record<string, ShoppingItemStatus>>({});
let initialized = $state(false);
let loading = $state(false);
let loading_promise: Promise<void> | null = null;

async function load_recipes() {
	const response = await recipesApi.list({ page: 0, limit: 100 });
	recipe_catalog = response.data.map((recipe) =>
		backend_recipe_to_ui_recipe(recipe),
	);
}

async function create_remote_plan(
	name: string,
	household_id?: string,
): Promise<MealPlan> {
	const range = get_preset_range("this_week");
	const response = await mealPlansApi.create({
		name,
		period: "weekly",
		start_date: range.start_date,
		end_date: range.end_date,
		profile_id: normalize_profile_id(household_id),
		recipes: [],
	});
	const next_plan = backend_meal_plan_to_ui_plan(response.data);
	meal_plans = [
		next_plan,
		...meal_plans.filter((plan) => plan.id !== next_plan.id),
	];
	active_plan_id = next_plan.id;
	save_active_plan_id(active_plan_id);

	if (browser) {
		localStorage.setItem(GUEST_PLAN_STORAGE_KEY, next_plan.id);
	}

	await refresh_shopping_list(next_plan.id);
	return next_plan;
}

async function load_guest_plan(): Promise<MealPlan[]> {
	const stored_plan_id = browser
		? localStorage.getItem(GUEST_PLAN_STORAGE_KEY)
		: null;

	if (stored_plan_id) {
		try {
			const response = await mealPlansApi.get(stored_plan_id);
			return [backend_meal_plan_to_ui_plan(response.data)];
		} catch {
			if (browser) {
				localStorage.removeItem(GUEST_PLAN_STORAGE_KEY);
			}
		}
	}

	const created_plan = await create_remote_plan("My plan");
	return [created_plan];
}

async function load_meal_plans() {
	const has_token = browser && Boolean(localStorage.getItem("auth_token"));

	if (has_token) {
		try {
			const response = await mealPlansApi.list();
			const next_plans = map_backend_plans(response.data);

			if (next_plans.length > 0) {
				meal_plans = next_plans;
				active_plan_id = load_active_plan_id(next_plans);
				save_active_plan_id(active_plan_id);
				return;
			}
		} catch {
			return;
		}
	}

	meal_plans = await load_guest_plan();
	active_plan_id = load_active_plan_id(meal_plans);
	save_active_plan_id(active_plan_id);
}

async function refresh_shopping_list(plan_id: string) {
	if (!plan_id) {
		return;
	}

	try {
		const response = await mealPlansApi.getShoppingList(plan_id);
		shopping_lists_by_plan_id = {
			...shopping_lists_by_plan_id,
			[plan_id]: backend_shopping_list_to_ui_items(response.data),
		};
	} catch {
		return;
	}
}

async function ensure_loaded() {
	if (!browser || initialized) {
		return;
	}

	if (loading_promise) {
		return loading_promise;
	}

	loading = true;
	loading_promise = (async () => {
		shopping_item_statuses = load_statuses();
		await load_recipes();
		await load_meal_plans();

		if (active_plan_id) {
			await refresh_shopping_list(active_plan_id);
		}

		initialized = true;
		loading = false;
		loading_promise = null;
	})();

	return loading_promise;
}

function hydrate() {
	if (!browser || initialized || loading) {
		return;
	}

	void ensure_loaded();
}

async function sync_remote_plan(plan: MealPlan) {
	if (!plan.id) {
		return;
	}

	try {
		const response = await mealPlansApi.update(plan.id, {
			name: plan.name,
			period: to_backend_period(plan.period),
			start_date: plan.start_date ?? null,
			end_date: plan.end_date ?? null,
			profile_id: normalize_profile_id(plan.household_id),
			recipes: plan.entries.map((entry) =>
				ui_entry_to_backend_recipe_slot(entry),
			),
		});

		const next_plan = backend_meal_plan_to_ui_plan(response.data);
		meal_plans = meal_plans.map((current_plan) =>
			current_plan.id === next_plan.id ? next_plan : current_plan,
		);
		await refresh_shopping_list(next_plan.id);
	} catch {
		return;
	}
}

function schedule_remote_sync(plan: MealPlan) {
	void sync_remote_plan(plan);
}

function update_local_plan(
	plan_id: string,
	updater: (plan: MealPlan) => MealPlan,
) {
	let next_plan: MealPlan | null = null;

	meal_plans = meal_plans.map((plan) => {
		if (plan.id !== plan_id) {
			return plan;
		}

		next_plan = updater(plan);
		return next_plan;
	});

	if (next_plan) {
		schedule_remote_sync(next_plan);
	}
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

	return plans[0]?.id ?? "";
}

function update_active_plan_range(
	updates: Pick<MealPlan, "planning_preset" | "start_date" | "end_date">,
) {
	const current_plan = get_active_plan(meal_plans, active_plan_id);
	const next_plan: MealPlan = {
		...current_plan,
		...updates,
	};
	const filtered_entries = next_plan.entries.filter(
		(entry) => validate_meal_plan_entry_window(entry, next_plan).ok,
	);
	const removed_entries = current_plan.entries.length - filtered_entries.length;

	update_local_plan(current_plan.id, () => ({
		...next_plan,
		entries: filtered_entries,
	}));

	return { removedEntries: removed_entries };
}

function update_plan(updates: Partial<MealPlan>) {
	const current_plan = get_active_plan(meal_plans, active_plan_id);
	update_local_plan(current_plan.id, (plan) => ({ ...plan, ...updates }));
}

function clear_plan_statuses(plan_id: string) {
	shopping_item_statuses = Object.fromEntries(
		Object.entries(shopping_item_statuses).filter(
			([key]) => !key.startsWith(`${plan_id}:`),
		),
	) as Record<string, ShoppingItemStatus>;
	save_statuses(shopping_item_statuses);
}

function merge_recipe_catalog(recipes: Recipe[]) {
	const existing_recipes_by_id = new Map(
		recipe_catalog.map((recipe) => [recipe.id, recipe]),
	);

	for (const recipe of recipes) {
		existing_recipes_by_id.set(recipe.id, recipe);
	}

	recipe_catalog = [...existing_recipes_by_id.values()];
}

export function useMealPlanStore() {
	hydrate();
	const household_profile = useHouseholdProfileStore();

	return {
		get isLoading() {
			return loading;
		},
		async ensureReady() {
			await ensure_loaded();
		},
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
			return get_active_plan(meal_plans, active_plan_id).id;
		},
		get mealPlan() {
			return get_active_plan(meal_plans, active_plan_id);
		},
		get recipes() {
			return recipe_catalog;
		},
		mergeRecipes(recipes: Recipe[]) {
			merge_recipe_catalog(recipes);
		},
		replaceEntries(entries: MealPlanEntry[]) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			const valid_entries = entries.filter(
				(entry) => validate_meal_plan_entry_window(entry, current_plan).ok,
			);

			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: valid_entries,
			}));
		},
		replacePlan(options: {
			period: MealPlan["period"];
			planning_preset: PlanningPreset;
			start_date: string;
			end_date: string;
			entries: MealPlanEntry[];
		}) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			const next_plan: MealPlan = {
				...current_plan,
				period: options.period,
				planning_preset: options.planning_preset,
				start_date: options.start_date,
				end_date: options.end_date,
			};
			const valid_entries = options.entries.filter(
				(entry) => validate_meal_plan_entry_window(entry, next_plan).ok,
			);

			clear_plan_statuses(current_plan.id);
			update_local_plan(current_plan.id, () => ({
				...next_plan,
				entries: valid_entries,
			}));
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
			const statuses = get_active_plan_statuses(
				current_plan.id,
				shopping_item_statuses,
			);
			const remote_items = shopping_lists_by_plan_id[current_plan.id];

			if (remote_items) {
				return apply_statuses(remote_items, statuses);
			}

			return calculate_shopping_list(recipe_catalog, current_plan, statuses);
		},
		get shoppingItemStatuses() {
			return get_active_plan_statuses(active_plan_id, shopping_item_statuses);
		},
		selectPlan(plan_id: string) {
			if (!meal_plans.some((plan) => plan.id === plan_id)) {
				return;
			}

			active_plan_id = plan_id;
			save_active_plan_id(active_plan_id);
			void refresh_shopping_list(plan_id);
		},
		async createPlan(household_id = household_profile.activeHouseholdId) {
			await ensure_loaded();
			return create_remote_plan(build_plan_name(meal_plans), household_id);
		},
		setPeriod(period: MealPlan["period"]) {
			update_plan({ period });
		},
		setPlanningPreset(preset: PlanningPreset) {
			const range = get_preset_range(preset);
			return update_active_plan_range({
				planning_preset: preset,
				start_date: range.start_date,
				end_date: range.end_date,
			});
		},
		setCustomRange(start_date: string, end_date: string) {
			return update_active_plan_range({
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
		}): PlanWindowValidationResult {
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
			const validation = validate_meal_plan_entry_window(
				next_entry,
				current_plan,
			);

			if (!validation.ok) {
				return validation;
			}

			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: [...plan.entries, next_entry],
			}));

			return { ok: true };
		},
		updateEntry(
			entry_id: string,
			updates: Partial<MealPlanEntry>,
		): PlanWindowValidationResult {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
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

			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: plan.entries.map((entry) =>
					entry.id === entry_id ? { ...entry, ...updates } : entry,
				),
			}));

			return { ok: true };
		},
		updateSeries(
			series_id: string,
			updates: Partial<MealPlanEntry>,
		): PlanWindowValidationResult {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
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

			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: plan.entries.map((entry) =>
					entry.series_id === series_id ? { ...entry, ...updates } : entry,
				),
			}));

			return { ok: true };
		},
		removeEntry(entry_id: string) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: plan.entries.filter((entry) => entry.id !== entry_id),
			}));
		},
		setShoppingItemStatus(ingredient_id: string, status: ShoppingItemStatus) {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			shopping_item_statuses = {
				...shopping_item_statuses,
				[build_status_key(current_plan.id, ingredient_id)]: status,
			};
			save_statuses(shopping_item_statuses);
		},
		clearPlan() {
			const current_plan = get_active_plan(meal_plans, active_plan_id);
			update_local_plan(current_plan.id, (plan) => ({
				...plan,
				entries: [],
			}));
			clear_plan_statuses(current_plan.id);
		},
		deleteCurrentPlan() {
			const current_plan = get_active_plan(meal_plans, active_plan_id);

			if (!current_plan.id) {
				return false;
			}

			meal_plans = meal_plans.filter((plan) => plan.id !== current_plan.id);
			shopping_item_statuses = Object.fromEntries(
				Object.entries(shopping_item_statuses).filter(
					([key]) => !key.startsWith(`${current_plan.id}:`),
				),
			) as Record<string, ShoppingItemStatus>;
			active_plan_id = resolve_active_plan_id(
				meal_plans,
				household_profile.activeHouseholdId,
			);
			save_active_plan_id(active_plan_id);
			save_statuses(shopping_item_statuses);
			void mealPlansApi.delete(current_plan.id);

			if (meal_plans.length === 0) {
				void create_remote_plan("My plan");
			}

			return true;
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
			save_active_plan_id(active_plan_id);
			save_statuses(shopping_item_statuses);

			for (const plan_id of deleted_plan_ids) {
				void mealPlansApi.delete(plan_id);
			}
		},
		reset() {
			shopping_item_statuses = {};
			save_statuses(shopping_item_statuses);
			initialized = false;
			void ensure_loaded();
		},
	};
}
