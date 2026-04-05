<script lang="ts">
	import type { Snippet } from "svelte";

	interface PageHeroProps {
		title: string;
		subtitle?: string;
		actions?: Snippet;
	}

	let { title, subtitle, actions }: PageHeroProps = $props();
</script>

<header class="page-hero" class:has-actions={Boolean(actions)}>
	<div class="copy">
		<h1>{title}</h1>
		{#if subtitle}
			<p>{subtitle}</p>
		{/if}
	</div>

	{#if actions}
		<div class="actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page-hero {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 18px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--surface) 97%, white),
			color-mix(in srgb, var(--secondary) 7%, white)
		);

		@include md {
			padding: 0.8rem 1rem;
		}

		&.has-actions {
			gap: 0.75rem;

			@include md {
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				gap: 1rem;
			}
		}
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;

		h1 {
			font-size: 1.2rem;
			line-height: 1.15;

			@include md {
				font-size: 1.35rem;
			}
		}

		p {
			color: var(--text-muted);
			font-size: 0.875rem;
			line-height: 1.4;
			max-width: 34rem;
		}
	}

	.actions {
		display: flex;
		width: 100%;

		@include md {
			width: auto;
			flex-shrink: 0;
		}

		:global(.btn) {
			width: 100%;

			@include md {
				width: auto;
				min-width: 11rem;
			}
		}
	}
</style>
