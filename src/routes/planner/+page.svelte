<script lang="ts">
	import { page } from "$app/state";
	import Icon from "@iconify/svelte";
	import calendarMonthOutline from "@iconify-icons/mdi/calendar-month-outline";
	import cogOutline from "@iconify-icons/mdi/cog-outline";
	import formatListBulleted from "@iconify-icons/mdi/format-list-bulleted";
	import silverwareForkKnife from "@iconify-icons/mdi/silverware-fork-knife";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import { announce } from "$lib/utils/announce";
	import type {
		ExpandedMealPlanEntry,
		MealPlanEntry,
		MealType,
		PlanningPreset,
		RecurrenceFrequency,
		RecurrenceRule,
	} from "$lib/types/planning";
	import * as m from "$lib/paraglide/messages.js";
	import { getLocale, localizeHref } from "$lib/paraglide/runtime";
	import type { PlanWindowValidationResult } from "$lib/utils/planning";
	import {
		expand_meal_plan_entries,
		format_iso_date,
		format_plan_range_label,
		format_plan_selection_label,
		parse_iso_date,
	} from "$lib/utils/planning";

	type PlannerTab = "setup" | "meal" | "overview" | "entries";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();
	const message_registry = m as Record<string, unknown>;
	const meal_types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

	let selected_recipe_id = $state(
		page.url.searchParams.get("recipe") ?? meal_plan_store.recipes[0]?.id ?? "",
	);
	let selected_date = $state(
		meal_plan_store.mealPlan.start_date ??
			new Date().toISOString().slice(0, 10),
	);
	let selected_meal_type = $state<MealType>("dinner");
	let servings_input = $state(`${household_store.profile.default_servings}`);
	let recurrence_enabled = $state(false);
	let recurrence_frequency = $state<RecurrenceFrequency>("week");
	let recurrence_interval = $state("1");
	let recurrence_ends_on = $state("");
	let recurrence_count = $state("");
	let editing_entry_id = $state<string | null>(null);
	let editing_series_id = $state<string | null>(null);
	let last_active_plan_id = $state(meal_plan_store.activePlanId);
	let active_tab = $state<PlannerTab>("setup");
	let planner_feedback = $state<string | null>(null);

	function localized_fallback(english: string, portuguese: string): string {
		return getLocale() === "pt-br" ? portuguese : english;
	}

	function call_optional_message<TInputs>(
		candidate: unknown,
		fallback: string,
		inputs?: TInputs,
	): string {
		if (typeof candidate !== "function") {
			return fallback;
		}

		try {
			return inputs === undefined
				? (candidate as () => string)()
				: (candidate as (input: TInputs) => string)(inputs);
		} catch {
			return fallback;
		}
	}

	function get_optional_message(key: string, fallback: string): string {
		return call_optional_message(message_registry[key], fallback);
	}

	function planner_entry_outside_range_error_message(): string {
		return get_optional_message(
			"planner_entry_outside_range_error",
			localized_fallback(
				"Choose a date inside the active plan range before saving this meal.",
				"Escolha uma data dentro do intervalo ativo do plano antes de salvar esta refeição.",
			),
		);
	}

	function planner_recurrence_needs_limit_error_message(): string {
		return get_optional_message(
			"planner_recurrence_needs_limit_error",
			localized_fallback(
				"Recurring meals need an end date or occurrence limit that stays inside the active plan range.",
				"Refeições recorrentes precisam de uma data final ou limite de ocorrências dentro do intervalo ativo do plano.",
			),
		);
	}

	function planner_recurrence_outside_range_error_message(): string {
		return get_optional_message(
			"planner_recurrence_outside_range_error",
			localized_fallback(
				"This recurring meal extends beyond the active plan range. Adjust the date or recurrence limit.",
				"Esta refeição recorrente ultrapassa o intervalo ativo do plano. Ajuste a data ou o limite da recorrência.",
			),
		);
	}

	function planner_range_pruned_message(count: number): string {
		const fallback = localized_fallback(
			`Removed ${count} meal entries that no longer fit this plan range.`,
			`${count} refeições foram removidas por não caberem mais neste intervalo do plano.`,
		);

		return call_optional_message(
			message_registry.planner_range_pruned,
			fallback,
			{
				count: `${count}`,
			},
		);
	}

	function planner_range_rule_hint_message(range: string): string {
		const fallback = localized_fallback(
			`Meals must stay within ${range}. Recurring meals also need an end date or occurrence limit inside this range.`,
			`As refeições precisam ficar dentro de ${range}. Refeições recorrentes também precisam de uma data final ou limite de ocorrências dentro desse intervalo.`,
		);

		return call_optional_message(
			message_registry.planner_range_rule_hint,
			fallback,
			{
				range,
			},
		);
	}

	function planner_household_label(): string {
		return get_optional_message(
			"planner_household_label",
			localized_fallback("Household", "Casa"),
		);
	}

	function planner_household_hint(): string {
		return get_optional_message(
			"planner_household_hint",
			localized_fallback(
				"Plans are filtered by the selected household.",
				"Os planos são filtrados pela casa selecionada.",
			),
		);
	}

	const planner_tabs = [
		{
			id: "setup" as const,
			label: () => m.planner_settings_title(),
			icon: cogOutline,
		},
		{
			id: "meal" as const,
			label: () => m.planner_form_title(),
			icon: silverwareForkKnife,
		},
		{
			id: "entries" as const,
			label: () => m.planner_entries_title(),
			icon: formatListBulleted,
		},
		{
			id: "overview" as const,
			label: () => m.planner_schedule_preview_title(),
			icon: calendarMonthOutline,
		},
	];

	const available_households = $derived(household_store.profiles);
	const available_plans = $derived(meal_plan_store.mealPlans);
	const entries = $derived(meal_plan_store.mealPlan.entries);
	const conflicts = $derived(meal_plan_store.conflicts);
	const expanded_entries = $derived.by(() =>
		expand_meal_plan_entries(
			meal_plan_store.mealPlan.entries,
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
		),
	);
	const recurring_series_count = $derived.by(
		() => new Set(entries.map((entry) => entry.series_id).filter(Boolean)).size,
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

	type OverviewDay = {
		date: string;
		date_label: string;
		weekday_label: string;
		entry_count: number;
		slots: Record<MealType, ExpandedMealPlanEntry[]>;
	};

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

	$effect(() => {
		const recipe_from_query = page.url.searchParams.get("recipe");
		if (recipe_from_query) {
			selected_recipe_id = recipe_from_query;
			active_tab = "meal";
		}
	});

	$effect(() => {
		const next_active_plan_id = meal_plan_store.activePlanId;

		if (next_active_plan_id === last_active_plan_id) {
			return;
		}

		last_active_plan_id = next_active_plan_id;
		active_tab = "setup";
		planner_feedback = null;
		reset_form();
	});

	function show_planner_feedback(message: string) {
		planner_feedback = message;
		announce(message);
	}

	function clear_planner_feedback() {
		planner_feedback = null;
	}

	function get_range_error_message(
		reason:
			| "date-outside-range"
			| "recurrence-outside-range"
			| "recurrence-open-ended",
	): string {
		switch (reason) {
			case "date-outside-range":
				return planner_entry_outside_range_error_message();
			case "recurrence-open-ended":
				return planner_recurrence_needs_limit_error_message();
			case "recurrence-outside-range":
				return planner_recurrence_outside_range_error_message();
		}
	}

	function build_recurrence_rule(): RecurrenceRule | undefined {
		if (!recurrence_enabled) {
			return undefined;
		}

		return {
			frequency: recurrence_frequency,
			interval: Math.max(1, Number(recurrence_interval) || 1),
			ends_on: recurrence_ends_on || undefined,
			occurrence_count: recurrence_count
				? Math.max(1, Number(recurrence_count) || 1)
				: undefined,
		};
	}

	function reset_form() {
		selected_recipe_id = meal_plan_store.recipes[0]?.id ?? "";
		selected_date =
			meal_plan_store.mealPlan.start_date ??
			new Date().toISOString().slice(0, 10);
		selected_meal_type = "dinner";
		servings_input = `${household_store.profile.default_servings}`;
		recurrence_enabled = false;
		recurrence_frequency = "week";
		recurrence_interval = "1";
		recurrence_ends_on = "";
		recurrence_count = "";
		editing_entry_id = null;
		editing_series_id = null;
	}

	function handle_submit() {
		if (!selected_recipe_id || !selected_date) {
			return;
		}

		const payload: Partial<MealPlanEntry> = {
			recipe_id: selected_recipe_id,
			date: selected_date,
			meal_type: selected_meal_type,
			servings: Math.max(
				1,
				Number(servings_input) || household_store.profile.default_servings,
			),
			recurrence_rule: build_recurrence_rule(),
		};

		const result: PlanWindowValidationResult = editing_series_id
			? meal_plan_store.updateSeries(editing_series_id, payload)
			: editing_entry_id
				? meal_plan_store.updateEntry(editing_entry_id, payload)
				: meal_plan_store.addEntry({
						recipe_id: selected_recipe_id,
						date: selected_date,
						meal_type: selected_meal_type,
						servings: payload.servings,
						recurrence_rule: payload.recurrence_rule,
					});

		if (!result.ok) {
			show_planner_feedback(get_range_error_message(result.reason));
			return;
		}

		clear_planner_feedback();

		active_tab = "entries";
		reset_form();
	}

	function handle_custom_range_change(start_date: string, end_date: string) {
		const result = meal_plan_store.setCustomRange(start_date, end_date);

		if (result.removedEntries > 0) {
			show_planner_feedback(
				planner_range_pruned_message(result.removedEntries),
			);
		} else {
			clear_planner_feedback();
		}
	}

	function begin_single_edit(entry: MealPlanEntry) {
		active_tab = "meal";
		editing_entry_id = entry.id;
		editing_series_id = null;
		selected_recipe_id = entry.recipe_id;
		selected_date = entry.date;
		selected_meal_type = entry.meal_type;
		servings_input = `${entry.servings}`;
		recurrence_enabled = Boolean(entry.recurrence_rule);
		recurrence_frequency = entry.recurrence_rule?.frequency ?? "week";
		recurrence_interval = `${entry.recurrence_rule?.interval ?? 1}`;
		recurrence_ends_on = entry.recurrence_rule?.ends_on ?? "";
		recurrence_count = entry.recurrence_rule?.occurrence_count
			? `${entry.recurrence_rule.occurrence_count}`
			: "";
	}

	function begin_series_edit(entry: MealPlanEntry) {
		begin_single_edit(entry);
		editing_entry_id = null;
		editing_series_id = entry.series_id ?? null;
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

	function get_frequency_label(frequency: RecurrenceFrequency): string {
		switch (frequency) {
			case "day":
				return m.planner_frequency_day();
			case "week":
				return m.planner_frequency_week();
			case "month":
				return m.planner_frequency_month();
			case "year":
				return m.planner_frequency_year();
		}
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

	function get_recurrence_summary(
		recurrence_rule?: RecurrenceRule,
	): string | null {
		if (!recurrence_rule) {
			return null;
		}

		const frequency_label = get_frequency_label(
			recurrence_rule.frequency,
		).toLowerCase();

		if (recurrence_rule.ends_on) {
			return m.planner_recurrence_summary_until({
				interval: `${recurrence_rule.interval}`,
				frequency: frequency_label,
				ends_on: recurrence_rule.ends_on,
			});
		}

		return m.planner_recurrence_summary({
			interval: `${recurrence_rule.interval}`,
			frequency: frequency_label,
		});
	}

	function set_preset(preset: PlanningPreset) {
		const result = meal_plan_store.setPlanningPreset(preset);

		if (result.removedEntries > 0) {
			show_planner_feedback(
				planner_range_pruned_message(result.removedEntries),
			);
		} else {
			clear_planner_feedback();
		}
	}

	function select_plan(event: Event) {
		meal_plan_store.selectPlan(
			(event.currentTarget as HTMLSelectElement).value,
		);
	}

	function select_household(event: Event) {
		household_store.selectHousehold(
			(event.currentTarget as HTMLSelectElement).value,
		);
		active_tab = "setup";
		clear_planner_feedback();
		reset_form();
	}

	function create_plan() {
		meal_plan_store.createPlan();
		active_tab = "setup";
		clear_planner_feedback();
	}

	function clear_current_plan() {
		meal_plan_store.clearPlan();
		active_tab = "setup";
		clear_planner_feedback();
		reset_form();
	}

	function open_tab(tab: PlannerTab) {
		active_tab = tab;
	}
</script>

<SEO title={m.seo_planner_title()} description={m.seo_planner_description()} />

<section class="page">
	<section class="planner-context surface-panel">
		<div class="planner-context__copy">
			<p class="eyebrow">{m.planner_active_plan_label()}</p>
			<h2 title={meal_plan_store.mealPlan.name}>
				{meal_plan_store.mealPlan.name}
			</h2>
			<p title={active_plan_summary}>{active_plan_summary}</p>
			<span class="plan-id">
				<span class="plan-id__household">{household_store.profile.name}</span>
				<span class="plan-id__separator" aria-hidden="true">·</span>
				<span class="plan-id__value">{meal_plan_store.activePlanId}</span>
			</span>
		</div>
		<div class="planner-context__controls">
			<div class="field-group">
				<label for="active-household">{planner_household_label()}</label>
				<select
					id="active-household"
					value={household_store.activeHouseholdId}
					onchange={select_household}
				>
					{#each available_households as household}
						<option value={household.id}>{household.name}</option>
					{/each}
				</select>
				<p class="field-note">{planner_household_hint()}</p>
			</div>
			<div class="field-group">
				<label for="active-plan">{m.planner_active_plan_label()}</label>
				<select
					id="active-plan"
					value={meal_plan_store.activePlanId}
					onchange={select_plan}
				>
					{#each available_plans as plan}
						<option value={plan.id}>{format_plan_selection_label(plan)}</option>
					{/each}
				</select>
			</div>
			<div class="planner-context__cta">
				<Button variant="primary" size="medium" round onclick={create_plan}>
					{m.planner_create_plan()}
				</Button>
				<p class="field-note">{m.planner_create_plan_hint()}</p>
			</div>
		</div>
	</section>

	{#if planner_feedback}
		<div class="planner-feedback" role="status" aria-live="polite">
			<p>{planner_feedback}</p>
		</div>
	{/if}

	<section class="planner-tabs surface-panel">
		<div
			class="planner-tabs__nav"
			role="tablist"
			aria-label={m.planner_title()}
		>
			{#each planner_tabs as tab}
				<button
					type="button"
					role="tab"
					id={`planner-tab-${tab.id}`}
					class:active={active_tab === tab.id}
					aria-selected={active_tab === tab.id}
					aria-controls={`planner-panel-${tab.id}`}
					tabindex={active_tab === tab.id ? 0 : -1}
					onclick={() => open_tab(tab.id)}
				>
					<span class="tab-icon" aria-hidden="true">
						<Icon icon={tab.icon} width="18" height="18" />
					</span>
					<span>{tab.label()}</span>
					{#if tab.id === "entries"}
						<small>{entries.length}</small>
					{:else if tab.id === "overview"}
						<small>{expanded_entries.length}</small>
					{/if}
				</button>
			{/each}
		</div>

		{#if active_tab === "setup"}
			<div
				class="panel planner-panel settings-panel"
				role="tabpanel"
				id="planner-panel-setup"
				aria-labelledby="planner-tab-setup"
			>
				<div class="section-heading">
					<p class="eyebrow">{m.planner_eyebrow()}</p>
					<h2>{m.planner_settings_title()}</h2>
					<p>{m.planner_settings_subtitle()}</p>
				</div>

				<div class="field-group">
					<label for="plan-name">{m.planner_plan_name_label()}</label>
					<input
						id="plan-name"
						type="text"
						value={meal_plan_store.mealPlan.name}
						oninput={(event) =>
							meal_plan_store.setName(
								(event.currentTarget as HTMLInputElement).value,
							)}
					/>
				</div>

				<div class="split-grid">
					<div class="field-group">
						<label for="plan-period">{m.planner_period_label()}</label>
						<select
							id="plan-period"
							value={meal_plan_store.mealPlan.period}
							onchange={(event) =>
								meal_plan_store.setPeriod(
									(event.currentTarget as HTMLSelectElement).value as
										| "week"
										| "month",
								)}
						>
							<option value="week">{m.planner_period_week()}</option>
							<option value="month">{m.planner_period_month()}</option>
						</select>
					</div>

					<div class="field-group">
						<label for="plan-preset">{m.planner_preset_label()}</label>
						<select
							id="plan-preset"
							value={meal_plan_store.mealPlan.planning_preset ?? "this_week"}
							onchange={(event) =>
								set_preset(
									(event.currentTarget as HTMLSelectElement)
										.value as PlanningPreset,
								)}
						>
							<option value="this_week">{m.planner_preset_this_week()}</option>
							<option value="next_week">{m.planner_preset_next_week()}</option>
							<option value="this_month">{m.planner_preset_this_month()}</option
							>
							<option value="custom_range"
								>{m.planner_preset_custom_range()}</option
							>
						</select>
					</div>
				</div>

				{#if meal_plan_store.mealPlan.planning_preset === "custom_range"}
					<div class="split-grid">
						<div class="field-group">
							<label for="start-date">{m.planner_custom_start_label()}</label>
							<input
								id="start-date"
								type="date"
								value={meal_plan_store.mealPlan.start_date ?? ""}
								oninput={(event) =>
									handle_custom_range_change(
										(event.currentTarget as HTMLInputElement).value,
										meal_plan_store.mealPlan.end_date ??
											(event.currentTarget as HTMLInputElement).value,
									)}
							/>
						</div>

						<div class="field-group">
							<label for="end-date">{m.planner_custom_end_label()}</label>
							<input
								id="end-date"
								type="date"
								value={meal_plan_store.mealPlan.end_date ?? ""}
								oninput={(event) =>
									handle_custom_range_change(
										meal_plan_store.mealPlan.start_date ??
											(event.currentTarget as HTMLInputElement).value,
										(event.currentTarget as HTMLInputElement).value,
									)}
							/>
						</div>
					</div>
				{/if}
			</div>
		{:else if active_tab === "meal"}
			<div
				class="panel planner-panel form-panel"
				role="tabpanel"
				id="planner-panel-meal"
				aria-labelledby="planner-tab-meal"
			>
				<div class="section-heading compact">
					<h2>{m.planner_form_title()}</h2>
					<p>{m.planner_form_subtitle()}</p>
				</div>
				<p class="hint">
					{m.planner_default_servings_hint({
						count: `${household_store.profile.default_servings}`,
					})}
				</p>

				<div class="split-grid">
					<div class="field-group">
						<label for="recipe-id">{m.planner_recipe_label()}</label>
						<select id="recipe-id" bind:value={selected_recipe_id}>
							{#each meal_plan_store.recipes as recipe}
								<option value={recipe.id}>{recipe.name}</option>
							{/each}
						</select>
					</div>

					<div class="field-group">
						<label for="entry-date">{m.planner_date_label()}</label>
						<input
							id="entry-date"
							type="date"
							min={meal_plan_store.mealPlan.start_date}
							max={meal_plan_store.mealPlan.end_date}
							bind:value={selected_date}
						/>
					</div>
				</div>

				<p class="field-note">
					{planner_range_rule_hint_message(plan_range_label)}
				</p>

				<div class="split-grid">
					<div class="field-group">
						<label for="meal-type">{m.planner_meal_type_label()}</label>
						<select id="meal-type" bind:value={selected_meal_type}>
							<option value="breakfast"
								>{m.planner_meal_type_breakfast()}</option
							>
							<option value="lunch">{m.planner_meal_type_lunch()}</option>
							<option value="dinner">{m.planner_meal_type_dinner()}</option>
							<option value="snack">{m.planner_meal_type_snack()}</option>
						</select>
					</div>

					<div class="field-group">
						<label for="servings">{m.planner_servings_label()}</label>
						<input
							id="servings"
							type="number"
							min="1"
							bind:value={servings_input}
						/>
					</div>
				</div>

				<label class="checkbox-row" for="recurrence-enabled">
					<input
						id="recurrence-enabled"
						type="checkbox"
						bind:checked={recurrence_enabled}
					/>
					<span>{m.planner_recurrence_enabled()}</span>
				</label>

				{#if recurrence_enabled}
					<div class="split-grid">
						<div class="field-group">
							<label for="frequency">{m.planner_frequency_label()}</label>
							<select id="frequency" bind:value={recurrence_frequency}>
								<option value="day">{m.planner_frequency_day()}</option>
								<option value="week">{m.planner_frequency_week()}</option>
								<option value="month">{m.planner_frequency_month()}</option>
								<option value="year">{m.planner_frequency_year()}</option>
							</select>
						</div>

						<div class="field-group">
							<label for="interval">{m.planner_interval_label()}</label>
							<input
								id="interval"
								type="number"
								min="1"
								bind:value={recurrence_interval}
							/>
						</div>
					</div>

					<div class="split-grid">
						<div class="field-group">
							<label for="ends-on">{m.planner_ends_on_label()}</label>
							<input id="ends-on" type="date" bind:value={recurrence_ends_on} />
							<input
								id="ends-on"
								type="date"
								min={selected_date || meal_plan_store.mealPlan.start_date}
								max={meal_plan_store.mealPlan.end_date}
								bind:value={recurrence_ends_on}
							/>
						</div>

						<div class="field-group">
							<label for="occurrence-count"
								>{m.planner_occurrence_count_label()}</label
							>
							<input
								id="occurrence-count"
								type="number"
								min="1"
								bind:value={recurrence_count}
							/>
						</div>
					</div>
				{/if}

				{#if editing_series_id}
					<p class="editing-note">{m.planner_editing_series()}</p>
				{:else if editing_entry_id}
					<p class="editing-note">{m.planner_editing_single()}</p>
				{/if}

				<div class="action-row">
					<Button variant="primary" size="medium" round onclick={handle_submit}>
						{editing_series_id
							? m.planner_update_series()
							: editing_entry_id
								? m.planner_update_entry()
								: m.planner_add_entry()}
					</Button>
					<Button variant="outline" size="medium" round onclick={reset_form}>
						{m.planner_reset_form()}
					</Button>
					<Button
						variant="danger"
						size="medium"
						round
						onclick={clear_current_plan}
					>
						{m.planner_clear_plan()}
					</Button>
				</div>
			</div>
		{:else if active_tab === "overview"}
			<div
				class="panel planner-panel overview-panel"
				role="tabpanel"
				id="planner-panel-overview"
				aria-labelledby="planner-tab-overview"
			>
				<div class="section-heading compact">
					<h2>{m.planner_schedule_preview_title()}</h2>
					<p>{m.planner_schedule_preview_subtitle()}</p>
				</div>

				{#if overview_days.length === 0}
					<div class="empty-panel">
						<p class="empty">{m.planner_preview_empty()}</p>
						<Button
							variant="primary"
							size="medium"
							round
							onclick={() => open_tab("meal")}
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
										<header class="overview-day-header">
											<div>
												<p class="overview-weekday">{day.weekday_label}</p>
												<h3>{day.date_label}</h3>
											</div>
											{#if day.entry_count > 0}
												<span class="overview-count">{day.entry_count}</span>
											{/if}
										</header>

										{#if day.entry_count === 0}
											<p class="overview-empty">
												{m.planned_meals_day_empty()}
											</p>
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
									</article>
								{:else}
									<div class="overview-placeholder" aria-hidden="true"></div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="panel planner-panel entries-panel"
				role="tabpanel"
				id="planner-panel-entries"
				aria-labelledby="planner-tab-entries"
			>
				<div class="entries-heading">
					<h2>{m.planner_entries_title()}</h2>
					<Button
						variant="outline"
						size="medium"
						round
						onclick={() => open_tab("meal")}
					>
						{m.planner_add_entry()}
					</Button>
				</div>

				{#if conflicts.length > 0}
					<div class="conflicts">
						<h3>{m.planner_conflicts_title()}</h3>
						<ul>
							{#each conflicts as conflict}
								<li>
									{m.planner_conflict_item({
										date: conflict.date,
										meal_type: get_meal_type_label(conflict.meal_type),
									})}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if entries.length === 0}
					<div class="empty-panel">
						<p class="empty">{m.planner_no_entries()}</p>
						<Button
							variant="primary"
							size="medium"
							round
							onclick={() => open_tab("meal")}
						>
							{m.planner_add_entry()}
						</Button>
					</div>
				{:else}
					<div class="entry-list">
						{#each entries as entry}
							<article class="entry-card">
								<div class="entry-copy">
									<h3>{get_recipe_name(entry.recipe_id)}</h3>
									<p>
										{entry.date} · {get_meal_type_label(entry.meal_type)} · {entry.servings}
									</p>
									{#if get_recurrence_summary(entry.recurrence_rule)}
										<p class="recurrence-text">
											{get_recurrence_summary(entry.recurrence_rule)}
										</p>
									{/if}
								</div>
								<div class="entry-actions">
									<button type="button" onclick={() => begin_single_edit(entry)}
										>{m.planner_edit_entry()}</button
									>
									{#if entry.series_id}
										<button
											type="button"
											onclick={() => begin_series_edit(entry)}
											>{m.planner_edit_series()}</button
										>
									{/if}
									<button
										type="button"
										class="danger-link"
										onclick={() => meal_plan_store.removeEntry(entry.id)}
										>{m.planner_remove_entry()}</button
									>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.planner-context {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 24px;

		@include md {
			padding: 1.15rem;
		}

		@include lg {
			grid-template-columns: minmax(0, 1fr) minmax(20rem, 24rem);
			align-items: end;
		}
	}

	.planner-context__copy,
	.planner-context__controls,
	.planner-tabs {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}

	.planner-context__copy {
		h2 {
			font-size: 1.4rem;
			line-height: 1.05;
		}

		p {
			color: var(--text-muted);
		}
	}

	.plan-id {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.2rem 0.35rem;
		width: fit-content;
		max-width: 100%;
		min-width: 0;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
		background: color-mix(in srgb, var(--surface-muted) 82%, var(--surface));
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--primary);
		white-space: normal;
	}

	.plan-id__separator {
		flex: 0 0 auto;
	}

	.plan-id__household,
	.plan-id__value {
		min-width: 0;
	}

	.plan-id__value {
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.planner-context__cta {
		display: grid;
		gap: 0.5rem;
	}

	.planner-tabs {
		padding: 0.75rem;
		border-radius: 24px;
		gap: 0.75rem;

		@include md {
			padding: 1rem;
		}
	}

	.planner-tabs__nav {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);

		button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			flex: 0 0 auto;
			gap: 0.45rem;
			min-width: max-content;
			padding: 0.7rem 1rem;
			border: none;
			border-radius: 14px;
			background: transparent;
			color: var(--text-muted);
			font-size: 0.9rem;
			font-weight: 700;
			white-space: nowrap;
			cursor: pointer;
			transition:
				background-color var(--motion-base, 180ms) var(--ease-standard, ease),
				color var(--motion-base, 180ms) var(--ease-standard, ease),
				transform var(--motion-base, 180ms) var(--ease-standard, ease);

			&:hover,
			&:focus-visible,
			&.active {
				background: color-mix(in srgb, var(--primary) 14%, transparent);
				color: var(--primary);
			}

			.tab-icon {
				flex-shrink: 0;
			}

			small {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 1.5rem;
				height: 1.5rem;
				padding: 0 0.4rem;
				border-radius: 999px;
				background: color-mix(
					in srgb,
					var(--surface-muted) 85%,
					var(--surface)
				);
				color: inherit;
				font-size: 0.75rem;
			}
		}
	}

	.panel {
		padding: 1rem;
		border-radius: 24px;
		min-width: 0;

		@include md {
			padding: 1.15rem;
		}
	}

	.planner-panel {
		background: color-mix(in srgb, var(--surface) 96%, transparent);
		border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
	}

	.section-heading {
		display: grid;
		gap: 0.35rem;
		margin-bottom: 0.35rem;

		&.compact {
			margin-bottom: 0;
		}

		h2 {
			font-size: 1.2rem;
			line-height: 1.1;
		}

		p:last-child {
			color: var(--text-muted);
			font-size: 0.95rem;
		}
	}

	.eyebrow {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent-berry);
	}

	.settings-panel,
	.form-panel,
	.overview-panel,
	.entries-panel,
	.empty-panel {
		display: grid;
		gap: 1rem;
	}

	.split-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.9rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
		max-width: 100%;

		label {
			font-size: 0.875rem;
			font-weight: 600;
		}

		input,
		select {
			width: 100%;
			max-width: 100%;
			min-width: 0;
			padding: 0.75rem 0.85rem;
			background-color: color-mix(in srgb, var(--surface) 92%, transparent);
			border: 1px solid var(--border);
			border-radius: 16px;
			color: var(--text);
		}

		select {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.field-note {
		font-size: 0.85rem;
		color: var(--text-muted);
		overflow-wrap: anywhere;
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 600;
	}

	.hint,
	.editing-note,
	.recurrence-text,
	.empty {
		color: var(--text-muted);
	}

	.action-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		@include md {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}

	.empty-panel {
		justify-items: start;
	}

	.overview-scroll {
		overflow-x: auto;
		padding-bottom: 0.2rem;
	}

	.overview-weekday-row,
	.overview-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(10rem, 1fr));
		min-width: 70rem;
	}

	.overview-weekday-row {
		gap: 0.65rem;
		margin-bottom: 0.65rem;
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
		background-color: color-mix(in srgb, var(--surface) 65%, transparent);
		border-style: dashed;
		opacity: 0.45;
	}

	.overview-day {
		gap: 0.75rem;

		&.has-meals {
			border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
		}

		h3 {
			font-size: 1rem;
		}
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

		small {
			color: var(--primary);
			font-weight: 700;
		}
	}

	.conflicts {
		padding: 1rem;
		border-radius: 18px;
		background-color: color-mix(in srgb, var(--warning) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--warning) 26%, transparent);
		display: grid;
		gap: 0.5rem;

		ul {
			padding-left: 1.1rem;
		}
	}

	.entry-list {
		display: grid;
		gap: 0.75rem;
	}

	.entries-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.entry-card {
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 95%, transparent);

		@include md {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}
	}

	.entry-copy {
		display: grid;
		gap: 0.25rem;

		h3 {
			font-size: 1rem;
		}
	}

	.entry-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;

		button {
			background: none;
			border: none;
			padding: 0;
			color: var(--primary);
			font-weight: 700;
			cursor: pointer;
		}
	}

	.danger-link {
		color: var(--error) !important;
	}
</style>
