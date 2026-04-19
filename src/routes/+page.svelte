<script lang="ts">
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { recipesApi } from "$lib/api/recipes";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import { backend_recipe_to_ui_recipe } from "$lib/utils/backend-adapters";
	import type { MealType } from "$lib/types/planning";
	import { collect_plan_dates } from "$lib/utils/recipe-generation";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();
	const weekly_meal_types: MealType[] = ["lunch", "dinner"];
	const weekly_day_count = 7;
	const default_generated_servings = 2;

	let is_generating = $state(false);

	async function generateWeeklyRecipes() {
		if (is_generating) {
			return;
		}

		is_generating = true;

		try {
			await meal_plan_store.ensureReady();
			meal_plan_store.setPlanningPreset("this_week");
			const default_home_household =
				household_store.profiles.find((profile) => profile.kind === "home") ??
				household_store.profile;

			household_store.selectHousehold(default_home_household.id);
			household_store.update(
				{ default_servings: default_generated_servings },
				default_home_household.id,
			);
			const requested_recipe_amount =
				weekly_day_count * weekly_meal_types.length;
			const random_recipes_response = await recipesApi.random({
				amount: requested_recipe_amount,
			});
			const random_recipes = random_recipes_response.data.map((recipe) =>
				backend_recipe_to_ui_recipe(recipe),
			);

			const plan_dates = collect_plan_dates(
				meal_plan_store.mealPlan.start_date,
				meal_plan_store.mealPlan.end_date,
				weekly_day_count,
			);

			if (random_recipes.length === 0) {
				await goto(localizeHref("/planner/calendar"));
				return;
			}

			meal_plan_store.mergeRecipes(random_recipes);

			let recipe_index = 0;
			const generated_entries = [];

			for (const plan_date of plan_dates) {
				for (const meal_type of weekly_meal_types) {
					const recipe = random_recipes[recipe_index % random_recipes.length];

					if (!recipe) {
						continue;
					}

					generated_entries.push({
						id: crypto.randomUUID(),
						recipe_id: recipe.id,
						date: plan_date,
						meal_type,
						servings: default_generated_servings,
					});
					recipe_index += 1;
				}
			}

			meal_plan_store.replaceEntries(generated_entries);

			await goto(localizeHref("/planner/calendar"));
		} finally {
			is_generating = false;
		}
	}
</script>

<SEO title={m.seo_home_title()} description={m.seo_home_description()} />

<section class="hero">
	<div class="content surface-panel">
		<div class="hero-body">
			<h1 class="title">
				<span>{m.home_content_title()}</span>
				<span class="highlight">{m.home_content_title_highlight()}</span>
				<span>{m.home_content_title_suffix()}</span>
			</h1>

			<p class="description">{m.home_content_description()}</p>
		</div>

		<div class="hero-cta">
			<Button
				variant="primary"
				size="large"
				round={true}
				loading={is_generating}
				onclick={generateWeeklyRecipes}
			>
				{m.home_cta()}
			</Button>
		</div>
	</div>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.hero {
		padding: 1rem;

		@include md {
			padding: 1.5rem;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		justify-content: stretch;
		gap: 1.25rem;
		width: 100%;
		padding: 1.5rem;
		border-radius: 28px;
		min-height: min(72vh, 42rem);
		border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
		background: linear-gradient(
				180deg,
				color-mix(in srgb, var(--surface) 96%, transparent),
				color-mix(in srgb, var(--surface-muted) 92%, var(--surface))
			),
			var(--surface);
		box-shadow: var(--soft-box-shadow);

		@include md {
			align-items: center;
			padding: 2.5rem;
			gap: 1.5rem;
			min-height: min(78vh, 48rem);
		}
	}

	.hero-body {
		flex: 1 1 80%;
		display: grid;
		align-content: center;
		gap: 1rem;
		width: 100%;

		@include md {
			width: min(100%, 48rem);
			min-height: 0;
			align-self: center;
			justify-items: center;
			margin-inline: auto;
			gap: 1.25rem;
		}
	}

	.title {
		display: grid;
		gap: 0.2rem;
		max-width: 14ch;
		font-size: clamp(2.4rem, 9vw, 5rem);
		font-weight: 800;
		line-height: 0.96;
		letter-spacing: -0.05em;

		@include md {
			max-width: 16ch;
			text-align: center;
		}
	}

	.highlight {
		color: var(--primary);
	}

	.description {
		max-width: 38rem;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--text-muted);

		@include md {
			max-width: 44rem;
			font-size: 1.1875rem;
			text-align: center;
		}
	}

	.hero-cta {
		flex: 0 0 20%;
		display: flex;
		align-items: flex-end;
		width: 100%;

		:global(.btn) {
			width: 100%;
			min-height: 3.5rem;
			padding: 0.85rem 1.1rem;
			font-size: 0.95rem;
		}

		@include md {
			width: min(100%, 26rem);
			justify-content: center;
			margin-inline: auto;

			:global(.btn) {
				width: 100%;
				min-height: 4rem;
				padding: 1rem 1.5rem;
				font-size: 1.125rem;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.content,
		.title,
		.description,
		.hero-cta {
			animation: none;
			transition: none;
		}
	}
</style>
