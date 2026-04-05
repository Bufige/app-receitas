<script lang="ts">
	import { page } from "$app/state";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type {
		MealPlanEntry,
		MealType,
		PlanningPreset,
		RecurrenceFrequency,
		RecurrenceRule,
	} from "$lib/types/planning";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();

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
	<header class="hero">
		<div>
			<h1>{m.planner_title()}</h1>
			<p>{m.planner_subtitle()}</p>
		</div>
		<a class="shopping-link" href={localizeHref("/shopping-list")}
			>{m.nav_shopping_list()}</a
		>
	</header>

	<section class="panel settings">
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
					<option value="this_month">{m.planner_preset_this_month()}</option>
					<option value="custom_range">{m.planner_preset_custom_range()}</option
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

	<section class="panel form-panel">
		<h2>{m.planner_form_title()}</h2>
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
					<option value="breakfast">{m.planner_meal_type_breakfast()}</option>
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

		<div class="actions">
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
				onclick={() => meal_plan_store.reset()}
			>
				{m.planner_clear_plan()}
			</Button>
		</div>
	</section>

	<section class="panel entries-panel">
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
						<div>
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
							<button type="button" onclick={() => begin_single_edit(entry)}>
								{m.planner_edit_entry()}
							</button>
							{#if entry.series_id}
								<button type="button" onclick={() => begin_series_edit(entry)}>
									{m.planner_edit_series()}
								</button>
							{/if}
							<button
								type="button"
								class="danger-link"
								onclick={() => meal_plan_store.removeEntry(entry.id)}
							>
								{m.planner_remove_entry()}
							</button>
						</div>
					</article>
				{/each}
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

	.hero,
	.panel {
		padding: 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		@include md {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		h1 {
			font-size: 1.75rem;
			margin-bottom: 0.25rem;
		}

		p {
			color: var(--text-muted);
		}
	}

	.shopping-link {
		color: var(--primary);
		font-weight: 600;
	}

	.settings,
	.form-panel,
	.entries-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.split-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

		label {
			font-size: 0.875rem;
			font-weight: 500;
		}

		input,
		select {
			width: 100%;
			padding: 0.625rem 0.75rem;
			background-color: color-mix(in srgb, var(--surface) 45%, transparent);
			border: 1px solid var(--border);
			border-radius: 6px;
		}
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hint,
	.editing-note,
	.recurrence-text,
	.empty {
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		@include md {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}

	.conflicts {
		padding: 1rem;
		border-radius: 14px;
		background-color: color-mix(in srgb, var(--warning) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		ul {
			padding-left: 1.25rem;
		}
	}

	.entry-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.entry-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 14px;
		border: 1px solid var(--border);

		@include md {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
		}

		h3 {
			margin-bottom: 0.25rem;
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
			font-weight: 600;
			cursor: pointer;
		}
	}

	.danger-link {
		color: var(--error) !important;
	}
</style>
