<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import Button from "@components/ui/Button/index.svelte";
	import Input from "@components/ui/Input/index.svelte";
	import emailOutline from "@iconify-icons/mdi/email-outline";

	let email = $state("");
</script>

<div class="forgot-password">
	<div class="auth-header">
		<h1 class="auth-title">{m.auth_forgot_title()}</h1>
		<p class="auth-subtitle">{m.auth_forgot_subtitle()}</p>
	</div>

	<form class="auth-form" onsubmit={(e) => e.preventDefault()}>
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

	<p class="auth-switch-prompt">
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
</style>
