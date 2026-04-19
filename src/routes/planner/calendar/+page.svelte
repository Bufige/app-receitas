<script lang="ts">
	import { useQueryClient } from "@tanstack/svelte-query";
	import cartOutline from "@iconify-icons/mdi/cart-outline";
	import deleteOutline from "@iconify-icons/mdi/delete-outline";
	import magnify from "@iconify-icons/mdi/magnify";
	import Icon from "@iconify/svelte";
	import { browser } from "$app/environment";
	import { recipesApi } from "$lib/api/recipes";
	import Button from "$lib/components/ui/Button/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import Modal from "$lib/components/ui/Modal/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { queryKeys } from "$lib/queries/keys";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type {
		ExpandedMealPlanEntry,
		MealPlanEntry,
		MealType,
		PlanningPreset,
	} from "$lib/types/planning";
	import type { Recipe } from "$lib/types/recipe";
	import { announce } from "$lib/utils/announce";
	import { backend_recipe_to_ui_recipe } from "$lib/utils/backend-adapters";
	import {
		build_recipe_pool,
		collect_plan_dates,
	} from "$lib/utils/recipe-generation";
	import {
		expand_meal_plan_entries,
		format_iso_date,
		format_plan_range_label,
		get_next_two_weeks_range,
		get_preset_range,
		parse_iso_date,
	} from "$lib/utils/planning";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();
	const query_client = useQueryClient();
	const meal_types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
	const generated_meal_types: MealType[] = ["lunch", "dinner"];
	const RECIPE_SEARCH_LIMIT = 5;
	const RECIPE_SEARCH_DEBOUNCE_MS = 250;
	type CalendarRangeAction = "month" | "two_weeks" | "week";
	type DayMealDraft = {
		local_id: string;
		entry_id: string | null;
		date: string;
		recipe_id: string;
		meal_type: MealType;
		search_query: string;
	};

	let is_regenerating = $state<CalendarRangeAction | null>(null);
	let calendar_feedback = $state<string | null>(null);
	let selected_day = $state<OverviewDay | null>(null);
	let day_meal_drafts = $state<DayMealDraft[]>([]);
	let day_modal_feedback = $state<string | null>(null);
	let recipe_search_results = $state<Record<string, Recipe[]>>({});
	let recipe_search_loading = $state<Record<string, boolean>>({});
	let next_day_draft_count = 0;
	let next_recipe_search_request_id = 0;
	const recipe_search_timeouts = new Map<
		string,
		ReturnType<typeof setTimeout>
	>();
	const recipe_search_request_ids = new Map<string, number>();

	type OverviewDay = {
		date: string;
		date_label: string;
		weekday_label: string;
		entry_count: number;
		slots: Record<MealType, ExpandedMealPlanEntry[]>;
	};

	const expanded_entries = $derived.by(() =>
		expand_meal_plan_entries(
			meal_plan_store.mealPlan.entries,
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
		),
	);
	const plan_range_label = $derived.by(() =>
		format_plan_range_label(meal_plan_store.mealPlan),
	);
	const active_plan_summary = $derived.by(
		() =>
			`${plan_range_label} · ${expanded_entries.length} ${m.planner_overview_occurrences().toLowerCase()}`,
	);
	const weekday_headers = $derived.by(() => {
		const formatter = new Intl.DateTimeFormat(undefined, {
			weekday: "short",
		});

		return Array.from({ length: 7 }, (_, index) => {
			const date = new Date(2024, 0, 1 + index, 12);
			return formatter.format(date);
		});
	});
	const overview_days = $derived.by(() => {
		const grouped = new Map<
			string,
			Record<MealType, ExpandedMealPlanEntry[]>
		>();

		for (const entry of expanded_entries) {
			const slots = grouped.get(entry.occurrence_date) ?? {
				breakfast: [],
				lunch: [],
				dinner: [],
				snack: [],
			};

			slots[entry.meal_type].push(entry);
			grouped.set(entry.occurrence_date, slots);
		}

		const start_date = meal_plan_store.mealPlan.start_date;
		const end_date = meal_plan_store.mealPlan.end_date;

		if (!start_date || !end_date) {
			return [] as OverviewDay[];
		}

		const date_formatter = new Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
		});
		const weekday_formatter = new Intl.DateTimeFormat(undefined, {
			weekday: "short",
		});
		const days: OverviewDay[] = [];
		const current_date = parse_iso_date(start_date);
		const range_end = parse_iso_date(end_date);

		while (current_date <= range_end) {
			const iso_date = format_iso_date(current_date);
			const slots = grouped.get(iso_date) ?? {
				breakfast: [],
				lunch: [],
				dinner: [],
				snack: [],
			};

			days.push({
				date: iso_date,
				date_label: date_formatter.format(current_date),
				weekday_label: weekday_formatter.format(current_date),
				entry_count: meal_types.reduce(
					(total, meal_type) => total + slots[meal_type].length,
					0,
				),
				slots,
			});

			current_date.setDate(current_date.getDate() + 1);
		}

		return days;
	});
	const overview_cells = $derived.by(() => {
		if (overview_days.length === 0) {
			return [] as Array<OverviewDay | null>;
		}

		const first_day = parse_iso_date(overview_days[0].date);
		const leading_empty_days = (first_day.getDay() + 6) % 7;
		const cells: Array<OverviewDay | null> = [
			...Array.from({ length: leading_empty_days }, () => null),
			...overview_days,
		];
		const trailing_empty_days = (7 - (cells.length % 7)) % 7;

		return [
			...cells,
			...Array.from({ length: trailing_empty_days }, () => null),
		];
	});
	const current_range_action = $derived.by<CalendarRangeAction>(() =>
		get_current_range_action(
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
		),
	);
	const available_calendar_actions = $derived.by<
		Array<{
			key: CalendarRangeAction;
			label: string;
			loading: boolean;
			handler: () => void;
		}>
	>(() => {
		const actions = [
			{
				key: "month" as const,
				label: m.planner_calendar_generate_month(),
				loading: is_regenerating === "month",
				handler: regenerate_month_plan,
			},
			{
				key: "two_weeks" as const,
				label: m.planner_calendar_generate_two_weeks(),
				loading: is_regenerating === "two_weeks",
				handler: regenerate_next_two_weeks_plan,
			},
			{
				key: "week" as const,
				label: m.planner_calendar_generate_week(),
				loading: is_regenerating === "week",
				handler: regenerate_this_week,
			},
		];

		return actions.filter((action) => action.key !== current_range_action);
	});

	function get_range_day_count(start_date: string, end_date: string) {
		const start = parse_iso_date(start_date);
		const end = parse_iso_date(end_date);
		const milliseconds_per_day = 1000 * 60 * 60 * 24;

		return (
			Math.round((end.getTime() - start.getTime()) / milliseconds_per_day) + 1
		);
	}

	function get_current_range_action(
		start_date?: string,
		end_date?: string,
	): CalendarRangeAction {
		if (!start_date || !end_date) {
			return "week";
		}

		const this_month = get_preset_range("this_month");
		if (
			start_date === this_month.start_date &&
			end_date === this_month.end_date
		) {
			return "month";
		}

		const this_week = get_preset_range("this_week");
		if (
			start_date === this_week.start_date &&
			end_date === this_week.end_date
		) {
			return "week";
		}

		const next_two_weeks = get_next_two_weeks_range();
		if (
			start_date === next_two_weeks.start_date &&
			end_date === next_two_weeks.end_date
		) {
			return "two_weeks";
		}

		const day_count = get_range_day_count(start_date, end_date);

		if (day_count <= 7) {
			return "week";
		}

		if (day_count <= 15) {
			return "two_weeks";
		}

		return "month";
	}

	function show_calendar_feedback(message: string) {
		calendar_feedback = message;
		announce(message);
	}

	function build_day_meal_draft(
		date: string,
		meal_type: MealType = "dinner",
		entry?: ExpandedMealPlanEntry,
	): DayMealDraft {
		next_day_draft_count += 1;

		return {
			local_id: entry?.source_entry_id ?? `day-draft-${next_day_draft_count}`,
			entry_id: entry?.source_entry_id ?? null,
			date,
			recipe_id: entry?.recipe_id ?? meal_plan_store.recipes[0]?.id ?? "",
			meal_type: entry?.meal_type ?? meal_type,
			search_query: "",
		};
	}

	function get_used_day_meal_types(excluding_local_id?: string): MealType[] {
		return day_meal_drafts.reduce<MealType[]>((used_meal_types, draft) => {
			if (draft.local_id === excluding_local_id) {
				return used_meal_types;
			}

			if (used_meal_types.includes(draft.meal_type)) {
				return used_meal_types;
			}

			return [...used_meal_types, draft.meal_type];
		}, []);
	}

	function get_available_day_meal_types(local_id?: string): MealType[] {
		const current_draft = local_id
			? day_meal_drafts.find((draft) => draft.local_id === local_id)
			: undefined;
		const used_meal_types = new Set(get_used_day_meal_types(local_id));

		return meal_types.filter(
			(meal_type) =>
				meal_type === current_draft?.meal_type ||
				!used_meal_types.has(meal_type),
		);
	}

	function build_day_label(day: OverviewDay) {
		return `${day.weekday_label} · ${day.date_label}`;
	}

	function open_day_modal(day: OverviewDay) {
		selected_day = day;
		day_modal_feedback = null;

		const drafts = meal_types.flatMap((meal_type) =>
			day.slots[meal_type].map((entry) =>
				build_day_meal_draft(day.date, meal_type, entry),
			),
		);

		day_meal_drafts = drafts;
	}

	function close_day_modal() {
		clear_recipe_search_state();
		selected_day = null;
		day_meal_drafts = [];
		day_modal_feedback = null;
	}

	function should_ignore_day_activation(event: MouseEvent) {
		return event.target instanceof Element
			? Boolean(event.target.closest("a, button, input, select, textarea"))
			: false;
	}

	function handle_day_click(day: OverviewDay, event: MouseEvent) {
		if (should_ignore_day_activation(event)) {
			return;
		}

		open_day_modal(day);
	}

	function handle_day_keydown(day: OverviewDay, event: KeyboardEvent) {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}

		event.preventDefault();
		open_day_modal(day);
	}

	function update_day_draft(local_id: string, updates: Partial<DayMealDraft>) {
		const available_meal_types = updates.meal_type
			? get_available_day_meal_types(local_id)
			: [];

		day_meal_drafts = day_meal_drafts.map((draft) =>
			draft.local_id === local_id
				? {
						...draft,
						...updates,
						meal_type:
							updates.meal_type &&
							available_meal_types.includes(updates.meal_type)
								? updates.meal_type
								: updates.meal_type
									? draft.meal_type
									: draft.meal_type,
					}
				: draft,
		);
	}

	function add_day_meal_draft() {
		if (!selected_day) {
			return;
		}

		const next_available_meal_type = get_available_day_meal_types()[0];

		if (!next_available_meal_type) {
			return;
		}

		day_meal_drafts = [
			...day_meal_drafts,
			build_day_meal_draft(selected_day.date, next_available_meal_type),
		];
	}

	function remove_day_meal_draft(local_id: string) {
		clear_recipe_search_state(local_id);
		day_meal_drafts = day_meal_drafts.filter(
			(draft) => draft.local_id !== local_id,
		);
		day_modal_feedback = null;
	}

	function get_selected_recipe(selected_recipe_id: string): Recipe | undefined {
		return meal_plan_store.recipes.find(
			(recipe) => recipe.id === selected_recipe_id,
		);
	}

	function include_selected_recipe(
		recipes: Recipe[],
		selected_recipe_id: string,
	): Recipe[] {
		const selected_recipe = get_selected_recipe(selected_recipe_id);

		if (
			selected_recipe &&
			!recipes.some((recipe) => recipe.id === selected_recipe.id)
		) {
			return [selected_recipe, ...recipes];
		}

		return recipes;
	}

	function clear_recipe_search_timeout(local_id: string) {
		const timeout_id = recipe_search_timeouts.get(local_id);

		if (timeout_id) {
			clearTimeout(timeout_id);
			recipe_search_timeouts.delete(local_id);
		}
	}

	function clear_recipe_search_state(local_id?: string) {
		if (local_id) {
			clear_recipe_search_timeout(local_id);
			recipe_search_request_ids.delete(local_id);

			const { [local_id]: _ignored_result, ...next_results } =
				recipe_search_results;
			const { [local_id]: _ignored_loading, ...next_loading } =
				recipe_search_loading;

			recipe_search_results = next_results;
			recipe_search_loading = next_loading;
			return;
		}

		for (const local_recipe_search_id of recipe_search_timeouts.keys()) {
			clear_recipe_search_timeout(local_recipe_search_id);
		}

		recipe_search_request_ids.clear();
		recipe_search_results = {};
		recipe_search_loading = {};
	}

	async function fetch_recipe_search_results(
		local_id: string,
		search_query: string,
	) {
		const normalized_query = search_query.trim();

		if (!normalized_query) {
			clear_recipe_search_state(local_id);
			return;
		}

		const request_id = next_recipe_search_request_id + 1;
		next_recipe_search_request_id = request_id;
		recipe_search_request_ids.set(local_id, request_id);
		recipe_search_loading = {
			...recipe_search_loading,
			[local_id]: true,
		};

		clear_recipe_search_timeout(local_id);

		const timeout_id = setTimeout(async () => {
			try {
				const response = await query_client.fetchQuery({
					queryKey: queryKeys.recipes.list({
						query: normalized_query,
						limit: RECIPE_SEARCH_LIMIT,
					}),
					queryFn: () =>
						recipesApi.list({
							query: normalized_query,
							limit: RECIPE_SEARCH_LIMIT,
						}),
					staleTime: 1000 * 60,
				});

				if (recipe_search_request_ids.get(local_id) !== request_id) {
					return;
				}

				const next_results = response.data.map((recipe) =>
					backend_recipe_to_ui_recipe(recipe),
				);

				meal_plan_store.mergeRecipes(next_results);
				recipe_search_results = {
					...recipe_search_results,
					[local_id]: next_results,
				};
			} catch {
				if (recipe_search_request_ids.get(local_id) !== request_id) {
					return;
				}

				recipe_search_results = {
					...recipe_search_results,
					[local_id]: [],
				};
			} finally {
				if (recipe_search_request_ids.get(local_id) !== request_id) {
					return;
				}

				recipe_search_loading = {
					...recipe_search_loading,
					[local_id]: false,
				};
				recipe_search_timeouts.delete(local_id);
			}
		}, RECIPE_SEARCH_DEBOUNCE_MS);

		recipe_search_timeouts.set(local_id, timeout_id);
	}

	function handle_recipe_search_input(local_id: string, event: Event) {
		const search_query = (event.currentTarget as HTMLInputElement).value;
		const selected_recipe_id =
			day_meal_drafts.find((draft) => draft.local_id === local_id)?.recipe_id ??
			"";

		update_day_draft(local_id, { search_query });

		void fetch_recipe_search_results(local_id, search_query);
		if (!search_query.trim() && selected_recipe_id) {
			recipe_search_results = {
				...recipe_search_results,
				[local_id]: include_selected_recipe([], selected_recipe_id),
			};
		}
	}

	function get_filtered_recipes(
		local_id: string,
		search_query: string,
		selected_recipe_id: string,
	): Recipe[] {
		if (!search_query.trim()) {
			return meal_plan_store.recipes;
		}

		return include_selected_recipe(
			recipe_search_results[local_id] ?? [],
			selected_recipe_id,
		);
	}

	function get_overlay_search_results(
		local_id: string,
		search_query: string,
		selected_recipe_id: string,
	): Recipe[] {
		if (!search_query.trim()) {
			return [];
		}

		return (recipe_search_results[local_id] ?? []).filter(
			(recipe) => recipe.id !== selected_recipe_id,
		);
	}

	function select_recipe_search_result(local_id: string, recipe: Recipe) {
		update_day_draft(local_id, {
			recipe_id: recipe.id,
			search_query: "",
		});
		clear_recipe_search_state(local_id);
	}

	function should_show_recipe_search_results(
		local_id: string,
		search_query: string,
	) {
		return (
			Boolean(search_query.trim()) || Boolean(recipe_search_loading[local_id])
		);
	}

	$effect(() => {
		return () => {
			clear_recipe_search_state();
		};
	});

	function save_day_meal_changes() {
		if (!selected_day) {
			return;
		}

		const current_day = selected_day;
		const current_plan = meal_plan_store.mealPlan;
		const existing_entries = meal_types.flatMap((meal_type) =>
			current_day.slots[meal_type].map((entry) => ({
				meal_type,
				entry,
			})),
		);
		const existing_entry_by_id = new Map(
			existing_entries.map(({ entry }) => [entry.source_entry_id, entry]),
		);
		const unmatched_entry_ids_by_meal_type = new Map<MealType, string[]>();

		for (const meal_type of meal_types) {
			unmatched_entry_ids_by_meal_type.set(
				meal_type,
				current_day.slots[meal_type].map((entry) => entry.source_entry_id),
			);
		}

		const used_meal_types = new Set<MealType>();

		for (const draft of day_meal_drafts) {
			if (used_meal_types.has(draft.meal_type)) {
				day_modal_feedback = m.planner_conflict_item({
					date: build_day_label(current_day),
					meal_type: get_meal_type_label(draft.meal_type),
				});
				return;
			}

			used_meal_types.add(draft.meal_type);
		}

		const matched_entry_ids = new Set<string>();
		const draft_operations = day_meal_drafts.map((draft) => {
			let matched_entry_id = draft.entry_id;

			if (matched_entry_id && !existing_entry_by_id.has(matched_entry_id)) {
				matched_entry_id = null;
			}

			if (!matched_entry_id) {
				const candidate_entry_ids =
					unmatched_entry_ids_by_meal_type.get(draft.meal_type) ?? [];
				matched_entry_id = candidate_entry_ids[0] ?? null;
			}

			if (matched_entry_id) {
				matched_entry_ids.add(matched_entry_id);
				unmatched_entry_ids_by_meal_type.set(
					draft.meal_type,
					(unmatched_entry_ids_by_meal_type.get(draft.meal_type) ?? []).filter(
						(entry_id) => entry_id !== matched_entry_id,
					),
				);
			}

			return {
				...draft,
				entry_id: matched_entry_id,
			};
		});
		const plan_entries_by_id = new Map(
			current_plan.entries.map((entry) => [entry.id, entry]),
		);
		const original_day_entry_ids = new Set(
			existing_entries.map(({ entry }) => entry.source_entry_id),
		);
		const next_day_entries = draft_operations.flatMap<MealPlanEntry>(
			(draft) => {
				if (!draft.recipe_id) {
					return [];
				}

				const current_entry = draft.entry_id
					? plan_entries_by_id.get(draft.entry_id)
					: undefined;

				return [
					{
						id: current_entry?.id ?? crypto.randomUUID(),
						recipe_id: draft.recipe_id,
						date: draft.date,
						meal_type: draft.meal_type,
						servings:
							current_entry?.servings ??
							household_store.profile.default_servings,
						recurrence_rule: current_entry?.recurrence_rule,
						series_id: current_entry?.series_id,
					},
				];
			},
		);
		const next_entries = [
			...current_plan.entries.filter(
				(entry) => !original_day_entry_ids.has(entry.id),
			),
			...next_day_entries,
		];

		meal_plan_store.replaceEntries(next_entries);

		const day_label = build_day_label(current_day);
		close_day_modal();
		show_calendar_feedback(m.planner_calendar_day_saved({ date: day_label }));
	}

	function clear_calendar_feedback() {
		calendar_feedback = null;
	}

	function get_browser_timezone(): string | undefined {
		return browser
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: undefined;
	}

	function replace_current_plan_with_generated_meals(range: {
		start_date: string;
		end_date: string;
		period: "week" | "month";
		planning_preset: PlanningPreset;
		feedback_message: string;
	}) {
		clear_calendar_feedback();

		const recipe_pool = build_recipe_pool(
			meal_plan_store.recipes,
			get_browser_timezone(),
		);
		const plan_dates = collect_plan_dates(
			range.start_date,
			range.end_date,
			Number.MAX_SAFE_INTEGER,
		);

		if (recipe_pool.length === 0 || plan_dates.length === 0) {
			show_calendar_feedback(m.planner_calendar_generate_empty_feedback());
			return;
		}

		let recipe_index = 0;
		const generated_entries: MealPlanEntry[] = [];

		for (const plan_date of plan_dates) {
			for (const meal_type of generated_meal_types) {
				const recipe = recipe_pool[recipe_index % recipe_pool.length];

				if (!recipe) {
					continue;
				}

				generated_entries.push({
					id: crypto.randomUUID(),
					recipe_id: recipe.id,
					date: plan_date,
					meal_type,
					servings: household_store.profile.default_servings,
				});
				recipe_index += 1;
			}
		}

		meal_plan_store.replacePlan({
			period: range.period,
			planning_preset: range.planning_preset,
			start_date: range.start_date,
			end_date: range.end_date,
			entries: generated_entries,
		});

		show_calendar_feedback(range.feedback_message);
	}

	function regenerate_this_week() {
		if (is_regenerating) {
			return;
		}

		is_regenerating = "week";

		try {
			replace_current_plan_with_generated_meals({
				...get_preset_range("this_week"),
				period: "week",
				planning_preset: "this_week",
				feedback_message: m.planner_calendar_generate_week_feedback(),
			});
		} finally {
			is_regenerating = null;
		}
	}

	function regenerate_month_plan() {
		if (is_regenerating) {
			return;
		}

		is_regenerating = "month";

		try {
			replace_current_plan_with_generated_meals({
				...get_preset_range("this_month"),
				period: "month",
				planning_preset: "this_month",
				feedback_message: m.planner_calendar_generate_month_feedback(),
			});
		} finally {
			is_regenerating = null;
		}
	}

	function regenerate_next_two_weeks_plan() {
		if (is_regenerating) {
			return;
		}

		is_regenerating = "two_weeks";

		try {
			replace_current_plan_with_generated_meals({
				...get_next_two_weeks_range(),
				period: "week",
				planning_preset: "custom_range",
				feedback_message: m.planner_calendar_generate_two_weeks_feedback(),
			});
		} finally {
			is_regenerating = null;
		}
	}

	function get_recipe_name(recipe_id: string): string {
		return (
			meal_plan_store.recipes.find((recipe) => recipe.id === recipe_id)?.name ??
			recipe_id
		);
	}

	function get_recipe_slug(recipe_id: string): string | undefined {
		return meal_plan_store.recipes.find((recipe) => recipe.id === recipe_id)
			?.slug;
	}

	function get_meal_type_label(meal_type: MealType): string {
		switch (meal_type) {
			case "breakfast":
				return m.planner_meal_type_breakfast();
			case "lunch":
				return m.planner_meal_type_lunch();
			case "dinner":
				return m.planner_meal_type_dinner();
			case "snack":
				return m.planner_meal_type_snack();
		}
	}
</script>

<SEO
	title={`${m.seo_planner_title()} · ${m.planner_schedule_preview_title()}`}
	description={m.planner_schedule_preview_subtitle()}
/>

<section class="page">
	<PageHero
		title={m.planner_schedule_preview_title()}
		subtitle={m.planner_schedule_preview_subtitle()}
	>
		{#snippet actions()}
			<div class="hero-actions">
				<Button
					variant="primary"
					size="medium"
					round
					href={localizeHref("/shopping-list")}
				>
					<Icon icon={cartOutline} width="18" height="18" aria-hidden="true" />
					{m.nav_shopping_list()}
				</Button>
			</div>
		{/snippet}
	</PageHero>

	<div class="calendar-page surface-panel">
		{#if calendar_feedback}
			<div class="calendar-feedback" role="status" aria-live="polite">
				<p>{calendar_feedback}</p>
			</div>
		{/if}

		<div class="hero-summary">
			<strong title={meal_plan_store.mealPlan.name}
				>{meal_plan_store.mealPlan.name}</strong
			>
			<p>{active_plan_summary}</p>
		</div>

		<header class="calendar-header">
			<div class="calendar-actions">
				{#each available_calendar_actions as action (action.key)}
					<Button
						variant="secondary"
						size="medium"
						round
						loading={action.loading}
						disabled={is_regenerating !== null}
						onclick={action.handler}
					>
						{action.label}
					</Button>
				{/each}
			</div>
		</header>

		<p class="calendar-hint">{m.planner_calendar_generate_hint()}</p>

		{#if overview_days.length === 0}
			<div class="empty-panel">
				<p class="empty">{m.planner_preview_empty()}</p>
				<Button
					variant="primary"
					size="medium"
					round
					href={localizeHref("/planner?tab=meal")}
				>
					{m.planner_add_entry()}
				</Button>
			</div>
		{:else}
			<div class="overview-scroll">
				<div class="overview-weekday-row" aria-hidden="true">
					{#each weekday_headers as header}
						<div class="overview-weekday-cell">{header}</div>
					{/each}
				</div>

				<div class="overview-grid">
					{#each overview_cells as day}
						{#if day}
							<article
								class="overview-day"
								class:has-meals={day.entry_count > 0}
							>
								<button
									type="button"
									class="overview-day-hitbox"
									aria-label={m.planner_calendar_edit_day({
										date: build_day_label(day),
									})}
									onclick={() => open_day_modal(day)}
								></button>

								<div class="overview-day-content">
									<header class="overview-day-header">
										<div>
											<p class="overview-weekday">{day.weekday_label}</p>
											<h2>{day.date_label}</h2>
										</div>
										{#if day.entry_count > 0}
											<span class="overview-count">{day.entry_count}</span>
										{/if}
									</header>

									{#if day.entry_count === 0}
										<p class="overview-empty">{m.planned_meals_day_empty()}</p>
									{:else}
										<div class="overview-slot-list">
											{#each meal_types as meal_type}
												{#if day.slots[meal_type].length > 0}
													<section class="overview-slot">
														<span class="slot-label"
															>{get_meal_type_label(meal_type)}</span
														>
														<div class="slot-content">
															{#each day.slots[meal_type] as occurrence}
																<a
																	class="slot-chip"
																	href={localizeHref(
																		`/recipes/${get_recipe_slug(occurrence.recipe_id) ?? ""}`,
																	)}
																>
																	<span
																		>{get_recipe_name(
																			occurrence.recipe_id,
																		)}</span
																	>
																	<small>{occurrence.servings}</small>
																</a>
															{/each}
														</div>
													</section>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							</article>
						{:else}
							<div class="overview-placeholder" aria-hidden="true"></div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="mobile-shopping-cta">
		<Button
			variant="primary"
			size="large"
			round
			href={localizeHref("/shopping-list")}
		>
			<Icon icon={cartOutline} width="18" height="18" aria-hidden="true" />
			{m.nav_shopping_list()}
		</Button>
	</div>

	<Modal
		open={Boolean(selected_day)}
		title={selected_day
			? m.planner_calendar_day_modal_title({
					date: build_day_label(selected_day),
				})
			: m.planner_calendar_day_modal_title({ date: "" })}
		description={m.planner_calendar_day_modal_description()}
		titleId="calendar-day-modal-title"
		descriptionId="calendar-day-modal-description"
		class="day-modal"
	>
		{#snippet children()}
			{#if day_modal_feedback}
				<p class="modal-feedback" role="alert">{day_modal_feedback}</p>
			{/if}

			<div class="day-modal-header">
				<p class="day-modal-summary">
					{selected_day?.entry_count ?? 0}
					{m.planner_overview_occurrences().toLowerCase()}
				</p>
				<Button
					variant="outline"
					size="small"
					round
					disabled={get_available_day_meal_types().length === 0}
					onclick={add_day_meal_draft}
				>
					{m.planner_add_entry()}
				</Button>
			</div>

			<div class="day-edit-list">
				{#each day_meal_drafts as draft (draft.local_id)}
					<section class="day-edit-card">
						<div class="day-edit-card-header">
							<p class="day-edit-card-title">
								{get_meal_type_label(draft.meal_type)}
							</p>
							<button
								type="button"
								class="draft-remove"
								onclick={() => remove_day_meal_draft(draft.local_id)}
								title={m.planner_delete_plan()}
							>
								<Icon
									icon={deleteOutline}
									width="18"
									height="18"
									aria-hidden="true"
								/>
								<span class="sr-only">{m.planner_delete_plan()}</span>
							</button>
						</div>

						<div class="recipe-search-field">
							<Input
								id={`recipe-search-${draft.local_id}`}
								label={m.recipes_search_label()}
								placeholder={m.recipes_search_placeholder()}
								icon={magnify}
								value={draft.search_query}
								oninput={(event) =>
									handle_recipe_search_input(draft.local_id, event)}
							/>

							{#if should_show_recipe_search_results(draft.local_id, draft.search_query)}
								<div
									class="recipe-search-results"
									role="listbox"
									aria-label={m.planner_recipe_label()}
								>
									{#if recipe_search_loading[draft.local_id]}
										<div class="recipe-search-loading" aria-live="polite">
											<span class="recipe-search-loading-dot"></span>
											<span class="recipe-search-loading-dot"></span>
											<span class="recipe-search-loading-dot"></span>
											<span class="sr-only">{m.planner_recipe_label()}</span>
										</div>
									{:else if get_overlay_search_results(draft.local_id, draft.search_query, draft.recipe_id).length === 0}
										<p class="recipe-search-empty">{m.recipes_empty()}</p>
									{:else}
										<div class="recipe-search-list">
											{#each get_overlay_search_results(draft.local_id, draft.search_query, draft.recipe_id) as recipe}
												<button
													type="button"
													class="recipe-search-option"
													role="option"
													aria-selected="false"
													onclick={() =>
														select_recipe_search_result(draft.local_id, recipe)}
												>
													<span class="recipe-search-name">{recipe.name}</span>
													<span class="recipe-search-meta">
														{recipe.preparation_time_in_minutes}
													</span>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<div class="day-edit-grid">
							<div class="field-group">
								<label for={`recipe-${draft.local_id}`}
									>{m.planner_recipe_label()}</label
								>
								<select
									id={`recipe-${draft.local_id}`}
									value={draft.recipe_id}
									onchange={(event) =>
										update_day_draft(draft.local_id, {
											recipe_id: (event.currentTarget as HTMLSelectElement)
												.value,
										})}
								>
									{#if get_filtered_recipes(draft.local_id, draft.search_query, draft.recipe_id).length === 0}
										<option value={draft.recipe_id}>{m.recipes_empty()}</option>
									{:else}
										{#each get_filtered_recipes(draft.local_id, draft.search_query, draft.recipe_id) as recipe}
											<option value={recipe.id}>{recipe.name}</option>
										{/each}
									{/if}
								</select>
							</div>

							<div class="field-group">
								<label for={`meal-type-${draft.local_id}`}
									>{m.planner_meal_type_label()}</label
								>
								<select
									id={`meal-type-${draft.local_id}`}
									value={draft.meal_type}
									onchange={(event) =>
										update_day_draft(draft.local_id, {
											meal_type: (event.currentTarget as HTMLSelectElement)
												.value as MealType,
										})}
								>
									{#each get_available_day_meal_types(draft.local_id) as available_meal_type}
										<option value={available_meal_type}>
											{get_meal_type_label(available_meal_type)}
										</option>
									{/each}
								</select>
							</div>
						</div>
					</section>
				{/each}
			</div>
		{/snippet}

		{#snippet actions()}
			<Button variant="outline" size="medium" round onclick={close_day_modal}>
				{m.household_delete_cancel()}
			</Button>
			<Button
				variant="primary"
				size="medium"
				round
				onclick={save_day_meal_changes}
			>
				{m.planner_calendar_day_save()}
			</Button>
		{/snippet}
	</Modal>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: grid;
		gap: 1rem;
		min-width: 0;
		padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px));

		@include md {
			padding-bottom: 0;
		}
	}

	.calendar-feedback {
		padding: 0.9rem 1rem;
		border-radius: 18px;
		border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
		background: color-mix(in srgb, var(--primary) 8%, var(--surface));
		color: var(--text);
	}

	.calendar-page,
	.empty-panel {
		display: grid;
		gap: 1rem;
	}

	.calendar-page {
		padding: 1rem;
		border-radius: 24px;

		@include md {
			padding: 1.25rem;
		}
	}

	.calendar-header {
		display: flex;
		justify-content: flex-start;
		width: 100%;

		@include lg {
			justify-content: flex-end;
		}
	}

	.hero-actions {
		display: none;

		@include md {
			display: grid;
			width: auto;
		}
	}

	.hero-summary {
		display: grid;
		gap: 0.35rem;

		strong {
			font-size: 0.95rem;
			line-height: 1.2;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		p {
			color: var(--text-muted);
			font-size: 0.95rem;
			overflow-wrap: anywhere;
		}
	}

	.calendar-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75rem;
		width: 100%;

		@include md {
			grid-template-columns: repeat(2, minmax(0, auto));
			justify-content: end;
			width: auto;
		}

		@include lg {
			grid-template-columns: repeat(2, minmax(0, auto));
		}

		:global(.btn) {
			width: 100%;

			@include md {
				width: auto;
				min-width: 12rem;
			}
		}
	}

	.calendar-hint,
	.empty {
		color: var(--text-muted);
	}

	.empty-panel {
		justify-items: start;
	}

	.mobile-shopping-cta {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--surface) 20%, transparent),
			color-mix(in srgb, var(--surface) 96%, transparent) 32%,
			var(--surface)
		);
		backdrop-filter: blur(14px);

		:global(.btn) {
			width: 100%;
			min-height: 3.75rem;
		}

		@include md {
			display: none;
		}
	}

	.overview-scroll {
		overflow-x: auto;
		padding-bottom: 0.2rem;
		overflow-y: visible;
		scroll-snap-type: x mandatory;
		scroll-padding-inline: 0;
		overscroll-behavior-x: contain;

		@include md {
			scroll-snap-type: none;
		}
	}

	.overview-weekday-row,
	.overview-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, calc(100vw - 3.25rem)));
		min-width: calc((100vw - 3.25rem) * 7 + 0.65rem * 6);

		@include md {
			grid-template-columns: repeat(7, minmax(10rem, 1fr));
			min-width: 70rem;
		}
	}

	.overview-weekday-row {
		display: none;

		@include md {
			display: grid;
			gap: 0.65rem;
			margin-bottom: 0.65rem;
		}
	}

	.overview-weekday-cell {
		padding: 0 0.35rem;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.overview-grid {
		gap: 0.65rem;
	}

	.overview-day,
	.overview-placeholder {
		display: grid;
		align-content: start;
		min-height: 14rem;
		padding: 0.8rem;
		border: 1px solid var(--border);
		border-radius: 18px;
		background-color: color-mix(in srgb, var(--surface) 95%, transparent);
	}

	.overview-placeholder {
		display: none;
		background-color: color-mix(in srgb, var(--surface) 65%, transparent);
		border-style: dashed;
		opacity: 0.45;

		@include md {
			display: grid;
		}
	}

	.overview-day {
		position: relative;
		gap: 0.75rem;
		cursor: pointer;
		scroll-snap-align: start;
		scroll-snap-stop: always;
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			box-shadow var(--motion-base, 180ms) var(--ease-emphasized, ease);

		@include md {
			scroll-snap-align: none;
			scroll-snap-stop: normal;
		}

		&.has-meals {
			border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
		}

		&:hover,
		&:focus-visible {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--primary) 32%, var(--border));
			box-shadow: var(--card-shadow-hover);
			outline: none;
		}

		h2 {
			font-size: 1rem;
		}
	}

	.overview-day-hitbox {
		position: absolute;
		inset: 0;
		z-index: 1;
		border: 0;
		border-radius: inherit;
		background: none;
		cursor: pointer;

		&:focus-visible {
			outline: 2px solid color-mix(in srgb, var(--primary) 36%, transparent);
			outline-offset: 2px;
		}
	}

	.overview-day-content {
		position: relative;
		z-index: 2;
		display: grid;
		gap: 0.75rem;
		pointer-events: none;
	}

	.overview-day-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.overview-weekday {
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.overview-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.45rem;
		border-radius: 999px;
		background-color: color-mix(in srgb, var(--primary) 14%, transparent);
		color: var(--primary);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.overview-empty {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.overview-slot-list {
		display: grid;
		gap: 0.65rem;
	}

	.overview-slot {
		display: grid;
		gap: 0.35rem;
	}

	.slot-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.slot-content {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.slot-chip {
		position: relative;
		z-index: 3;
		pointer-events: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;

		small {
			color: var(--primary);
			font-weight: 700;
		}
	}

	:global(.day-modal) {
		width: min(100%, 52rem);
		max-height: calc(100dvh - 1rem);

		@include md {
			max-height: calc(100dvh - 2rem);
		}
	}

	.day-modal-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.2rem;
		padding-right: 0.2rem;
	}

	.day-modal-summary {
		color: var(--text-muted);
	}

	.modal-feedback {
		padding: 0.85rem 1rem;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--error) 28%, var(--border));
		background: color-mix(in srgb, var(--error) 8%, var(--surface));
		color: var(--error);
	}

	.day-edit-list {
		display: grid;
		gap: 1rem;
	}

	.day-edit-card {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 18px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 96%, transparent);
	}

	.recipe-search-field {
		position: relative;
		z-index: 5;
	}

	.recipe-search-results {
		position: absolute;
		top: calc(100% + 0.4rem);
		left: 0;
		right: 0;
		z-index: 20;
		display: grid;
		gap: 0.65rem;
		padding: 0.75rem;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--primary) 16%, var(--border));
		background: color-mix(in srgb, var(--surface-muted) 72%, var(--surface));
		box-shadow: var(--high-box-shadow);
		max-height: min(18rem, 42dvh);
		overflow-y: auto;
	}

	.recipe-search-loading {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 1.25rem;
	}

	.recipe-search-loading-dot {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--primary) 70%, var(--surface));
		animation: recipe-search-pulse 1s ease-in-out infinite;

		&:nth-child(2) {
			animation-delay: 120ms;
		}

		&:nth-child(3) {
			animation-delay: 240ms;
		}
	}

	.recipe-search-empty {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.recipe-search-list {
		display: grid;
		gap: 0.5rem;
	}

	.recipe-search-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 0.85rem;
		border-radius: 14px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		color: var(--text);
		text-align: left;
		cursor: pointer;
		transition:
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			background-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover {
			transform: translateY(-1px);
			border-color: color-mix(in srgb, var(--primary) 24%, var(--border));
		}

		&:focus-visible {
			outline: 2px solid color-mix(in srgb, var(--primary) 30%, transparent);
			outline-offset: 2px;
		}
	}

	.recipe-search-name {
		font-weight: 600;
	}

	.recipe-search-meta {
		flex-shrink: 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	@keyframes recipe-search-pulse {
		0%,
		80%,
		100% {
			opacity: 0.35;
			transform: scale(0.9);
		}

		40% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.day-edit-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.day-edit-card-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
	}

	.draft-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--error) 20%, var(--border));
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		color: var(--error);
		cursor: pointer;

		&:focus-visible {
			outline: 2px solid color-mix(in srgb, var(--error) 26%, transparent);
			outline-offset: 2px;
		}
	}

	:global(.day-modal .actions) {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75rem;

		@include md {
			display: flex;
		}
	}

	:global(.day-modal .actions .btn) {
		width: 100%;
		min-width: 0;

		@include md {
			width: auto;
			min-width: 10rem;
		}
	}

	.day-edit-grid {
		display: grid;
		gap: 0.9rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.field-group {
		display: grid;
		gap: 0.4rem;

		label {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--text);
		}

		select {
			width: 100%;
			padding: 0.75rem 0.85rem;
			border-radius: 14px;
			border: 1px solid var(--border);
			background: color-mix(in srgb, var(--surface) 92%, transparent);
			color: var(--text);

			&:focus-visible {
				outline: 2px solid color-mix(in srgb, var(--primary) 30%, transparent);
				outline-offset: 1px;
			}
		}
	}
</style>
