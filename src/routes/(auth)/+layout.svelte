<script lang="ts">
	let { children } = $props();
</script>

<div class="auth-layout">
	<div class="auth-card">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.auth-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		margin: -1rem;
		padding: 2.5rem 1.5rem;
		background-image: var(--auth-bg-image);
		background-color: var(--auth-bg-overlay);
		background-size: cover;
		background-position: var(--auth-bg-offset) center;
		background-repeat: no-repeat;
		background-blend-mode: overlay;

		@include md {
			margin: -1.5rem -2rem;
			padding: 3rem 2rem;
			background-position: center;
		}
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		background-color: color-mix(in srgb, var(--surface) 75%, transparent);
		border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
		border-radius: 12px;
		padding: 2rem 1.5rem;
		box-shadow: var(--high-box-shadow);

		@include md {
			padding: 2.5rem 2rem;
		}
	}
</style>
