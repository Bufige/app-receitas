<script lang="ts">
	import { page } from "$app/state";
	import magnify from "@iconify-icons/mdi/magnify";
	import Button from "$lib/components/ui/Button/index.svelte";
	import RecipeCard from "$lib/components/ui/RecipeCard/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { createInfiniteRecipesQuery } from "$lib/queries/recipes";
	import { backend_recipe_to_ui_recipe } from "$lib/utils/backend-adapters";
	import { intersect } from "$lib/utils/intersect";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";

	const RECIPES_PAGE_SIZE = 12;
	const SEARCH_DEBOUNCE_MS = 250;

	let search = $state("");
	let debounced_search = $state("");

	$effect(() => {
		const next_search = search.trim();
		const timeout = setTimeout(() => {
			debounced_search = next_search;
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timeout);
	});

	const recipes_query = createInfiniteRecipesQuery(
		() => ({
			limit: RECIPES_PAGE_SIZE,
			query: debounced_search || undefined,
		}),
		{
			staleTime: 60_000,
		},
	);

	const recipes = $derived.by(
		() =>
			recipes_query.data?.pages.flatMap((recipes_page) =>
				recipes_page.data.map((recipe) => backend_recipe_to_ui_recipe(recipe)),
			) ?? [],
	);

	function normalize_tags(tags: string[]) {
		return [...new Set(tags)]
			.filter((tag) =>
				recipes.some((recipe) => (recipe.tags ?? []).includes(tag)),
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

		for (const recipe of recipes) {
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

		return recipes.filter((recipe) => {
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

	const is_initial_loading = $derived.by(
		() => recipes_query.isPending && recipes.length === 0,
	);
	const has_error = $derived.by(
		() => Boolean(recipes_query.error) && recipes.length === 0,
	);
	const has_more_recipes = $derived.by(() =>
		Boolean(recipes_query.hasNextPage),
	);

	function get_tag_label(tag: string) {
		return get_recipe_tag_label(tag, m);
	}

	async function load_more_recipes() {
		if (!recipes_query.hasNextPage || recipes_query.isFetchingNextPage) {
			return;
		}

		await recipes_query.fetchNextPage();
	}
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

	{#if has_error}
		<p class="empty error-state">{m.recipes_error()}</p>
	{:else if is_initial_loading}
		<div class="loading-state" aria-busy="true">
			<p class="loading-copy">{m.recipes_loading()}</p>
			<div class="grid skeleton-grid" aria-hidden="true">
				{#each Array.from({ length: RECIPES_PAGE_SIZE }) as _, index}
					<div class="skeleton-card" data-index={index}></div>
				{/each}
			</div>
		</div>
	{:else if filtered_recipes.length === 0}
		<p class="empty">{m.recipes_empty()}</p>
	{:else}
		<div class="grid">
			{#each filtered_recipes as recipe (recipe.id)}
				<RecipeCard
					{recipe}
					selectedTags={selected_tags}
					getTagFilterHref={get_tag_filter_href}
					getTagLabel={get_tag_label}
					viewDetailsLabel={m.recipes_view_details()}
					addToPlanLabel={m.recipes_add_to_plan()}
					servingsLabel={m.recipes_servings()}
					prepTimeLabel={m.recipes_prep_time()}
					formatMinutes={(minutes) =>
						m.recipes_minutes({ count: `${minutes}` })}
				/>
			{/each}
		</div>

		{#if recipes_query.error && recipes.length > 0}
			<p class="load-feedback error-state">{m.recipes_error()}</p>
		{/if}

		{#if has_more_recipes || recipes_query.isFetchingNextPage}
			<div class="load-more">
				<div
					class="load-trigger"
					aria-hidden="true"
					use:intersect={{
						enabled: has_more_recipes && !recipes_query.isFetchingNextPage,
						rootMargin: "500px 0px",
						onIntersect: () => {
							void load_more_recipes();
						},
					}}
				></div>

				{#if has_more_recipes}
					<Button
						variant="outline"
						size="medium"
						round
						loading={recipes_query.isFetchingNextPage}
						onclick={() => {
							void load_more_recipes();
						}}
					>
						{m.recipes_load_more()}
					</Button>
				{/if}

				<p class="load-feedback">
					{recipes_query.isFetchingNextPage
						? m.recipes_loading_more()
						: m.recipes_end_of_list()}
				</p>
			</div>
		{:else}
			<p class="load-feedback">{m.recipes_end_of_list()}</p>
		{/if}
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

	.loading-state {
		display: grid;
		gap: 1rem;
	}

	.loading-copy,
	.load-feedback {
		color: var(--text-muted);
		text-align: center;
	}

	.skeleton-grid {
		pointer-events: none;
	}

	.skeleton-card {
		min-height: 23rem;
		border-radius: 20px;
		border: 1px solid color-mix(in srgb, var(--primary) 8%, var(--border));
		background: linear-gradient(
			110deg,
			color-mix(in srgb, var(--surface-muted) 82%, var(--surface)) 8%,
			color-mix(in srgb, var(--surface) 98%, transparent) 18%,
			color-mix(in srgb, var(--surface-muted) 82%, var(--surface)) 33%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s linear infinite;
	}

	.load-more {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		padding-top: 0.25rem;

		:global(.btn) {
			max-width: 20rem;
		}
	}

	.load-trigger {
		width: 100%;
		height: 1px;
	}

	.error-state {
		color: var(--error);
		border-color: color-mix(in srgb, var(--error) 30%, var(--border));
		background-color: color-mix(in srgb, var(--error) 6%, var(--surface));
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-card {
			animation: none;
		}
	}

	@keyframes shimmer {
		from {
			background-position: 200% 0;
		}

		to {
			background-position: -200% 0;
		}
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

	.empty {
		padding: 1rem;
		border: 1px dashed var(--border);
		border-radius: 16px;
		color: var(--text-muted);
	}
</style>
