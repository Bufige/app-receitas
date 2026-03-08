<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import Button from "@components/ui/Button/index.svelte";
	import Input from "@components/ui/Input/index.svelte";
	import Icon from "@iconify/svelte";
	import googleIcon from "@iconify-icons/mdi/google";
	import emailOutline from "@iconify-icons/mdi/email-outline";
	import lockOutline from "@iconify-icons/mdi/lock-outline";
	import linkVariant from "@iconify-icons/mdi/link-variant";

	let email = $state("");
	let password = $state("");
</script>

<div class="login">
	<div class="header">
		<h1 class="title">{m.auth_login_title()}</h1>
		<p class="subtitle">{m.auth_login_subtitle()}</p>
	</div>

	<div class="social-buttons">
		<Button variant="primary" size="medium" round>
			<Icon icon={googleIcon} width="1.25em" height="1.25em" />
			{m.auth_continue_google()}
		</Button>

		<Button variant="outline" size="medium" round>
			<Icon icon={linkVariant} width="1.25em" height="1.25em" />
			{m.auth_magic_link()}
		</Button>
	</div>

	<div class="divider">
		<span>{m.auth_or_password()}</span>
	</div>

	<form class="form" onsubmit={(e) => e.preventDefault()}>
		<Input
			id="login-email"
			type="email"
			label={m.auth_email_label()}
			placeholder={m.auth_email_placeholder()}
			icon={emailOutline}
			bind:value={email}
			required
			autocomplete="email"
		/>

		<div class="password-field">
			<Input
				id="login-password"
				type="password"
				label={m.auth_password_label()}
				placeholder={m.auth_password_placeholder()}
				icon={lockOutline}
				bind:value={password}
				required
				autocomplete="current-password"
			/>
			<a href={localizeHref("/forgot-password")} class="forgot-link">
				{m.auth_forgot_password()}
			</a>
		</div>

		<Button variant="primary" size="medium" round>
			{m.auth_sign_in()}
		</Button>
	</form>

	<p class="switch-prompt">
		{m.auth_no_account()}
		<a href={localizeHref("/register")}>{m.auth_no_account_link()}</a>
	</p>
</div>

<style lang="scss">
	.login {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.social-buttons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		&::before,
		&::after {
			content: "";
			flex: 1;
			height: 1px;
			background-color: var(--border);
		}

		span {
			font-size: 0.8125rem;
			color: var(--text-muted);
			white-space: nowrap;
		}
	}

	.form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.password-field {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.forgot-link {
		align-self: flex-end;
		font-size: 0.8125rem;
		color: var(--text-muted);
		transition: color 0.2s;

		&:hover {
			color: var(--primary);
		}
	}

	.switch-prompt {
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-muted);

		a {
			color: var(--primary);
			font-weight: 600;
			transition: color 0.2s;

			&:hover {
				color: var(--primary-hover);
			}
		}
	}
</style>
