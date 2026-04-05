<script lang="ts">
	import { page } from "$app/state";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	const tabs = [
		{ href: "/profile/history", label: () => m.profile_tabs_history() },
		{ href: "/profile/household", label: () => m.profile_tabs_household() },
	];

	function is_active(path: string): boolean {
		const localized_path = localizeHref(path);
		return (
			page.url.pathname === localized_path ||
			page.url.pathname.startsWith(`${localized_path}/`)
		);
	}
</script>

<nav class="tabs" aria-label={m.a11y_main_navigation()}>
	{#each tabs as tab}
		<a href={localizeHref(tab.href)} class:active={is_active(tab.href)}>
			{tab.label()}
		</a>
	{/each}
</nav>

<style lang="scss">
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);
		width: fit-content;
		max-width: 100%;

		a {
			padding: 0.625rem 1rem;
			border-radius: 999px;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--text-muted);
			transition:
				background-color 0.2s ease,
				color 0.2s ease;

			&:hover,
			&.active {
				background-color: color-mix(in srgb, var(--primary) 14%, transparent);
				color: var(--primary);
			}
		}
	}
</style>
