<script lang="ts">
	import { page } from "$app/state";
	import Icon from "@iconify/svelte";
	import calendarRangeOutline from "@iconify-icons/mdi/calendar-range-outline";
	import layersTripleOutline from "@iconify-icons/mdi/layers-triple-outline";
	import repeatVariant from "@iconify-icons/mdi/repeat-variant";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type {
		ExpandedMealPlanEntry,
		MealPlanEntry,
		MealType,
		PlanningPreset,
		RecurrenceFrequency,
		RecurrenceRule,
	} from "$lib/types/planning";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { expand_meal_plan_entries } from "$lib/utils/planning";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();
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
	const plan_range_label = $derived.by(() => {
		const { start_date, end_date } = meal_plan_store.mealPlan;
		if (!start_date && !end_date) {
			return "—";
		}

		if (!start_date || !end_date || start_date === end_date) {
			return start_date ?? end_date ?? "—";
		}

		return `${start_date} → ${end_date}`;
	});
	const preview_days = $derived.by(() => {
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

		return [...grouped.entries()]
			.slice(0, 6)
			.map(([date, slots]) => ({ date, slots }));
	});

	$effect(() => {
		const recipe_from_query = page.url.searchParams.get("recipe");
		if (recipe_from_query) {
			selected_recipe_id = recipe_from_query;
		}
	});

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

		if (editing_series_id) {
			meal_plan_store.updateSeries(editing_series_id, payload);
		} else if (editing_entry_id) {
			meal_plan_store.updateEntry(editing_entry_id, payload);
		} else {
			meal_plan_store.addEntry({
				recipe_id: selected_recipe_id,
				date: selected_date,
				meal_type: selected_meal_type,
				servings: payload.servings,
				recurrence_rule: payload.recurrence_rule,
			});
		}

		reset_form();
	}

	function begin_single_edit(entry: MealPlanEntry) {
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
		meal_plan_store.setPlanningPreset(preset);
	}
</script>

<SEO title={m.seo_planner_title()} description={m.seo_planner_description()} />

<section class="page">
	<PageHero title={m.planner_title()} subtitle={m.planner_subtitle()}>
		{#snippet actions()}
			<div class="hero-actions">
				<Button
					href={localizeHref("/planned-meals")}
					variant="primary"
					size="medium"
					round
				>
					{m.planner_open_planned_meals()}
				</Button>
				<Button
					href={localizeHref("/shopping-list")}
					variant="outline"
					size="medium"
					round
				>
					{m.nav_shopping_list()}
				</Button>
			</div>
		{/snippet}
	</PageHero>

	<div class="summary-grid">
		<article class="summary-card surface-panel">
			<div class="summary-icon">
				<Icon icon={calendarRangeOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_period()}</p>
				<strong>{plan_range_label}</strong>
			</div>
		</article>
		<article class="summary-card surface-panel">
			<div class="summary-icon">
				<Icon icon={layersTripleOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_occurrences()}</p>
				<strong>{expanded_entries.length}</strong>
			</div>
		</article>
		<article class="summary-card surface-panel">
			<div class="summary-icon">
				<Icon icon={repeatVariant} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_recurring()}</p>
				<strong>{recurring_series_count}</strong>
			</div>
		</article>
	</div>

	<div class="planner-layout">
		<div class="planner-sidebar">
			<section class="panel surface-panel settings-panel">
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
									meal_plan_store.setCustomRange(
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
									meal_plan_store.setCustomRange(
										meal_plan_store.mealPlan.start_date ??
											(event.currentTarget as HTMLInputElement).value,
										(event.currentTarget as HTMLInputElement).value,
									)}
							/>
						</div>
					</div>
				{/if}
			</section>

			<section class="panel surface-panel form-panel">
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
						<input id="entry-date" type="date" bind:value={selected_date} />
					</div>
				</div>

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
					<Button variant="primary" size="medium" round onclick={handle_submit}
						>{editing_series_id
							? m.planner_update_series()
							: editing_entry_id
								? m.planner_update_entry()
								: m.planner_add_entry()}</Button
					>
					<Button variant="outline" size="medium" round onclick={reset_form}
						>{m.planner_reset_form()}</Button
					>
					<Button
						variant="danger"
						size="medium"
						round
						onclick={() => meal_plan_store.reset()}
						>{m.planner_clear_plan()}</Button
					>
				</div>
			</section>
		</div>

		<div class="planner-main">
			<section class="panel surface-panel preview-panel">
				<div class="section-heading compact">
					<h2>{m.planner_schedule_preview_title()}</h2>
					<p>{m.planner_schedule_preview_subtitle()}</p>
				</div>

				{#if preview_days.length === 0}
					<p class="empty">{m.planner_preview_empty()}</p>
				{:else}
					<div class="preview-grid">
						{#each preview_days as day}
							<article class="day-card">
								<header><h3>{day.date}</h3></header>
								<div class="slot-list">
									{#each meal_types as meal_type}
										<div class="slot-row">
											<span class="slot-label"
												>{get_meal_type_label(meal_type)}</span
											>
											<div class="slot-content">
												{#if day.slots[meal_type].length === 0}
													<span class="slot-empty"
														>{m.planned_meals_day_empty()}</span
													>
												{:else}
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
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<section class="panel surface-panel entries-panel">
				<h2>{m.planner_entries_title()}</h2>

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
					<p class="empty">{m.planner_no_entries()}</p>
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
			</section>
		</div>
	</div>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		width: 100%;

		@include md {
			justify-content: flex-end;
		}
	}

	.summary-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;

		@include md {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.summary-card {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem;

		p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		strong {
			display: block;
			margin-top: 0.15rem;
			font-size: 1rem;
		}
	}

	.summary-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--primary) 10%, var(--surface));
		color: var(--primary);
		flex-shrink: 0;
	}

	.planner-layout {
		display: grid;
		gap: 1rem;

		@include lg {
			grid-template-columns: minmax(20rem, 0.9fr) minmax(0, 1.1fr);
			align-items: start;
		}
	}

	.planner-sidebar,
	.planner-main {
		display: grid;
		gap: 1rem;
	}

	.panel {
		padding: 1rem;
		border-radius: 24px;

		@include md {
			padding: 1.15rem;
		}
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
	.preview-panel,
	.entries-panel {
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

		label {
			font-size: 0.875rem;
			font-weight: 600;
		}

		input,
		select {
			width: 100%;
			padding: 0.75rem 0.85rem;
			background-color: color-mix(in srgb, var(--surface) 92%, transparent);
			border: 1px solid var(--border);
			border-radius: 16px;
			color: var(--text);
		}
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
	.empty,
	.slot-empty {
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

	.preview-grid {
		display: grid;
		gap: 0.85rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.day-card {
		display: grid;
		gap: 0.75rem;
		padding: 0.9rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 95%, transparent);

		h3 {
			font-size: 1rem;
		}
	}

	.slot-list {
		display: grid;
		gap: 0.65rem;
	}

	.slot-row {
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
