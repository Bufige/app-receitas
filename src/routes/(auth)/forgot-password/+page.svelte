<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import Button from "@components/ui/Button/index.svelte";
	import Input from "@components/ui/Input/index.svelte";
	import emailOutline from "@iconify-icons/mdi/email-outline";

	let email = $state("");
</script>

<div class="forgot-password">
	<div class="header">
		<h1 class="title">{m.auth_forgot_title()}</h1>
		<p class="subtitle">{m.auth_forgot_subtitle()}</p>
	</div>

	<form class="form" onsubmit={(e) => e.preventDefault()}>
		<Input
			id="forgot-email"
			type="email"
			label={m.auth_email_label()}
			placeholder={m.auth_email_placeholder()}
			icon={emailOutline}
			bind:value={email}
			required
			autocomplete="email"
		/>

		<Button variant="primary" size="medium" round>
			{m.auth_forgot_submit()}
		</Button>
	</form>

	<p class="switch-prompt">
		{m.auth_forgot_remembered()}
		<a href={localizeHref("/login")}>{m.auth_forgot_back_to_login()}</a>
	</p>
</div>

<style lang="scss">
	.forgot-password {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
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
