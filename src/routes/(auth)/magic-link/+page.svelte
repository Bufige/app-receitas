<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useMagicLinkCooldown } from "$lib/stores/magic-link-cooldown.svelte";
	import Button from "@components/ui/Button/index.svelte";
	import Input from "@components/ui/Input/index.svelte";
	import emailOutline from "@iconify-icons/mdi/email-outline";

	let email = $state("");
	let sent = $state(false);

	const cooldown = useMagicLinkCooldown();

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (cooldown.isOnCooldown || !email) return;

		// TODO: call API to send magic link
		cooldown.start();
		sent = true;
	}
</script>

<div class="magic-link">
	<div class="header">
		<h1 class="title">{m.auth_magic_link_title()}</h1>
		<p class="subtitle">
			{#if sent}
				{m.auth_magic_link_sent({ email })}
			{:else}
				{m.auth_magic_link_subtitle()}
			{/if}
		</p>
	</div>

	{#if !sent}
		<form class="form" onsubmit={handleSubmit}>
			<Input
				id="magic-link-email"
				type="email"
				label={m.auth_email_label()}
				placeholder={m.auth_email_placeholder()}
				icon={emailOutline}
				bind:value={email}
				required
				autocomplete="email"
			/>

			<Button
				variant="primary"
				size="medium"
				round
				disabled={cooldown.isOnCooldown}
			>
				{#if cooldown.isOnCooldown}
					{m.auth_magic_link_cooldown({ seconds: cooldown.remaining })}
				{:else}
					{m.auth_magic_link_submit()}
				{/if}
			</Button>
		</form>
	{:else}
		<div class="sent-actions">
			<Button
				variant="primary"
				size="medium"
				round
				disabled={cooldown.isOnCooldown}
				onclick={handleSubmit}
			>
				{#if cooldown.isOnCooldown}
					{m.auth_magic_link_cooldown({ seconds: cooldown.remaining })}
				{:else}
					{m.auth_magic_link_resend()}
				{/if}
			</Button>
		</div>
	{/if}

	<p class="switch-prompt">
		{m.auth_magic_link_prefer_password()}
		<a href={localizeHref("/login")}>{m.auth_magic_link_back_to_login()}</a>
	</p>
</div>

<style lang="scss">
	.magic-link {
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

	.sent-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
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
