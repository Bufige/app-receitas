<script lang="ts">
	import { page } from "$app/state";
	import * as m from "$lib/paraglide/messages.js";
	import { locales, localizeHref, getLocale } from "$lib/paraglide/runtime";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import { announce } from "$lib/utils/announce";
	import Icon from "@iconify/svelte";
	import chevronDown from "@iconify-icons/mdi/chevron-down";
	import weatherNight from "@iconify-icons/mdi/weather-night";
	import weatherSunny from "@iconify-icons/mdi/weather-sunny";
	import Logo from "$lib/assets/logo.svg?component";

	const auth = useAuthStore(),
		theme = useThemeStore();

	const isAuthPage = $derived(
		/^\/(login|register|forgot-password)(\/|$)/.test(page.url.pathname) ||
			/^\/(pt-br)\/(login|register|forgot-password)(\/|$)/.test(
				page.url.pathname,
			),
	);

	let open = $state(false);
	let activeIndex = $state(-1);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const localeMap: Record<string, { label: string; flag: string }> = {
		en: { label: "EN", flag: "circle-flags:us" },
		"pt-br": { label: "PT-BR", flag: "circle-flags:br" },
	};

	function selectLocale(locale: string) {
		open = false;
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
		open = true;
		activeIndex = locales.indexOf(getLocale());
	}

	function closeDropdown() {
		open = false;
		activeIndex = -1;
		triggerRef?.focus();
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
				if (open) {
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
			open = false;
			activeIndex = -1;
		}
	}

	$effect(() => {
		if (open && activeIndex >= 0) {
			const option = document.querySelector(
				".locale-option.focused",
			) as HTMLElement | null;
			option?.focus();
		}
	});
</script>

<svelte:window onclick={handleClickOutside} />

<header class="header">
	<a class="logo" href={localizeHref("/")} aria-label={m.a11y_logo_label()}>
		<Logo aria-hidden="true" />
		<span class="title">Saudade Pet</span>
	</a>
	<nav aria-label={m.a11y_main_navigation()}>
		<div class="locale-picker">
			<button
				bind:this={triggerRef}
				class="locale-trigger"
				onclick={() => (open ? closeDropdown() : openDropdown())}
				onkeydown={handleTriggerKeydown}
				aria-label={m.a11y_select_language()}
				aria-expanded={open}
				aria-haspopup="listbox"
			>
				<Icon
					icon={localeMap[getLocale()]?.flag ?? "circle-flags:us"}
					width="16"
					height="16"
				/>
				<span class="locale-label">{localeMap[getLocale()]?.label ?? "EN"}</span
				>
				<span class="locale-chevron" aria-hidden="true">
					<Icon icon={chevronDown} width="14" height="14" />
				</span>
			</button>
			{#if open}
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

		@include md {
			gap: 1rem;
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
