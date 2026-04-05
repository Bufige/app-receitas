<script lang="ts">
	import ProfileTabs from "$lib/components/ui/ProfileTabs/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import {
		build_plan_history_summaries,
		mock_plan_history,
	} from "$lib/utils/history";

	const meal_plan_store = useMealPlanStore();
	const current_plan_summary = $derived(
		build_plan_history_summaries([meal_plan_store.mealPlan])[0],
	);
	const previous_plans = mock_plan_history.slice(1);
	const totals = $derived.by(() => {
		const plans = [current_plan_summary, ...previous_plans];
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
				<h2>{m.profile_history_current_plan()}</h2>
				<span>
					{m.profile_history_plan_range({
						start: current_plan_summary.start_date ?? "-",
						end: current_plan_summary.end_date ?? "-",
					})}
				</span>
			</div>
			<h3>{current_plan_summary.name}</h3>
			<div class="summary-row">
				<span
					>{m.profile_history_plan_occurrences({
						count: `${current_plan_summary.total_occurrences}`,
					})}</span
				>
				<span
					>{m.profile_history_plan_items({
						count: `${current_plan_summary.shopping_item_count}`,
					})}</span
				>
				<span
					>{m.profile_history_plan_recurring({
						count: `${current_plan_summary.recurring_series_count}`,
					})}</span
				>
			</div>
			<div class="chips">
				{#each current_plan_summary.top_recipe_names as recipe_name}
					<span>{recipe_name}</span>
				{/each}
			</div>
		</section>

		<section class="panel activity-panel">
			<h2>{m.profile_history_recent_activity()}</h2>
			<div class="activity-list">
				{#each current_plan_summary.recent_activity as activity}
					<article class="activity-item">
						<div>
							<h3>
								{m.profile_history_activity_meal({
									recipe: activity.recipe_name,
									date: activity.date,
								})}
							</h3>
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
		</section>
	</div>

	<section class="panel plan-list-panel">
		<h2>{m.profile_history_previous_plans()}</h2>
		<div class="plan-list">
			{#each previous_plans as plan}
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
