<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import Icon from "@iconify/svelte";
	import Logo from "$lib/assets/logo.svg?component";

	const auth = useAuthStore(),
		theme = useThemeStore();
</script>

<div class="header">
	<h1><Logo /> Saudade Svelte</h1>
	<nav>
		<button
			class="switch"
			onclick={() => theme.toggle()}
			aria-label="Toggle theme"
			class:dark={theme.current === "dark"}
		>
			<span class="track">
				<Icon icon="mdi:weather-sunny" width="14" height="14" />
				<Icon icon="mdi:weather-night" width="14" height="14" />
				<span class="thumb"></span>
			</span>
		</button>
		{#if !auth.isAuthenticated}
			<a href={localizeHref("/login")}>{m.auth_login()}</a>
		{/if}
	</nav>
</div>

<style lang="scss">
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background-color: var(--surface);
		border-bottom: 1px solid var(--border);
		height: 64px;
		margin: 0 auto;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.switch {
		position: relative;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--text);
	}

	.track {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem;
		width: 3.25rem;
		height: 1.75rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background-color: var(--border);
		position: relative;
		transition: background-color 0.3s;
	}

	.thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background-color: var(--surface);
		box-shadow: var(--soft-box-shadow);
		transition: transform 0.3s;
	}

	.dark .thumb {
		transform: translateX(1.5rem);
	}
</style>
