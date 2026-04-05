<script lang="ts">
	import { page } from "$app/state";
	import magnify from "@iconify-icons/mdi/magnify";
	import Button from "$lib/components/ui/Button/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import { mock_recipes } from "$lib/mocks/recipes";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";

	let search = $state("");

	function normalize_tags(tags: string[]) {
		return [...new Set(tags)]
			.filter((tag) =>
				mock_recipes.some((recipe) => (recipe.tags ?? []).includes(tag)),
			)
			.sort();
	}

	function parse_tags_param() {
		return normalize_tags(
			(page.url.searchParams.get("tags") ?? "")
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		);
	}

	const all_tags = $derived.by(() => {
		const unique_tags = new Set<string>();

		for (const recipe of mock_recipes) {
			for (const tag of recipe.tags ?? []) {
				unique_tags.add(tag);
			}
		}

		return [...unique_tags].sort((left, right) =>
			get_recipe_tag_label(left, m).localeCompare(
				get_recipe_tag_label(right, m),
			),
		);
	});

	const selected_tags = $derived.by(() => parse_tags_param());

	function get_tag_filter_href(tag: string) {
		const next_url = new URL(page.url);
		const next_tags = selected_tags.includes(tag)
			? selected_tags.filter((selected_tag) => selected_tag !== tag)
			: [...selected_tags, tag];
		const normalized_next_tags = normalize_tags(next_tags);

		next_url.searchParams.delete("tags");

		if (normalized_next_tags.length > 0) {
			next_url.searchParams.set("tags", normalized_next_tags.join(","));
		}

		return `${next_url.pathname}${next_url.search}`;
	}

	const filtered_recipes = $derived.by(() => {
		const normalized_query = search.trim().toLowerCase();

		return mock_recipes.filter((recipe) => {
			const haystack = [
				recipe.name,
				recipe.description ?? "",
				...(recipe.tags ?? []).flatMap((tag) => [
					tag,
					get_recipe_tag_label(tag, m),
				]),
			]
				.join(" ")
				.toLowerCase();

			const matches_search =
				normalized_query.length === 0 || haystack.includes(normalized_query);
			const matches_tags = selected_tags.every((tag) =>
				(recipe.tags ?? []).includes(tag),
			);

			return matches_search && matches_tags;
		});
	});
</script>

<SEO title={m.seo_recipes_title()} description={m.seo_recipes_description()} />

<section class="page">
	<PageHero title={m.recipes_title()} subtitle={m.recipes_subtitle()}>
		{#snippet actions()}
			<Button
				variant="primary"
				size="medium"
				round
				href={localizeHref("/planner")}
			>
				{m.nav_planner()}
			</Button>
		{/snippet}
	</PageHero>

	<div class="toolbar surface-panel">
		<div class="search">
			<Input
				id="recipe-search"
				label={m.recipes_search_label()}
				placeholder={m.recipes_search_placeholder()}
				icon={magnify}
				bind:value={search}
			/>
		</div>

		{#if all_tags.length}
			<div class="filter-bar" aria-label={m.recipes_search_label()}>
				{#each all_tags as tag}
					<a
						href={get_tag_filter_href(tag)}
						class="tag-chip filter-chip"
						class:selected={selected_tags.includes(tag)}
						aria-current={selected_tags.includes(tag) ? "true" : undefined}
					>
						{get_recipe_tag_label(tag, m)}
					</a>
				{/each}
			</div>
		{/if}
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
									<a
										href={get_tag_filter_href(tag)}
										class="tag-chip"
										class:selected={selected_tags.includes(tag)}
										aria-current={selected_tags.includes(tag)
											? "true"
											: undefined}
									>
										{get_recipe_tag_label(tag, m)}
									</a>
								{/each}
							</div>
						{/if}

						<div class="actions">
							<Button
								variant="outline"
								size="small"
								round
								href={localizeHref(`/recipes/${recipe.slug}`)}
							>
								{m.recipes_view_details()}
							</Button>
							<Button
								variant="primary"
								size="small"
								round
								href={localizeHref(`/planner?recipe=${recipe.id}`)}
							>
								{m.recipes_add_to_plan()}
							</Button>
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
		gap: 1rem;

		@include md {
			gap: 1.1rem;
		}
	}

	.toolbar {
		display: grid;
		gap: 0.9rem;
		padding: 0.9rem;
		background: radial-gradient(
				circle at top right,
				color-mix(in srgb, var(--secondary) 10%, transparent),
				transparent 28%
			),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--surface) 97%, transparent),
				color-mix(in srgb, var(--surface-muted) 68%, var(--surface))
			);

		@include md {
			gap: 1rem;
			padding: 1rem;
		}
	}

	.search {
		max-width: 30rem;
	}

	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 0.5rem;
		align-items: center;
		align-content: flex-start;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.25rem;
		}

		@include lg {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			align-items: start;
		}

		@include wide {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 97%, transparent);
		box-shadow: var(--soft-box-shadow);

		@include lg {
			border-radius: 18px;
		}
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

		@include lg {
			aspect-ratio: 16 / 8.5;
		}
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		flex: 1;

		@include lg {
			gap: 0.875rem;
			padding: 0.875rem;
		}
	}

	.card-top {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		h2 {
			font-size: 1.125rem;
			margin-bottom: 0.25rem;

			@include lg {
				font-size: 1rem;
				margin-bottom: 0.125rem;
			}
		}

		p {
			color: var(--text-muted);

			@include lg {
				font-size: 0.9375rem;
			}
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-muted);

		@include lg {
			gap: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 12%, var(--border));
		background-color: color-mix(in srgb, var(--surface) 92%, transparent);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
		-webkit-tap-highlight-color: transparent;

		&:hover {
			background-color: color-mix(in srgb, var(--primary) 8%, var(--surface));
			border-color: color-mix(in srgb, var(--primary) 20%, var(--border));
			color: var(--text);
		}

		&:active {
			transform: translateY(1px);
		}

		&:focus-visible {
			outline: none;
			border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
		}

		&.selected {
			background: linear-gradient(
				180deg,
				color-mix(in srgb, var(--primary) 18%, var(--surface)) 0%,
				color-mix(in srgb, var(--primary) 12%, var(--surface)) 100%
			);
			border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
			color: var(--primary);
			box-shadow: inset 0 1px 0
				color-mix(in srgb, var(--white) 42%, transparent);
		}

		@include lg {
			padding: 0.32rem 0.68rem;
			font-size: 0.75rem;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: auto;

		@include lg {
			gap: 0.625rem;
		}

		:global(.btn) {
			width: auto;
			min-width: 9.5rem;

			@include md {
				width: auto;
			}

			@include lg {
				min-width: 0;
				flex: 1 1 0;
				padding-inline: 0.8rem;
			}
		}
	}

	.empty {
		padding: 1rem;
		border: 1px dashed var(--border);
		border-radius: 16px;
		color: var(--text-muted);
	}
</style>
