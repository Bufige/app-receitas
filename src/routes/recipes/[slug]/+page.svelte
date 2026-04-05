<script lang="ts">
	import { page } from "$app/state";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { get_recipe_by_slug } from "$lib/mocks/recipes";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";

	const recipe = $derived(
		page.params.slug ? get_recipe_by_slug(page.params.slug) : undefined,
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

		<PageHero title={recipe.name} subtitle={recipe.description}>
			{#snippet actions()}
				<Button
					class="planner-link"
					variant="primary"
					size="medium"
					round
					href={localizeHref(`/planner?recipe=${recipe.id}`)}
				>
					{m.recipe_detail_add_to_plan()}
				</Button>
			{/snippet}
		</PageHero>

		<div class="overview" class:without-image={!recipe.image_url}>
			{#if recipe.image_url}
				<img class="image" src={recipe.image_url} alt={recipe.name} />
			{/if}

			<div class="summary-panel">
				<div class="meta">
					<span>{m.recipes_servings()}: {recipe.servings}</span>
					<span
						>{m.recipes_prep_time()}: {m.recipes_minutes({
							count: `${recipe.preparation_time_in_minutes}`,
						})}</span
					>
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
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include lg {
			grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.8fr);
			align-items: start;
		}

		&.without-image {
			grid-template-columns: 1fr;
		}
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
		gap: 1rem;
		padding: 1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);

		@include lg {
			min-height: 100%;
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
