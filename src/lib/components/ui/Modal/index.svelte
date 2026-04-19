<script lang="ts">
	import { tick } from "svelte";
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

	let modal_element = $state<HTMLDivElement | undefined>(undefined);

	$effect(() => {
		if (!open) {
			return;
		}

		void tick().then(() => {
			modal_element?.focus();
		});
	});
</script>

{#if open}
	<div class="backdrop">
		<div
			bind:this={modal_element}
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
		overflow-y: auto;
		background-color: color-mix(in srgb, var(--black) 58%, transparent);
		z-index: 1200;
	}

	.card {
		width: min(100%, 38rem);
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		gap: 1rem;
		padding: 1.25rem;
		max-height: calc(100dvh - 2rem);
		overflow: hidden;
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
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
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
