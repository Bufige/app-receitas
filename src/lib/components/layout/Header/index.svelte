<script lang="ts">
	import { page } from "$app/state";
	import * as m from "$lib/paraglide/messages.js";
	import { locales, localizeHref, getLocale } from "$lib/paraglide/runtime";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import { announce } from "$lib/utils/announce";
	import Icon from "@iconify/svelte";
	import menuIcon from "@iconify-icons/mdi/menu";
	import closeIcon from "@iconify-icons/mdi/close";
	import chevronDown from "@iconify-icons/mdi/chevron-down";
	import weatherNight from "@iconify-icons/mdi/weather-night";
	import weatherSunny from "@iconify-icons/mdi/weather-sunny";
	import Logo from "$lib/assets/logo.svg?component";

	const auth = useAuthStore(),
		theme = useThemeStore();

	const navigation_links = [
		{ href: "/recipes", label: () => m.nav_recipes() },
		{ href: "/planner", label: () => m.nav_planner() },
		{ href: "/shopping-list", label: () => m.nav_shopping_list() },
		{ href: "/profile/household", label: () => m.nav_household_profile() },
	];

	const isAuthPage = $derived(
		/^\/(login|register|forgot-password|magic-link)(\/|$)/.test(
			page.url.pathname,
		) ||
			/^\/(pt-br)\/(login|register|forgot-password|magic-link)(\/|$)/.test(
				page.url.pathname,
			),
	);

	let locale_open = $state(false);
	let menu_open = $state(false);
	let activeIndex = $state(-1);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const localeMap: Record<string, { label: string; flag: string }> = {
		en: { label: "EN", flag: "circle-flags:us" },
		"pt-br": { label: "PT-BR", flag: "circle-flags:br" },
	};

	function selectLocale(locale: string) {
		locale_open = false;
		activeIndex = -1;
		triggerRef?.focus();
		if (locale !== getLocale()) {
			announce(
				m.a11y_locale_changed({ locale: localeMap[locale]?.label ?? locale }),
			);
			window.location.href = localizeHref(page.url.pathname, { locale });
		}
	}

	function toggleTheme(event: MouseEvent) {
		const { clientX, clientY } = event;
		theme.toggle(clientX, clientY);
		const next = theme.current === "dark" ? "dark" : "light";
		announce(m.a11y_theme_changed({ theme: next }));
	}

	function openDropdown() {
		locale_open = true;
		activeIndex = locales.indexOf(getLocale());
	}

	function closeDropdown() {
		locale_open = false;
		activeIndex = -1;
		triggerRef?.focus();
	}

	function closeMenu() {
		menu_open = false;
	}

	function toggleMenu() {
		menu_open = !menu_open;
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowDown":
			case "Enter":
			case " ":
				event.preventDefault();
				openDropdown();
				break;
			case "Escape":
				if (locale_open) {
					event.preventDefault();
					closeDropdown();
				}
				break;
		}
	}

	function handleDropdownKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				activeIndex = (activeIndex + 1) % locales.length;
				break;
			case "ArrowUp":
				event.preventDefault();
				activeIndex = (activeIndex - 1 + locales.length) % locales.length;
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				if (activeIndex >= 0) {
					selectLocale(locales[activeIndex]);
				}
				break;
			case "Escape":
				event.preventDefault();
				closeDropdown();
				break;
			case "Tab":
				closeDropdown();
				break;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest(".locale-picker")) {
			locale_open = false;
			activeIndex = -1;
		}

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
		if (locale_open && activeIndex >= 0) {
			const option = document.querySelector(
				".locale-option.focused",
			) as HTMLElement | null;
			option?.focus();
		}
	});

	$effect(() => {
		page.url.pathname;
		menu_open = false;
		locale_open = false;
		activeIndex = -1;
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
					href={localizeHref(link.href)}
					class:active={isActive(link.href)}
					onclick={closeMenu}
				>
					{link.label()}
				</a>
			{/each}
		</div>
		<div class="secondary-actions">
			<div class="locale-picker">
				<button
					bind:this={triggerRef}
					class="locale-trigger"
					onclick={() => (locale_open ? closeDropdown() : openDropdown())}
					onkeydown={handleTriggerKeydown}
					aria-label={m.a11y_select_language()}
					aria-expanded={locale_open}
					aria-haspopup="listbox"
				>
					<Icon
						icon={localeMap[getLocale()]?.flag ?? "circle-flags:us"}
						width="16"
						height="16"
					/>
					<span class="locale-label"
						>{localeMap[getLocale()]?.label ?? "EN"}</span
					>
					<span class="locale-chevron" aria-hidden="true">
						<Icon icon={chevronDown} width="14" height="14" />
					</span>
				</button>
				{#if locale_open}
					<ul
						class="locale-dropdown"
						role="listbox"
						aria-label={m.a11y_select_language()}
						onkeydown={handleDropdownKeydown}
					>
						{#each locales as locale, i}
							<li
								role="option"
								aria-selected={locale === getLocale()}
								class="locale-option"
								class:active={locale === getLocale()}
								class:focused={i === activeIndex}
								onclick={() => selectLocale(locale)}
								onkeydown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										selectLocale(locale);
									}
								}}
								tabindex={i === activeIndex ? 0 : -1}
							>
								<Icon
									icon={localeMap[locale]?.flag ?? locale}
									width="18"
									height="18"
								/>
								<span>{localeMap[locale]?.label ?? locale.toUpperCase()}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
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

		&.open {
			display: flex;
		}

		a {
			font-size: 0.8125rem;
			color: var(--text-muted);
			white-space: nowrap;
			padding: 0.7rem 0.85rem;
			border-radius: 14px;

			&:hover,
			&.active {
				background-color: color-mix(in srgb, var(--primary) 14%, transparent);
				color: var(--primary);
			}
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

			a {
				padding: 0;
				border-radius: 0;
				background: none;
			}
		}
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

	.locale-picker {
		position: relative;

		@include md {
			width: 6.5rem;
		}
	}

	.locale-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--text-muted);
		letter-spacing: 0.05em;

		&:hover {
			border-color: var(--text-muted);
		}

		@include md {
			gap: 0.35rem;
			width: 100%;
			justify-content: flex-start;
			padding: 0.25rem 0.5rem;
			font-size: 0.8125rem;
		}
	}

	.locale-label {
		display: none;
		flex: 1;
		font-weight: 500;

		@include md {
			display: inline;
		}
	}

	.locale-chevron {
		display: none;
		line-height: 0;

		@include md {
			display: inline-flex;
		}
	}

	.locale-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: var(--box-shadow);
		z-index: 200;
		min-width: 100%;
	}

	.locale-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: var(--text);
		font-size: 0.75rem;
		white-space: nowrap;

		&:hover,
		&.focused {
			background-color: var(--border);
		}

		&.active {
			color: var(--primary);
			font-weight: 600;
			background-color: color-mix(in srgb, var(--primary) 12%, transparent);

			&:hover,
			&.focused {
				background-color: color-mix(in srgb, var(--primary) 18%, transparent);
			}
		}

		@include md {
			font-size: 0.8125rem;
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
