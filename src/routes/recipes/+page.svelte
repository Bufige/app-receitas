<script lang="ts">
	import magnify from "@iconify-icons/mdi/magnify";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import { mock_recipes } from "$lib/mocks/recipes";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	let search = $state("");

	const filtered_recipes = $derived.by(() => {
		const normalized_query = search.trim().toLowerCase();

		if (!normalized_query) {
			return mock_recipes;
		}

		return mock_recipes.filter((recipe) => {
			const haystack = [
				recipe.name,
				recipe.description ?? "",
				...(recipe.tags ?? []),
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(normalized_query);
		});
	});
</script>

<SEO title={m.seo_recipes_title()} description={m.seo_recipes_description()} />

<section class="page">
	<header class="hero">
		<h1>{m.recipes_title()}</h1>
		<p>{m.recipes_subtitle()}</p>
	</header>

	<div class="search">
		<Input
			id="recipe-search"
			label={m.recipes_search_label()}
			placeholder={m.recipes_search_placeholder()}
			icon={magnify}
			bind:value={search}
		/>
	</div>

	{#if filtered_recipes.length === 0}
		<p class="empty">{m.recipes_empty()}</p>
	{:else}
		<div class="grid">
			{#each filtered_recipes as recipe}
				<article class="card">
					{#if recipe.image_url}
						<img
							class="image"
							src={recipe.image_url}
							alt={recipe.name}
							loading="lazy"
						/>
					{/if}

					<div class="card-body">
						<div class="card-top">
							<h2>{recipe.name}</h2>
							{#if recipe.description}
								<p>{recipe.description}</p>
							{/if}
						</div>

						<div class="meta">
							<span>{m.recipes_servings()}: {recipe.servings}</span>
							<span>
								{m.recipes_prep_time()}: {m.recipes_minutes({
									count: `${recipe.preparation_time_in_minutes}`,
								})}
							</span>
						</div>

						{#if recipe.tags?.length}
							<div class="tags">
								{#each recipe.tags as tag}
									<span>{tag}</span>
								{/each}
							</div>
						{/if}

						<div class="actions">
							<a href={localizeHref(`/recipes/${recipe.slug}`)}>
								{m.recipes_view_details()}
							</a>
							<a href={localizeHref(`/planner?recipe=${recipe.id}`)}>
								{m.recipes_add_to_plan()}
							</a>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 24px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--surface) 94%, white),
			color-mix(in srgb, var(--secondary) 12%, white)
		);
		box-shadow: var(--soft-box-shadow);

		h1 {
			font-size: 1.75rem;
		}

		p {
			color: var(--text-muted);
		}
	}

	.search {
		max-width: 30rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 97%, transparent);
		box-shadow: var(--soft-box-shadow);
	}

	.image {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--secondary) 18%, transparent),
			color-mix(in srgb, var(--primary) 14%, transparent)
		);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.card-top {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		h2 {
			font-size: 1.125rem;
			margin-bottom: 0.25rem;
		}

		p {
			color: var(--text-muted);
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;

		span {
			padding: 0.25rem 0.625rem;
			border-radius: 999px;
			background-color: color-mix(in srgb, var(--primary) 14%, transparent);
			font-size: 0.8125rem;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;

		a {
			font-weight: 600;
			color: var(--primary);
		}
	}

	.empty {
		padding: 1rem;
		border: 1px dashed var(--border);
		border-radius: 16px;
		color: var(--text-muted);
	}
</style>
