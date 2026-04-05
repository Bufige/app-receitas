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
		gap: 0.6rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 24px;
		background: radial-gradient(
				circle at top right,
				color-mix(in srgb, var(--secondary) 14%, transparent),
				transparent 28%
			),
			radial-gradient(
				circle at left center,
				color-mix(in srgb, var(--primary) 10%, transparent),
				transparent 26%
			),
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--surface) 97%, transparent),
				color-mix(in srgb, var(--surface-muted) 80%, var(--surface))
			);
		box-shadow: var(--soft-box-shadow);

		@include md {
			padding: 1.1rem 1.2rem;
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
		gap: 0.35rem;
		min-width: 0;

		h1 {
			font-size: 1.35rem;
			line-height: 1.05;
			letter-spacing: -0.02em;

			@include md {
				font-size: 1.7rem;
			}
		}

		p {
			color: var(--text-muted);
			font-size: 0.95rem;
			line-height: 1.4;
			max-width: 34rem;

			@include md {
				font-size: 1rem;
			}
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
