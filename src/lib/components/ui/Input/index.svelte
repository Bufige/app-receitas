<script lang="ts">
	import Icon from "@iconify/svelte";
	import type { IconifyIcon } from "@iconify/types";
	import type { Snippet } from "svelte";
	import * as m from "$lib/paraglide/messages.js";

	interface InputProps {
		type?: "text" | "email" | "password";
		label: string;
		placeholder?: string;
		icon?: IconifyIcon;
		value?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		autocomplete?: string;
		id?: string;
		trailing?: Snippet;
		oninput?: (e: Event) => void;
	}

	let {
		type = "text",
		label,
		placeholder = "",
		icon,
		value = $bindable(""),
		error,
		disabled = false,
		required = false,
		autocomplete,
		id,
		trailing,
		oninput,
	}: InputProps = $props();

	let showPassword = $state(false);

	const inputType = $derived(
		type === "password" && showPassword ? "text" : type,
	);

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<div class="field" class:has-error={error}>
	<label class="label" for={id}>{label}</label>
	<div class="input-wrapper">
		{#if icon}
			<span class="icon-left" aria-hidden="true">
				<Icon {icon} width="1.25em" height="1.25em" />
			</span>
		{/if}
		<input
			{id}
			type={inputType}
			{placeholder}
			bind:value
			{disabled}
			{required}
			{autocomplete}
			class:has-icon={!!icon}
			class:has-trailing={type === "password" || trailing}
			{oninput}
		/>
		{#if type === "password"}
			<button
				type="button"
				class="toggle-password"
				onclick={togglePassword}
				aria-label={showPassword
					? m.auth_hide_password()
					: m.auth_show_password()}
			>
				{showPassword ? m.auth_hide_password() : m.auth_show_password()}
			</button>
		{/if}
		{#if trailing}
			{@render trailing()}
		{/if}
	</div>
	{#if error}
		<span class="error" role="alert">{error}</span>
	{/if}
</div>

<style lang="scss">
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;

		&::placeholder {
			color: var(--placeholder);
		}

		&:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.has-icon {
			padding-left: 2.5rem;
		}

		&.has-trailing {
			padding-right: 4.5rem;
		}
	}

	.icon-left {
		position: absolute;
		left: 0.75rem;
		display: inline-flex;
		align-items: center;
		color: var(--text-muted);
		pointer-events: none;
	}

	.toggle-password {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-muted);
		padding: 0.25rem;
		border-radius: 4px;
		transition: color 0.2s;

		&:hover {
			color: var(--text);
		}

		&:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}
	}

	.has-error {
		input {
			border-color: var(--error);

			&:focus {
				box-shadow: 0 0 0 2px color-mix(in srgb, var(--error) 25%, transparent);
			}
		}
	}

	.error {
		font-size: 0.8125rem;
		color: var(--error);
	}
</style>
