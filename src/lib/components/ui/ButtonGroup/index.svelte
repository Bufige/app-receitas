<script lang="ts">
	import type { Snippet } from "svelte";

	type Direction = "row" | "column";

	interface ButtonGroupProps {
		direction?: Direction;
		gap?: string;
		children?: Snippet;
	}

	let {
		direction = "column",
		gap = "0.75rem",
		children,
	}: ButtonGroupProps = $props();
</script>

<div class="group {direction}" style:gap>
	{#if children}
		{@render children()}
	{/if}
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.group {
		display: flex;
		width: 100%;

		@include md {
			width: auto;
		}
	}

	.column {
		flex-direction: column;

		@include md {
			flex-direction: row;
		}
	}

	.row {
		flex-direction: row;
	}
</style>
