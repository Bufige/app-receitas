<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import magnify from "@iconify-icons/mdi/magnify";
	import Button from "$lib/components/ui/Button/index.svelte";
	import RecipeCard from "$lib/components/ui/RecipeCard/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import {
		createInfiniteRecipesQuery,
		createRecipeTagsQuery,
	} from "$lib/queries/recipes";
	import { backend_recipe_to_ui_recipe } from "$lib/utils/backend-adapters";
	import { intersect } from "$lib/utils/intersect";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";

	const RECIPES_PAGE_SIZE = 12;
	const RECIPE_TAGS_PAGE_SIZE = 100;
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

	const recipe_tags_query = createRecipeTagsQuery(
		{ limit: RECIPE_TAGS_PAGE_SIZE },
		{
			staleTime: 60_000,
		},
	);

	const available_recipe_tags = $derived.by(
		() => recipe_tags_query.data?.data ?? [],
	);

	const recipe_tag_by_id = $derived.by(
		() =>
			new Map(
				available_recipe_tags.map((recipe_tag) => [recipe_tag.id, recipe_tag]),
			),
	);

	const recipe_tag_id_by_name = $derived.by(
		() =>
			new Map(
				available_recipe_tags.map((recipe_tag) => [
					recipe_tag.name,
					recipe_tag.id,
				]),
			),
	);

	function normalize_tag_ids(tag_ids: string[]) {
		return [...new Set(tag_ids.map((tag_id) => tag_id.trim()).filter(Boolean))];
	}

	function parse_selected_tag_ids() {
		const tag_ids_from_query = normalize_tag_ids(
			(page.url.searchParams.get("tag_ids") ?? "").split(","),
		);

		if (tag_ids_from_query.length > 0 || !page.url.searchParams.has("tags")) {
			return tag_ids_from_query;
		}

		return normalize_tag_ids(
			(page.url.searchParams.get("tags") ?? "")
				.split(",")
				.map((tag_name) => recipe_tag_id_by_name.get(tag_name.trim()) ?? ""),
		);
	}

	const selected_tag_ids = $derived.by(() => parse_selected_tag_ids());

	const selected_tag_names = $derived.by(() =>
		selected_tag_ids.flatMap((tag_id) => {
			const recipe_tag = recipe_tag_by_id.get(tag_id);
			return recipe_tag ? [recipe_tag.name] : [];
		}),
	);

	const recipes_query = createInfiniteRecipesQuery(
		() => ({
			limit: RECIPES_PAGE_SIZE,
			query: debounced_search || undefined,
			tag_ids: selected_tag_ids.length > 0 ? selected_tag_ids : undefined,
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

	const all_tags = $derived.by(() => available_recipe_tags);

	function get_tag_filter_href(tag: string) {
		const next_url = new URL(page.url);
		const tag_id = recipe_tag_by_id.has(tag)
			? tag
			: recipe_tag_id_by_name.get(tag);

		if (!tag_id) {
			return `${next_url.pathname}${next_url.search}`;
		}

		const next_tag_ids = selected_tag_ids.includes(tag_id)
			? selected_tag_ids.filter((selected_tag_id) => selected_tag_id !== tag_id)
			: [...selected_tag_ids, tag_id];
		const normalized_next_tag_ids = normalize_tag_ids(next_tag_ids);

		next_url.searchParams.delete("tags");
		next_url.searchParams.delete("tag_ids");

		if (normalized_next_tag_ids.length > 0) {
			next_url.searchParams.set("tag_ids", normalized_next_tag_ids.join(","));
		}

		return `${next_url.pathname}${next_url.search}`;
	}

	const is_initial_loading = $derived.by(
		() => recipes_query.isPending && recipes.length === 0,
	);
	const has_error = $derived.by(
		() => Boolean(recipes_query.error) && recipes.length === 0,
	);
	const has_more_recipes = $derived.by(() =>
		Boolean(recipes_query.hasNextPage),
	);
	const has_active_filters = $derived.by(
		() => selected_tag_ids.length > 0 || search.trim().length > 0,
	);
	const recipes_total = $derived.by(
		() => recipes_query.data?.pages[0]?.meta?.total ?? recipes.length,
	);

	function get_tag_label(tag: string) {
		return get_recipe_tag_label(tag, m);
	}

	async function clear_filters() {
		search = "";
		debounced_search = "";

		const next_url = new URL(page.url);
		next_url.searchParams.delete("tags");
		next_url.searchParams.delete("tag_ids");

		await goto(`${next_url.pathname}${next_url.search}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true,
		});
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

		<div class="toolbar-meta">
			<p class="results-summary" role="status" aria-live="polite">
				{m.recipes_results_count({ count: `${recipes_total}` })}
			</p>

			{#if has_active_filters}
				<Button
					variant="outline"
					size="small"
					round
					onclick={() => {
						void clear_filters();
					}}
				>
					{m.recipes_clear_filters()}
				</Button>
			{/if}
		</div>

		{#if all_tags.length}
			<div class="filter-bar" aria-label={m.a11y_recipe_tag_filters()}>
				{#each all_tags as tag}
					<a
						href={get_tag_filter_href(tag.id)}
						class="tag-chip filter-chip"
						class:selected={selected_tag_ids.includes(tag.id)}
						aria-current={selected_tag_ids.includes(tag.id)
							? "true"
							: undefined}
					>
						<span>{get_recipe_tag_label(tag.name, m)}</span>
						<span class="tag-count">{tag.recipes_count}</span>
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
	{:else if recipes.length === 0}
		<p class="empty">{m.recipes_empty()}</p>
	{:else}
		<div class="grid">
			{#each recipes as recipe (recipe.id)}
				<RecipeCard
					{recipe}
					selectedTags={selected_tag_names}
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

	.toolbar-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;

		:global(.btn) {
			width: auto;
			min-width: 0;
		}
	}

	.results-summary {
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 0.5rem;
		align-items: center;
		align-content: flex-start;
	}

	.filter-chip {
		gap: 0.45rem;
	}

	.tag-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--primary) 10%, var(--surface));
		color: inherit;
		font-size: 0.75rem;
		line-height: 1;
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
