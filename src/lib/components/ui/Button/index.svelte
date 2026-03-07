<script lang="ts">
	import Icon from "@iconify/svelte";
	import type { Snippet } from "svelte";

	export type ButtonVariant = "default" | "primary" | "secondary" | "danger";
	export type ButtonSize = "small" | "medium" | "large";

	interface ButtonProps {
		variant?: ButtonVariant;
		size?: ButtonSize;
		loading?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		children?: Snippet;
	}

	let {
		variant = "default",
		size = "medium",
		loading = false,
		disabled = false,
		onclick,
		children,
	}: ButtonProps = $props();
</script>

<button class="btn {variant} {size}" disabled={disabled || loading} {onclick}>
	{#if loading}
		<span class="spinner">
			<Icon icon="svg-spinners:ring-resize" width="1em" height="1em" />
		</span>
	{/if}
	<span class="content" class:hidden={loading}>
		{#if children}
			{@render children()}
		{/if}
	</span>
</button>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		gap: 0.5em;
		width: 100%;
		border: 1px solid transparent;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s,
			opacity 0.2s;
		white-space: nowrap;

		@include md {
			width: auto;
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	// Sizes
	.small {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		min-height: 2rem;
	}

	.medium {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		min-height: 2.5rem;
	}

	.large {
		padding: 0.75rem 1.25rem;
		font-size: 1.125rem;
		min-height: 3rem;
	}

	// Variants
	.default {
		background-color: var(--surface);
		border-color: var(--border);

		&:hover:not(:disabled) {
			background-color: var(--bg);
		}
	}

	.primary {
		background-color: var(--primary);
		color: var(--surface);

		&:hover:not(:disabled) {
			background-color: var(--primary-hover);
		}
	}

	.secondary {
		background-color: var(--secondary);
		color: var(--surface);

		&:hover:not(:disabled) {
			background-color: var(--secondary-hover);
		}
	}

	.danger {
		background-color: var(--error);
		color: var(--surface);

		&:hover:not(:disabled) {
			background-color: var(--error-hover);
		}
	}

	.spinner {
		display: inline-flex;
		align-items: center;
		position: absolute;
	}

	.content {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		transition: opacity 0.2s;
	}

	.hidden {
		opacity: 0;
	}
</style>
