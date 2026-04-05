<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { page } from "$app/state";
	import { getLocale, locales, localizeHref } from "$lib/paraglide/runtime";
	import { announce } from "$lib/utils/announce";
	import Icon from "@iconify/svelte";
	import chevronDown from "@iconify-icons/mdi/chevron-down";

	let locale_open = $state(false);
	let activeIndex = $state(-1);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const localeMap: Record<string, { label: string; flag: string }> = {
		en: { label: "EN", flag: "circle-flags:us" },
		"pt-br": { label: "PT-BR", flag: "circle-flags:br" },
	};

	function getCurrentPath() {
		return `${page.url.pathname}${page.url.search}`;
	}

	function selectLocale(locale: string) {
		locale_open = false;
		activeIndex = -1;
		triggerRef?.focus();

		if (locale !== getLocale()) {
			announce(
				m.a11y_locale_changed({ locale: localeMap[locale]?.label ?? locale }),
			);
			window.location.href = localizeHref(getCurrentPath(), { locale });
		}
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
		locale_open = false;
		activeIndex = -1;
	});
</script>

<svelte:window onclick={handleClickOutside} />

<footer class="footer">
	<div class="content">
		<p class="rights">{m.footer_rights()}</p>
		<div class="meta-row">
			<nav class="links">
				<a href={localizeHref("/privacy-policy")}>{m.footer_privacy_policy()}</a
				>
				<a href={localizeHref("/terms-of-service")}
					>{m.footer_terms_of_service()}</a
				>
			</nav>

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
		</div>
	</div>
</footer>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.footer {
		background-color: var(--bg);
		border-top: 1px solid var(--border);
		padding: 1rem;

		@include md {
			padding: 1.5rem 2rem;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		max-width: 1280px;
		margin: 0 auto;
	}

	.rights {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.meta-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		width: 100%;

		@include md {
			flex-direction: row;
			justify-content: center;
			gap: 1rem;
		}
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;

		a {
			font-size: 0.875rem;
			color: var(--text-muted);

			&:hover {
				color: var(--text);
			}
		}
	}

	.locale-picker {
		position: relative;
	}

	.locale-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 2.5rem;
		padding: 0.55rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background-color: color-mix(in srgb, var(--surface) 96%, transparent);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color var(--motion-base) var(--ease-standard),
			border-color var(--motion-base) var(--ease-standard),
			color var(--motion-base) var(--ease-standard),
			transform var(--motion-base) var(--ease-standard);

		&:hover {
			background-color: color-mix(in srgb, var(--primary) 8%, var(--surface));
			border-color: color-mix(in srgb, var(--primary) 20%, var(--border));
			color: var(--text);
		}

		&:active {
			transform: translateY(1px);
		}
	}

	.locale-label {
		font-weight: 600;
	}

	.locale-chevron {
		display: inline-flex;
		line-height: 0;
	}

	.locale-dropdown {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		list-style: none;
		margin: 0;
		padding: 0.35rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		box-shadow: var(--box-shadow);
		z-index: 200;
		min-width: 8.5rem;
	}

	.locale-option {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		padding: 0.5rem 0.65rem;
		background: none;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		color: var(--text);
		font-size: 0.8125rem;
		white-space: nowrap;

		&:hover,
		&.focused {
			background-color: color-mix(in srgb, var(--primary) 8%, var(--surface));
		}

		&.active {
			color: var(--primary);
			font-weight: 700;
			background-color: color-mix(in srgb, var(--primary) 14%, transparent);
		}
	}
</style>
