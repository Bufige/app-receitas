<script lang="ts">
	import Button from "$lib/components/ui/Button/index.svelte";
	import ProfileTabs from "$lib/components/ui/ProfileTabs/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import {
		build_history_recent_activity,
		build_history_top_recipe_names,
		build_plan_history_summaries,
		type PlanHistoryRange,
	} from "$lib/utils/history";
	import { format_plan_selection_label } from "$lib/utils/planning";

	const meal_plan_store = useMealPlanStore();
	let selected_plan_id = $state("all");
	let filter_start_date = $state("");
	let filter_end_date = $state("");

	function history_filters_title(): string {
		return m.profile_history_filters_title();
	}

	function history_plan_filter_label(): string {
		return m.profile_history_plan_filter_label();
	}

	function history_all_plans(): string {
		return m.profile_history_all_plans();
	}

	function history_clear_filters(): string {
		return m.profile_history_clear_filters();
	}

	function history_filtered_snapshot(): string {
		return m.profile_history_filtered_snapshot();
	}

	function history_plan_snapshot(): string {
		return m.profile_history_plan_snapshot();
	}

	function history_matching_plans(): string {
		return m.profile_history_matching_plans();
	}

	function history_empty(): string {
		return m.profile_history_empty();
	}

	const available_plans = $derived(meal_plan_store.mealPlans);
	const selected_plans = $derived.by(() =>
		selected_plan_id === "all"
			? available_plans
			: available_plans.filter((plan) => plan.id === selected_plan_id),
	);
	const active_range = $derived.by((): PlanHistoryRange | undefined => {
		const start_date = filter_start_date || undefined;
		const end_date = filter_end_date || undefined;

		if (!start_date && !end_date) {
			return undefined;
		}

		if (start_date && end_date && start_date > end_date) {
			return {
				start_date: end_date,
				end_date: start_date,
			};
		}

		return { start_date, end_date };
	});
	const has_active_filters = $derived.by(
		() =>
			selected_plan_id !== "all" ||
			Boolean(filter_start_date) ||
			Boolean(filter_end_date),
	);
	const filtered_plan_summaries = $derived.by(() => {
		const summaries = build_plan_history_summaries(
			selected_plans,
			active_range,
		);

		if (!active_range || selected_plan_id !== "all") {
			return summaries;
		}

		return summaries.filter(
			(plan) =>
				plan.total_occurrences > 0 ||
				plan.shopping_item_count > 0 ||
				plan.recurring_series_count > 0,
		);
	});
	const history_activity = $derived.by(() =>
		build_history_recent_activity(selected_plans, active_range),
	);
	const history_top_recipe_names = $derived.by(() =>
		build_history_top_recipe_names(selected_plans, active_range),
	);
	const focused_plan_summary = $derived.by(() =>
		selected_plan_id === "all" ? null : (filtered_plan_summaries[0] ?? null),
	);
	const snapshot_range = $derived.by(() => {
		if (focused_plan_summary) {
			return {
				start: focused_plan_summary.start_date ?? "-",
				end: focused_plan_summary.end_date ?? "-",
			};
		}

		if (active_range?.start_date || active_range?.end_date) {
			return {
				start: active_range?.start_date ?? "-",
				end: active_range?.end_date ?? "-",
			};
		}

		const start_dates = filtered_plan_summaries
			.map((plan) => plan.start_date)
			.filter((value): value is string => Boolean(value))
			.sort((first, second) => first.localeCompare(second));
		const end_dates = filtered_plan_summaries
			.map((plan) => plan.end_date)
			.filter((value): value is string => Boolean(value))
			.sort((first, second) => second.localeCompare(first));

		return {
			start: start_dates[0] ?? "-",
			end: end_dates[0] ?? "-",
		};
	});
	const totals = $derived.by(() => {
		const plans = filtered_plan_summaries;
		return {
			total_plans: plans.length,
			total_occurrences: plans.reduce(
				(sum, plan) => sum + plan.total_occurrences,
				0,
			),
			total_shopping_items: plans.reduce(
				(sum, plan) => sum + plan.shopping_item_count,
				0,
			),
			total_recurring_series: plans.reduce(
				(sum, plan) => sum + plan.recurring_series_count,
				0,
			),
		};
	});

	function clear_filters() {
		selected_plan_id = "all";
		filter_start_date = "";
		filter_end_date = "";
	}
</script>

<SEO
	title={m.seo_profile_history_title()}
	description={m.seo_profile_history_description()}
/>

<section class="page">
	<header class="hero">
		<div>
			<h1>{m.profile_history_title()}</h1>
			<p>{m.profile_history_subtitle()}</p>
		</div>
		<a class="planner-link" href={localizeHref("/planner")}
			>{m.profile_history_open_planner()}</a
		>
	</header>

	<ProfileTabs />

	<section class="panel filters-panel">
		<div class="panel-header">
			<h2>{history_filters_title()}</h2>
			{#if has_active_filters}
				<Button variant="outline" size="small" round onclick={clear_filters}>
					{history_clear_filters()}
				</Button>
			{/if}
		</div>

		<div class="filter-grid">
			<div class="field-group">
				<label for="history-plan-filter">{history_plan_filter_label()}</label>
				<select id="history-plan-filter" bind:value={selected_plan_id}>
					<option value="all">{history_all_plans()}</option>
					{#each available_plans as plan}
						<option value={plan.id}>{format_plan_selection_label(plan)}</option>
					{/each}
				</select>
			</div>

			<div class="field-group">
				<label for="history-start-date">{m.planner_custom_start_label()}</label>
				<input
					id="history-start-date"
					type="date"
					bind:value={filter_start_date}
				/>
			</div>

			<div class="field-group">
				<label for="history-end-date">{m.planner_custom_end_label()}</label>
				<input id="history-end-date" type="date" bind:value={filter_end_date} />
			</div>
		</div>
	</section>

	<section class="overview-grid">
		<article class="stat-card">
			<span>{m.profile_history_total_plans()}</span>
			<strong>{totals.total_plans}</strong>
		</article>
		<article class="stat-card">
			<span>{m.profile_history_total_occurrences()}</span>
			<strong>{totals.total_occurrences}</strong>
		</article>
		<article class="stat-card">
			<span>{m.profile_history_total_shopping_items()}</span>
			<strong>{totals.total_shopping_items}</strong>
		</article>
		<article class="stat-card">
			<span>{m.profile_history_recurring_series()}</span>
			<strong>{totals.total_recurring_series}</strong>
		</article>
	</section>

	<div class="content-grid">
		<section class="panel current-plan">
			<div class="panel-header">
				<h2>
					{focused_plan_summary
						? history_plan_snapshot()
						: history_filtered_snapshot()}
				</h2>
				<span>
					{m.profile_history_plan_range({
						start: snapshot_range.start,
						end: snapshot_range.end,
					})}
				</span>
			</div>
			{#if filtered_plan_summaries.length === 0}
				<p class="empty-copy">{history_empty()}</p>
			{:else}
				<h3>
					{focused_plan_summary?.name ?? history_filtered_snapshot()}
				</h3>
				<div class="summary-row">
					<span
						>{m.profile_history_plan_occurrences({
							count: `${totals.total_occurrences}`,
						})}</span
					>
					<span
						>{m.profile_history_plan_items({
							count: `${totals.total_shopping_items}`,
						})}</span
					>
					<span
						>{m.profile_history_plan_recurring({
							count: `${totals.total_recurring_series}`,
						})}</span
					>
				</div>
				<div class="chips">
					{#each history_top_recipe_names as recipe_name}
						<span>{recipe_name}</span>
					{/each}
				</div>
			{/if}
		</section>

		<section class="panel activity-panel">
			<h2>{m.profile_history_recent_activity()}</h2>
			{#if history_activity.length === 0}
				<p class="empty-copy">{history_empty()}</p>
			{:else}
				<div class="activity-list">
					{#each history_activity as activity}
						<article class="activity-item">
							<div>
								<h3>
									{m.profile_history_activity_meal({
										recipe: activity.recipe_name,
										date: activity.date,
									})}
								</h3>
								<p class="activity-plan">{activity.plan_name}</p>
								{#if activity.recurrence_ends_on}
									<p>
										{m.profile_history_activity_recurring({
											date: activity.recurrence_ends_on,
										})}
									</p>
								{/if}
							</div>
							<time datetime={activity.date}>{activity.date}</time>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<section class="panel plan-list-panel">
		<h2>{history_matching_plans()}</h2>
		{#if filtered_plan_summaries.length === 0}
			<p class="empty-copy">{history_empty()}</p>
		{:else}
			<div class="plan-list">
				{#each filtered_plan_summaries as plan}
					<article class="plan-card">
						<div class="plan-card-header">
							<div>
								<h3>{plan.name}</h3>
								<p>
									{m.profile_history_plan_range({
										start: plan.start_date ?? "-",
										end: plan.end_date ?? "-",
									})}
								</p>
							</div>
							<span class="period-badge">{plan.period}</span>
						</div>
						<div class="summary-row compact">
							<span
								>{m.profile_history_plan_occurrences({
									count: `${plan.total_occurrences}`,
								})}</span
							>
							<span
								>{m.profile_history_plan_items({
									count: `${plan.shopping_item_count}`,
								})}</span
							>
							<span
								>{m.profile_history_plan_recurring({
									count: `${plan.recurring_series_count}`,
								})}</span
							>
						</div>
						<div class="chips">
							{#each plan.top_recipe_names as recipe_name}
								<span>{recipe_name}</span>
							{/each}
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
	.panel,
	.stat-card {
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

		p {
			color: var(--text-muted);
		}
	}

	.planner-link {
		color: var(--primary);
		font-weight: 600;
	}

	.filters-panel {
		display: grid;
		gap: 1rem;
	}

	.filter-grid {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: 1fr;

		@include md {
			grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(0, 1fr));
			align-items: end;
		}
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		min-width: 0;

		label {
			font-size: 0.875rem;
			font-weight: 600;
		}

		input,
		select {
			width: 100%;
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

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;

		@include md {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		span {
			font-size: 0.875rem;
			color: var(--text-muted);
		}

		strong {
			font-size: 1.75rem;
		}
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include md {
			grid-template-columns: 1.2fr 1fr;
		}
	}

	.panel-header,
	.summary-row,
	.plan-card-header,
	.activity-item {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.panel-header,
	.plan-card-header {
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.summary-row {
		flex-wrap: wrap;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.compact {
		font-size: 0.8125rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;

		span {
			padding: 0.35rem 0.7rem;
			border-radius: 999px;
			background-color: color-mix(in srgb, var(--primary) 14%, transparent);
			font-size: 0.8125rem;
		}
	}

	.activity-list,
	.plan-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.activity-item,
	.plan-card {
		padding: 1rem;
		border-radius: 16px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 98%, transparent);
	}

	.activity-item {
		align-items: flex-start;

		p,
		time {
			color: var(--text-muted);
		}
	}

	.activity-plan,
	.empty-copy {
		color: var(--text-muted);
	}

	.plan-card p {
		color: var(--text-muted);
	}

	.period-badge {
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background-color: color-mix(in srgb, var(--secondary) 22%, transparent);
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: capitalize;
	}
</style>
