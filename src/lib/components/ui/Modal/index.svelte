<script lang="ts">
	import type { Snippet } from "svelte";

	interface ModalProps {
		open?: boolean;
		title: string;
		description?: string;
		titleId?: string;
		descriptionId?: string;
		class?: string;
		children?: Snippet;
		actions?: Snippet;
	}

	let {
		open = false,
		title,
		description = "",
		titleId = "modal-title",
		descriptionId = "modal-description",
		class: className = "",
		children,
		actions,
	}: ModalProps = $props();
</script>

{#if open}
	<div class="backdrop">
		<div
			class={`card ${className}`}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
		>
			<h2 id={titleId}>{title}</h2>
			{#if description}
				<p id={descriptionId}>{description}</p>
			{/if}
			{#if children}
				<div class="content">
					{@render children()}
				</div>
			{/if}
			{#if actions}
				<div class="actions">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.backdrop {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		background-color: color-mix(in srgb, var(--black) 58%, transparent);
		z-index: 20;
	}

	.card {
		width: min(100%, 38rem);
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: var(--surface);
		box-shadow: var(--high-box-shadow);

		p {
			color: var(--text-muted);
		}

		@include md {
			padding: 1.5rem;
			gap: 1.25rem;
		}
	}

	.content {
		display: grid;
		gap: 1rem;
	}

	.actions {
		display: flex;
		flex-direction: row;
		width: 100%;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.actions :global(.btn) {
		width: auto;
		min-width: 10rem;
		flex: 0 0 auto;
	}
</style>
