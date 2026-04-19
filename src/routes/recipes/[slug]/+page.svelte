<script lang="ts">
	import { page } from "$app/state";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";

	const meal_plan_store = useMealPlanStore();
	const recipe = $derived(
		meal_plan_store.recipes.find(
			(candidate) => candidate.slug === page.params.slug,
		),
	);
</script>

{#if recipe}
	<SEO
		title={`${m.seo_recipe_detail_title()} — ${recipe.name}`}
		description={recipe.description ?? m.seo_recipe_detail_description()}
	/>

	<section class="page">
		<a class="back-link" href={localizeHref("/recipes")}
			>{m.recipe_detail_back()}</a
		>

		<PageHero title={recipe.name} subtitle={recipe.description} />

		<div class="overview">
			{#if recipe.image_url}
				<img class="image" src={recipe.image_url} alt={recipe.name} />
			{/if}

			<div class="summary-panel">
				<div class="meta">
					<div class="meta-card">
						<small>{m.recipes_servings()}</small>
						<strong>{recipe.servings}</strong>
					</div>
					<div class="meta-card">
						<small>{m.recipes_prep_time()}</small>
						<strong
							>{m.recipes_minutes({
								count: `${recipe.preparation_time_in_minutes}`,
							})}</strong
						>
					</div>
				</div>

				{#if recipe.tags?.length}
					<div class="tags">
						{#each recipe.tags as tag}
							<span>{get_recipe_tag_label(tag, m)}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="content-grid">
			<section class="panel">
				<h2>{m.recipe_detail_ingredients()}</h2>
				<ul>
					{#each recipe.ingredients as ingredient}
						<li>
							<span>{ingredient.name}</span>
							<strong>{ingredient.quantity} {ingredient.unit}</strong>
						</li>
					{/each}
				</ul>
			</section>

			<section class="panel">
				<h2>{m.recipe_detail_instructions()}</h2>
				<ol>
					{#each recipe.instructions as instruction}
						<li>{instruction.description}</li>
					{/each}
				</ol>
			</section>
		</div>

		<Button
			class="floating-cta"
			variant="primary"
			size="medium"
			round
			href={localizeHref(`/planner?recipe=${recipe.id}`)}
		>
			{m.recipe_detail_add_to_plan()}
		</Button>
	</section>
{:else}
	<SEO
		title={m.seo_recipe_detail_title()}
		description={m.recipe_detail_not_found_description()}
		noindex
	/>

	<section class="empty-state">
		<h1>{m.recipe_detail_not_found()}</h1>
		<p>{m.recipe_detail_not_found_description()}</p>
		<a href={localizeHref("/recipes")}>{m.recipe_detail_back_to_list()}</a>
	</section>
{/if}

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page,
	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.page {
		padding-bottom: 6rem;

		@include md {
			padding-bottom: 7rem;
		}
	}

	.back-link,
	.empty-state a {
		color: var(--primary);
		font-weight: 600;
	}

	.meta,
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.meta {
		color: var(--text-muted);
	}

	.tags span {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 12%, var(--border));
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--primary) 10%, var(--surface)) 0%,
			color-mix(in srgb, var(--primary) 6%, var(--surface)) 100%
		);
		color: var(--primary);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.image {
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 20px;
		border: 1px solid var(--border);
		box-shadow: var(--soft-box-shadow);

		@include lg {
			aspect-ratio: 16 / 7.25;
			max-height: 26rem;
		}
	}

	.summary-panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding: 0.9rem 1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);

		@include lg {
			padding: 0.85rem 1rem;
		}
	}

	.meta {
		gap: 0.75rem;
	}

	.meta-card {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.7rem 0.85rem;
		min-width: 8.5rem;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--primary) 8%, var(--border));
		background-color: color-mix(in srgb, var(--surface) 98%, transparent);

		small {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
		}

		strong {
			font-size: 1rem;
			color: var(--text);
		}
	}

	:global(.btn.floating-cta) {
		position: fixed;
		left: auto;
		right: 1rem;
		bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px));
		width: fit-content;
		max-width: calc(100vw - 2rem);
		min-width: 0;
		padding-inline: 1rem;
		margin: 0;
		display: inline-flex;
		justify-content: center;
		box-shadow: var(--high-box-shadow);
		z-index: 120;

		@include md {
			right: 1.5rem;
			bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
			width: fit-content;
			max-width: none;
			min-width: 12rem;
		}
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.panel {
		padding: 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);

		h2 {
			margin-bottom: 1rem;
		}

		ul,
		ol {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			padding-left: 1.25rem;
		}

		ul li {
			display: flex;
			justify-content: space-between;
			gap: 1rem;
		}
	}

	.empty-state {
		padding: 2rem 0;

		p {
			color: var(--text-muted);
		}
	}
</style>
