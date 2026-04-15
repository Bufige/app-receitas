<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { mock_recipes } from "$lib/mocks/recipes";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type { MealType } from "$lib/types/planning";
	import type { BrazilRegion, Recipe } from "$lib/types/recipe";

	const meal_plan_store = useMealPlanStore();
	const generation_meal_types: MealType[] = [
		"lunch",
		"dinner",
		"lunch",
		"dinner",
		"dinner",
	];
	const brazil_region_by_timezone: Record<string, BrazilRegion> = {
		"America/Rio_Branco": "north",
		"America/Manaus": "north",
		"America/Porto_Velho": "north",
		"America/Boa_Vista": "north",
		"America/Belem": "north",
		"America/Araguaina": "north",
		"America/Fortaleza": "northeast",
		"America/Recife": "northeast",
		"America/Maceio": "northeast",
		"America/Bahia": "northeast",
		"America/Cuiaba": "midwest",
		"America/Campo_Grande": "midwest",
		"America/Brasilia": "midwest",
		"America/Sao_Paulo": "southeast",
		"America/Rio_de_Janeiro": "southeast",
		"America/Vitoria": "southeast",
		"America/Curitiba": "south",
	};

	let is_generating = $state(false);

	function inferRecipeLocation(): { country: string; region?: BrazilRegion } {
		if (!browser) {
			return { country: "Brazil" };
		}

		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		return {
			country: "Brazil",
			region: brazil_region_by_timezone[timezone],
		};
	}

	function shuffleRecipes(recipes: Recipe[]): Recipe[] {
		const shuffled_recipes = [...recipes];

		for (let index = shuffled_recipes.length - 1; index > 0; index -= 1) {
			const random_index = Math.floor(Math.random() * (index + 1));
			const current_recipe = shuffled_recipes[index];
			shuffled_recipes[index] = shuffled_recipes[random_index];
			shuffled_recipes[random_index] = current_recipe;
		}

		return shuffled_recipes;
	}

	function buildRecipePool(): Recipe[] {
		const location = inferRecipeLocation();
		const region_matches = mock_recipes.filter(
			(recipe) =>
				recipe.country === location.country &&
				location.region !== undefined &&
				recipe.region === location.region,
		);
		const country_generic = mock_recipes.filter(
			(recipe) =>
				recipe.country === location.country && recipe.region === undefined,
		);
		const country_fallback = mock_recipes.filter(
			(recipe) =>
				recipe.country === location.country &&
				!region_matches.some((candidate) => candidate.id === recipe.id) &&
				!country_generic.some((candidate) => candidate.id === recipe.id),
		);

		return shuffleRecipes([
			...region_matches,
			...country_generic,
			...country_fallback,
		]);
	}

	function collectPlanDates(start_date?: string, end_date?: string): string[] {
		if (!start_date || !end_date) {
			return [];
		}

		const dates: string[] = [];
		const current_date = new Date(`${start_date}T12:00:00`);
		const last_date = new Date(`${end_date}T12:00:00`);

		while (
			current_date <= last_date &&
			dates.length < generation_meal_types.length
		) {
			dates.push(current_date.toISOString().slice(0, 10));
			current_date.setDate(current_date.getDate() + 1);
		}

		return dates;
	}

	async function generateWeeklyRecipes() {
		if (is_generating) {
			return;
		}

		is_generating = true;

		try {
			meal_plan_store.createPlan();

			const recipe_pool = buildRecipePool().slice(
				0,
				generation_meal_types.length,
			);
			const plan_dates = collectPlanDates(
				meal_plan_store.mealPlan.start_date,
				meal_plan_store.mealPlan.end_date,
			);

			for (const [index, recipe] of recipe_pool.entries()) {
				const plan_date = plan_dates[index];

				if (!plan_date) {
					break;
				}

				meal_plan_store.addEntry({
					recipe_id: recipe.id,
					date: plan_date,
					meal_type: generation_meal_types[index] ?? "dinner",
				});
			}

			await goto(localizeHref("/planner"));
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
