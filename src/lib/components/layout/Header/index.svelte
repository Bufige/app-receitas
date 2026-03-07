<script lang="ts">
	import { page } from "$app/state";
	import * as m from "$lib/paraglide/messages.js";
	import { locales, localizeHref, getLocale } from "$lib/paraglide/runtime";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import Icon from "@iconify/svelte";
	import Logo from "$lib/assets/logo.svg?component";

	const auth = useAuthStore(),
		theme = useThemeStore();

	let open = $state(false);

	const localeMap: Record<string, { label: string; flag: string }> = {
		en: { label: "EN", flag: "circle-flags:us" },
		"pt-br": { label: "PT-BR", flag: "circle-flags:br" },
	};

	function selectLocale(locale: string) {
		open = false;
		if (locale !== getLocale()) {
			window.location.href = localizeHref(page.url.pathname, { locale });
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest(".locale-picker")) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="header">
	<a class="logo" href={localizeHref("/")}>
		<Logo />
		<span class="title">Saudade Svelte</span>
	</a>
	<nav>
		<div class="locale-picker">
			<button
				class="locale-trigger"
				onclick={() => (open = !open)}
				aria-label="Select language"
				aria-expanded={open}
			>
				<Icon
					icon={localeMap[getLocale()]?.flag ?? "circle-flags:us"}
					width="16"
					height="16"
				/>
				<span class="locale-label">{localeMap[getLocale()]?.label ?? "EN"}</span
				>
				<span class="locale-chevron">
					<Icon icon="mdi:chevron-down" width="14" height="14" />
				</span>
			</button>
			{#if open}
				<ul class="locale-dropdown">
					{#each locales as locale}
						<li>
							<button
								class="locale-option"
								class:active={locale === getLocale()}
								onclick={() => selectLocale(locale)}
							>
								<Icon
									icon={localeMap[locale]?.flag ?? locale}
									width="18"
									height="18"
								/>
								<span>{localeMap[locale]?.label ?? locale.toUpperCase()}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<button
			class="switch"
			onclick={() => theme.toggle()}
			aria-label="Toggle theme"
			class:dark={theme.current === "dark"}
		>
			<span class="track">
				<Icon icon="mdi:weather-sunny" />
				<Icon icon="mdi:weather-night" />
				<span class="thumb"></span>
			</span>
		</button>
		{#if !auth.isAuthenticated}
			<a href={localizeHref("/login")}>{m.auth_login()}</a>
		{/if}
	</nav>
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.header {
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

		&:hover {
			background-color: var(--border);
		}

		&.active {
			color: var(--primary);
			font-weight: 600;
		}

		@include md {
			font-size: 0.8125rem;
		}
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
		font-size: 0.75rem;

		@include md {
			font-size: 0.875rem;
		}
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
