<script lang="ts">
	import { browser } from "$app/environment";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import { announce } from "$lib/utils/announce";
	import {
		build_recipe_pool,
		collect_plan_dates,
	} from "$lib/utils/recipe-generation";
	import type { ExpandedMealPlanEntry, MealType } from "$lib/types/planning";
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
	const meal_types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
	const generated_meal_types: MealType[] = ["lunch", "dinner"];

	let is_regenerating = $state<"month" | "two_weeks" | null>(null);
	let calendar_feedback = $state<string | null>(null);

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

	function show_calendar_feedback(message: string) {
		calendar_feedback = message;
		announce(message);
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
		preset?: "this_month";
		feedback_message: string;
	}) {
		clear_calendar_feedback();

		meal_plan_store.setPeriod(range.period);

		if (range.preset === "this_month") {
			meal_plan_store.setPlanningPreset(range.preset);
		} else {
			meal_plan_store.setCustomRange(range.start_date, range.end_date);
		}

		meal_plan_store.clearPlan();

		const recipe_pool = build_recipe_pool(
			meal_plan_store.recipes,
			get_browser_timezone(),
		);
		const plan_dates = collect_plan_dates(
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
			Number.MAX_SAFE_INTEGER,
		);

		if (recipe_pool.length === 0 || plan_dates.length === 0) {
			show_calendar_feedback(m.planner_calendar_generate_empty_feedback());
			return;
		}

		let recipe_index = 0;

		for (const plan_date of plan_dates) {
			for (const meal_type of generated_meal_types) {
				const recipe = recipe_pool[recipe_index % recipe_pool.length];

				if (!recipe) {
					continue;
				}

				meal_plan_store.addEntry({
					recipe_id: recipe.id,
					date: plan_date,
					meal_type,
					servings: household_store.profile.default_servings,
				});
				recipe_index += 1;
			}
		}

		show_calendar_feedback(range.feedback_message);
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
				preset: "this_month",
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
	<div class="calendar-page surface-panel">
		{#if calendar_feedback}
			<div class="calendar-feedback" role="status" aria-live="polite">
				<p>{calendar_feedback}</p>
			</div>
		{/if}

		<header class="calendar-header">
			<div class="section-heading">
				<p class="eyebrow">{meal_plan_store.mealPlan.name}</p>
				<h1>{m.planner_schedule_preview_title()}</h1>
				<p>{m.planner_schedule_preview_subtitle()}</p>
				<p class="summary">{active_plan_summary}</p>
			</div>

			<div class="calendar-actions">
				<Button
					variant="secondary"
					size="medium"
					round
					loading={is_regenerating === "month"}
					disabled={is_regenerating !== null}
					onclick={regenerate_month_plan}
				>
					{m.planner_calendar_generate_month()}
				</Button>
				<Button
					variant="secondary"
					size="medium"
					round
					loading={is_regenerating === "two_weeks"}
					disabled={is_regenerating !== null}
					onclick={regenerate_next_two_weeks_plan}
				>
					{m.planner_calendar_generate_two_weeks()}
				</Button>
				<Button
					variant="outline"
					size="medium"
					round
					href={localizeHref("/planner?tab=setup")}
				>
					{m.planner_settings_title()}
				</Button>
				<Button
					variant="primary"
					size="medium"
					round
					href={localizeHref("/planner?tab=meal")}
				>
					{m.planner_add_entry()}
				</Button>
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
																	>{get_recipe_name(occurrence.recipe_id)}</span
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
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: grid;
		gap: 1rem;
		min-width: 0;
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
		display: grid;
		gap: 1rem;

		@include lg {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
		}
	}

	.section-heading {
		display: grid;
		gap: 0.35rem;

		h1 {
			font-size: 1.4rem;
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

	.summary {
		overflow-wrap: anywhere;
	}

	.calendar-actions {
		display: grid;
		gap: 0.75rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, auto));
			justify-content: end;
		}

		@include lg {
			grid-template-columns: repeat(4, minmax(0, auto));
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

		h2 {
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
		text-decoration: none;

		small {
			color: var(--primary);
			font-weight: 700;
		}
	}
</style>
