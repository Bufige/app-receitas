<script lang="ts">
	import Icon from "@iconify/svelte";
	import calendarMonthOutline from "@iconify-icons/mdi/calendar-month-outline";
	import repeatVariant from "@iconify-icons/mdi/repeat-variant";
	import silverwareForkKnife from "@iconify-icons/mdi/silverware-fork-knife";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type { ExpandedMealPlanEntry, MealType } from "$lib/types/planning";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { expand_meal_plan_entries } from "$lib/utils/planning";

	const meal_plan_store = useMealPlanStore();
	const meal_types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

	const expanded_entries = $derived.by(() =>
		expand_meal_plan_entries(
			meal_plan_store.mealPlan.entries,
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
		),
	);
	const range_label = $derived.by(() => {
		const { start_date, end_date } = meal_plan_store.mealPlan;
		if (!start_date && !end_date) {
			return "—";
		}

		if (!start_date || !end_date || start_date === end_date) {
			return start_date ?? end_date ?? "—";
		}

		return `${start_date} → ${end_date}`;
	});
	const recurring_entries = $derived.by(
		() =>
			expanded_entries.filter((entry) => Boolean(entry.recurrence_rule)).length,
	);
	const days = $derived.by(() => {
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

		return [...grouped.entries()].map(([date, slots]) => ({ date, slots }));
	});

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
	title={m.seo_planned_meals_title()}
	description={m.seo_planned_meals_description()}
/>

<section class="page">
	<PageHero
		title={m.planned_meals_title()}
		subtitle={m.planned_meals_subtitle()}
	>
		{#snippet actions()}
			<div class="hero-actions">
				<Button
					href={localizeHref("/planner")}
					variant="primary"
					size="medium"
					round
				>
					{m.planned_meals_open_planner()}
				</Button>
			</div>
		{/snippet}
	</PageHero>

	<div class="stats-grid">
		<article class="stat-card surface-panel">
			<div class="stat-icon">
				<Icon icon={calendarMonthOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_period()}</p>
				<strong>{range_label}</strong>
			</div>
		</article>
		<article class="stat-card surface-panel">
			<div class="stat-icon">
				<Icon icon={silverwareForkKnife} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_occurrences()}</p>
				<strong>{expanded_entries.length}</strong>
			</div>
		</article>
		<article class="stat-card surface-panel">
			<div class="stat-icon">
				<Icon icon={repeatVariant} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_recurring()}</p>
				<strong>{recurring_entries}</strong>
			</div>
		</article>
	</div>

	{#if days.length === 0}
		<section class="empty-state surface-panel">
			<p>{m.planned_meals_empty()}</p>
			<Button
				href={localizeHref("/planner")}
				variant="outline"
				size="medium"
				round
			>
				{m.planned_meals_open_planner()}
			</Button>
		</section>
	{:else}
		<section class="calendar-grid">
			{#each days as day}
				<article class="day-card surface-panel">
					<header class="day-header">
						<h2>{day.date}</h2>
					</header>
					<div class="day-slots">
						{#each meal_types as meal_type}
							<section class="meal-slot">
								<div class="slot-heading">
									<h3>{get_meal_type_label(meal_type)}</h3>
								</div>
								<div class="slot-items">
									{#if day.slots[meal_type].length === 0}
										<p class="slot-empty">{m.planned_meals_day_empty()}</p>
									{:else}
										{#each day.slots[meal_type] as entry}
											<a
												class="meal-card"
												href={localizeHref(
													`/recipes/${get_recipe_slug(entry.recipe_id) ?? ""}`,
												)}
											>
												<div class="meal-copy">
													<strong>{get_recipe_name(entry.recipe_id)}</strong>
													<p>{entry.servings}</p>
												</div>
												{#if entry.recurrence_rule}
													<span class="badge"
														>{m.planned_meals_recurring_badge()}</span
													>
												{/if}
											</a>
										{/each}
									{/if}
								</div>
							</section>
						{/each}
					</div>
				</article>
			{/each}
		</section>
	{/if}
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: grid;
		gap: 1rem;
	}

	.hero-actions {
		display: flex;
		justify-content: flex-start;
	}

	.stats-grid {
		display: grid;
		gap: 0.85rem;
		grid-template-columns: 1fr;

		@include md {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.stat-card {
		display: flex;
		gap: 0.9rem;
		align-items: center;
		padding: 1rem;

		p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		strong {
			display: block;
			margin-top: 0.15rem;
		}
	}

	.stat-icon {
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

	.empty-state {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		justify-items: start;
	}

	.calendar-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;

		@include lg {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.day-card {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 24px;
	}

	.day-header {
		display: flex;
		justify-content: space-between;
		align-items: center;

		h2 {
			font-size: 1.1rem;
		}
	}

	.day-slots {
		display: grid;
		gap: 0.8rem;
	}

	.meal-slot {
		display: grid;
		gap: 0.55rem;
		padding-top: 0.2rem;
	}

	.slot-heading h3 {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.slot-items {
		display: grid;
		gap: 0.55rem;
	}

	.slot-empty {
		color: var(--text-muted);
		font-size: 0.92rem;
	}

	.meal-card {
		display: flex;
		justify-content: space-between;
		gap: 0.9rem;
		align-items: center;
		padding: 0.85rem 0.95rem;
		border-radius: 18px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 95%, transparent);
		color: var(--text);
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			box-shadow var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover,
		&:focus-visible {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
			box-shadow: var(--card-shadow-hover);
		}
	}

	.meal-copy {
		display: grid;
		gap: 0.2rem;

		strong {
			font-size: 0.97rem;
		}

		p {
			color: var(--text-muted);
			font-size: 0.86rem;
		}
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent-berry) 12%, var(--surface));
		color: var(--accent-berry);
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
	}
</style>
