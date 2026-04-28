<script lang="ts">
	import Button from "$lib/components/ui/Button/index.svelte";
	import { localizeHref } from "$lib/paraglide/runtime";
	import type { Recipe } from "$lib/types/recipe";

	interface RecipeCardProps {
		recipe: Recipe;
		selectedTags?: string[];
		getTagFilterHref: (tag: string) => string;
		getTagLabel: (tag: string) => string;
		viewDetailsLabel: string;
		addToPlanLabel: string;
		servingsLabel: string;
		prepTimeLabel: string;
		formatMinutes: (minutes: number) => string;
	}

	let {
		recipe,
		selectedTags = [],
		getTagFilterHref,
		getTagLabel,
		viewDetailsLabel,
		addToPlanLabel,
		servingsLabel,
		prepTimeLabel,
		formatMinutes,
	}: RecipeCardProps = $props();
</script>

<article class="card">
	{#if recipe.image_url}
		<img
			class="image"
			src={recipe.image_url}
			alt={recipe.name}
			loading="lazy"
			decoding="async"
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
			<span>{servingsLabel}: {recipe.servings}</span>
			<span
				>{prepTimeLabel}: {formatMinutes(
					recipe.preparation_time_in_minutes,
				)}</span
			>
		</div>

		{#if recipe.tags?.length}
			<div class="tags">
				{#each recipe.tags as tag}
					<a
						href={getTagFilterHref(tag)}
						class="tag-chip"
						class:selected={selectedTags.includes(tag)}
						aria-current={selectedTags.includes(tag) ? "true" : undefined}
					>
						{getTagLabel(tag)}
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
				{viewDetailsLabel}
			</Button>
			<Button
				variant="primary"
				size="small"
				round
				href={localizeHref(`/planner?recipe=${recipe.id}`)}
			>
				{addToPlanLabel}
			</Button>
		</div>
	</div>
</article>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 97%, transparent);
		box-shadow: var(--soft-box-shadow);
		content-visibility: auto;
		contain: layout style paint;
		contain-intrinsic-size: 29rem;

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
</style>
