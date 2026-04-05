<script lang="ts">
	import { page } from "$app/state";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import { announce } from "$lib/utils/announce";
	import Icon from "@iconify/svelte";
	import menuIcon from "@iconify-icons/mdi/menu";
	import closeIcon from "@iconify-icons/mdi/close";
	import silverwareForkKnife from "@iconify-icons/mdi/silverware-fork-knife";
	import calendarMonthOutline from "@iconify-icons/mdi/calendar-month-outline";
	import cartOutline from "@iconify-icons/mdi/cart-outline";
	import homeAccount from "@iconify-icons/mdi/home-account";
	import weatherNight from "@iconify-icons/mdi/weather-night";
	import weatherSunny from "@iconify-icons/mdi/weather-sunny";
	import Logo from "$lib/assets/logo.svg?component";

	const auth = useAuthStore(),
		theme = useThemeStore();

	const navigation_links = [
		{
			href: "/recipes",
			label: () => m.nav_recipes(),
			icon: silverwareForkKnife,
		},
		{
			href: "/planner",
			label: () => m.nav_planner(),
			icon: calendarMonthOutline,
		},
		{
			href: "/shopping-list",
			label: () => m.nav_shopping_list(),
			icon: cartOutline,
		},
		{
			href: "/profile/household",
			label: () => m.nav_household_profile(),
			icon: homeAccount,
		},
	];

	const isAuthPage = $derived(
		/^\/(login|register|forgot-password|magic-link)(\/|$)/.test(
			page.url.pathname,
		) ||
			/^\/(pt-br)\/(login|register|forgot-password|magic-link)(\/|$)/.test(
				page.url.pathname,
			),
	);

	let menu_open = $state(false);

	function toggleTheme(event: MouseEvent) {
		const { clientX, clientY } = event;
		theme.toggle(clientX, clientY);
		const next = theme.current === "dark" ? "dark" : "light";
		announce(m.a11y_theme_changed({ theme: next }));
	}

	function closeMenu() {
		menu_open = false;
	}

	function toggleMenu() {
		menu_open = !menu_open;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;

		if (!target.closest(".header")) {
			menu_open = false;
		}
	}

	function isActive(path: string) {
		const localized_path = localizeHref(path);
		return (
			page.url.pathname === localized_path ||
			page.url.pathname.startsWith(`${localized_path}/`)
		);
	}

	$effect(() => {
		page.url.pathname;
		menu_open = false;
	});
</script>

<svelte:window onclick={handleClickOutside} />

<header class="header">
	<a class="logo" href={localizeHref("/")} aria-label={m.a11y_logo_label()}>
		<Logo aria-hidden="true" />
		<span class="title">SuaReceita</span>
	</a>
	<nav aria-label={m.a11y_main_navigation()}>
		<div
			id="mobile-navigation-links"
			class="primary-links"
			class:open={menu_open}
		>
			{#each navigation_links as link}
				<a
					class="nav-link"
					href={localizeHref(link.href)}
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? "page" : undefined}
					onclick={closeMenu}
				>
					<span class="nav-icon" aria-hidden="true">
						<Icon icon={link.icon} width="18" height="18" />
					</span>
					<span class="nav-label">{link.label()}</span>
				</a>
			{/each}
		</div>
		<div class="secondary-actions">
			<button
				class="switch"
				onclick={toggleTheme}
				aria-label={m.a11y_toggle_theme()}
				class:dark={theme.current === "dark"}
				role="switch"
				aria-checked={theme.current === "dark"}
			>
				<span class="track">
					<Icon icon={weatherSunny} aria-hidden="true" />
					<Icon icon={weatherNight} aria-hidden="true" />
					<span class="thumb"></span>
				</span>
			</button>
			{#if !auth.isAuthenticated && !isAuthPage}
				<a class="auth-link" href={localizeHref("/login")}>{m.auth_login()}</a>
			{/if}
			<button
				class="menu-toggle"
				type="button"
				onclick={toggleMenu}
				aria-label={m.a11y_main_navigation()}
				aria-expanded={menu_open}
				aria-controls="mobile-navigation-links"
			>
				<Icon icon={menu_open ? closeIcon : menuIcon} width="20" height="20" />
				<span class="sr-only">{m.a11y_main_navigation()}</span>
			</button>
		</div>
	</nav>
</header>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--bg);
		border-bottom: 1px solid var(--border);
		height: 56px;
		width: 100%;
		position: sticky;
		top: 0;
		z-index: 100;

		@include md {
			padding: 1rem 2rem;
			height: 64px;
		}
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		white-space: nowrap;

		@include md {
			font-size: 1.25rem;
		}
	}

	.title {
		display: none;

		@include md {
			display: inline;
		}
	}

	nav {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		justify-content: flex-end;
		position: relative;

		@include md {
			gap: 1rem;
		}
	}

	.primary-links {
		display: none;
		position: absolute;
		top: calc(100% + 0.75rem);
		right: 0;
		left: auto;
		min-width: min(18rem, calc(100vw - 2rem));
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 98%, transparent);
		box-shadow: var(--box-shadow);
		flex-direction: column;
		align-items: stretch;
		gap: 0.35rem;
		backdrop-filter: blur(18px);

		&.open {
			display: flex;
		}

		@include md {
			display: flex;
			position: static;
			min-width: auto;
			padding: 0;
			border: none;
			border-radius: 0;
			background: none;
			box-shadow: none;
			flex-direction: row;
			align-items: center;
			gap: 0.75rem;
		}
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.75rem;
		padding: 0.75rem 0.95rem;
		border: 1px solid transparent;
		border-radius: 16px;
		background-color: transparent;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.2s ease;
		-webkit-tap-highlight-color: transparent;

		&:hover {
			background-color: color-mix(in srgb, var(--primary) 10%, var(--surface));
			border-color: color-mix(in srgb, var(--primary) 18%, var(--border));
			color: var(--text);
		}

		&:active {
			transform: translateY(1px);
			background-color: color-mix(in srgb, var(--primary) 14%, var(--surface));
		}

		&:focus-visible {
			outline: none;
			border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
		}

		&.active {
			background: linear-gradient(
				180deg,
				color-mix(in srgb, var(--primary) 16%, var(--surface)) 0%,
				color-mix(in srgb, var(--primary) 10%, var(--surface)) 100%
			);
			border-color: color-mix(in srgb, var(--primary) 26%, var(--border));
			box-shadow: inset 0 1px 0
				color-mix(in srgb, var(--white) 48%, transparent);
			color: var(--primary);
		}

		@include md {
			min-height: 2.5rem;
			padding: 0.55rem 0.8rem;
			border-radius: 999px;
			font-size: 0.8125rem;
		}
	}

	.nav-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: currentColor;
		line-height: 0;
		flex-shrink: 0;
	}

	.nav-label {
		line-height: 1;
	}

	.secondary-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: nowrap;

		@include md {
			justify-content: flex-end;
			width: auto;
		}
	}

	.auth-link {
		min-width: 4rem;
		text-align: center;
		font-size: 0.8125rem;
		white-space: nowrap;
	}

	.menu-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		color: var(--text);
		cursor: pointer;
		flex-shrink: 0;

		@include md {
			display: none;
		}
	}

	.switch {
		position: relative;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--text);
		flex-shrink: 0;
		view-transition-name: theme-switch;
	}

	.track {
		--track-width: 3rem;
		--thumb-size: 1.125rem;
		--gap: 2px;

		display: flex;
		align-items: center;
		justify-content: space-between;
		width: var(--track-width);
		height: 1.625rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		background-color: var(--border);
		position: relative;
		transition: background-color 0.3s;
		overflow: hidden;

		:global(svg) {
			width: 0.75rem;
			height: 0.75rem;
			flex-shrink: 0;
		}

		@include md {
			--track-width: 3.25rem;
			--thumb-size: 1.25rem;
			--gap: 3px;

			width: var(--track-width);
			height: 1.75rem;
			padding: 0 0.3rem;

			:global(svg) {
				width: 0.875rem;
				height: 0.875rem;
			}
		}
	}

	.thumb {
		position: absolute;
		top: 50%;
		left: var(--gap);
		width: var(--thumb-size);
		height: var(--thumb-size);
		transform: translateY(-50%);
		border-radius: 50%;
		background-color: var(--surface);
		box-shadow: var(--soft-box-shadow);
		transition: left 0.3s ease;

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	.dark .thumb {
		left: calc(var(--track-width) - var(--thumb-size) - var(--gap));
	}

	:global([data-theme="dark"]) .thumb {
		left: calc(var(--track-width) - var(--thumb-size) - var(--gap));
	}
</style>
