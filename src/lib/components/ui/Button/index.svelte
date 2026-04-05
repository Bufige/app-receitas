<script lang="ts">
	import Icon from "@iconify/svelte";
	import type { Snippet } from "svelte";

	export type ButtonVariant =
		| "default"
		| "primary"
		| "secondary"
		| "danger"
		| "outline";
	export type ButtonSize = "small" | "medium" | "large";

	interface ButtonProps {
		variant?: ButtonVariant;
		size?: ButtonSize;
		round?: boolean;
		loading?: boolean;
		disabled?: boolean;
		href?: string;
		class?: string;
		onclick?: () => void;
		children?: Snippet;
	}

	let {
		variant = "default",
		size = "medium",
		round = false,
		loading = false,
		disabled = false,
		href,
		class: className = "",
		onclick,
		children,
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		class={`btn ${variant} ${size} ${className}`}
		class:round
		{href}
		aria-disabled={disabled || loading}
	>
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
	</a>
{:else}
	<button
		class={`btn ${variant} ${size} ${className}`}
		class:round
		disabled={disabled || loading}
		{onclick}
	>
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
{/if}

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
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform var(--motion-base) var(--ease-standard),
			background-color var(--motion-base) var(--ease-standard),
			border-color var(--motion-base) var(--ease-standard),
			box-shadow var(--motion-slow) var(--ease-standard),
			opacity var(--motion-base) var(--ease-standard),
			color var(--motion-base) var(--ease-standard);
		white-space: nowrap;
		box-shadow: 0 0 0 transparent;
		text-decoration: none;

		@include md {
			width: 320px;
		}

		&:hover:not(:disabled) {
			transform: translateY(-2px);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
		}

		&:disabled {
			cursor: not-allowed;
			filter: grayscale(0.5) brightness(0.85);
		}

		&.round {
			border-radius: 999px;
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
		box-shadow: var(--soft-box-shadow);

		&:hover:not(:disabled) {
			background-color: var(--surface-muted);
			box-shadow: var(--card-shadow-hover);
		}
	}

	.primary {
		background-color: var(--primary);
		color: var(--surface);
		box-shadow: var(--box-shadow);

		&:hover:not(:disabled) {
			background-color: var(--primary-hover);
			box-shadow: var(--high-box-shadow);
		}
	}

	.secondary {
		background-color: var(--secondary);
		color: var(--text);
		box-shadow: var(--soft-box-shadow);

		&:hover:not(:disabled) {
			background-color: var(--secondary-hover);
			box-shadow: var(--box-shadow);
		}
	}

	.danger {
		background-color: var(--error);
		color: var(--surface);
		box-shadow: var(--box-shadow);

		&:hover:not(:disabled) {
			background-color: var(--error-hover);
			box-shadow: var(--high-box-shadow);
		}
	}

	.outline {
		background-color: color-mix(in srgb, var(--surface) 96%, transparent);
		border-color: var(--primary);
		color: var(--primary);
		font-weight: 600;
		font-size: 0.875rem;

		&:hover:not(:disabled) {
			background-color: color-mix(in srgb, var(--primary) 10%, var(--surface));
			box-shadow: var(--soft-box-shadow);
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
		transition: opacity var(--motion-base) var(--ease-standard);
	}

	.hidden {
		opacity: 0;
	}
</style>
