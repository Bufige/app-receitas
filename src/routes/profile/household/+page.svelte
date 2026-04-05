<script lang="ts">
	import Button from "$lib/components/ui/Button/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import ProfileTabs from "$lib/components/ui/ProfileTabs/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { announce } from "$lib/utils/announce";

	const household_store = useHouseholdProfileStore();
	const profile = household_store.profile;

	let name = $state(profile.name);
	let default_servings = $state(`${profile.default_servings}`);
	let dietary_preferences = $state(
		(profile.dietary_preferences ?? []).join(", "),
	);
	let disliked_ingredients = $state(
		(profile.disliked_ingredients ?? []).join(", "),
	);

	function parse_list(value: string): string[] {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function save_profile() {
		household_store.update({
			name,
			default_servings: Math.max(1, Number(default_servings) || 1),
			dietary_preferences: parse_list(dietary_preferences),
			disliked_ingredients: parse_list(disliked_ingredients),
		});
		announce(m.a11y_household_saved());
	}
</script>

<SEO
	title={m.seo_household_title()}
	description={m.seo_household_description()}
/>

<section class="page">
	<header class="hero">
		<div>
			<h1>{m.household_title()}</h1>
			<p>{m.household_subtitle()}</p>
		</div>
		<div class="hero-note">
			<span>{m.household_default_servings_label()}</span>
			<strong>{profile.default_servings}</strong>
		</div>
	</header>

	<ProfileTabs />

	<div class="content-grid">
		<form class="panel form" onsubmit={(event) => event.preventDefault()}>
			<Input
				id="household-name"
				label={m.household_name_label()}
				bind:value={name}
			/>

			<div class="field-group">
				<label for="default-servings"
					>{m.household_default_servings_label()}</label
				>
				<input
					id="default-servings"
					type="number"
					min="1"
					bind:value={default_servings}
				/>
			</div>

			<Input
				id="dietary-preferences"
				label={m.household_dietary_preferences_label()}
				placeholder={m.household_dietary_preferences_placeholder()}
				bind:value={dietary_preferences}
			/>

			<Input
				id="disliked-ingredients"
				label={m.household_disliked_ingredients_label()}
				placeholder={m.household_disliked_ingredients_placeholder()}
				bind:value={disliked_ingredients}
			/>

			<div class="actions">
				<Button variant="primary" size="medium" round onclick={save_profile}>
					{m.household_save()}
				</Button>
			</div>
		</form>

		<aside class="panel summary-panel">
			<h2>{profile.name}</h2>
			<p>{m.household_subtitle()}</p>
			<div class="summary-list">
				<div>
					<span>{m.household_default_servings_label()}</span>
					<strong>{profile.default_servings}</strong>
				</div>
				<div>
					<span>{m.household_dietary_preferences_label()}</span>
					<strong>{profile.dietary_preferences?.join(", ") || "—"}</strong>
				</div>
				<div>
					<span>{m.household_disliked_ingredients_label()}</span>
					<strong>{profile.disliked_ingredients?.join(", ") || "—"}</strong>
				</div>
			</div>
		</aside>
	</div>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.hero,
	.panel {
		padding: 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 96%, transparent);
		box-shadow: var(--soft-box-shadow);
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		@include md {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		p {
			color: var(--text-muted);
		}
	}

	.hero-note {
		display: inline-flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.85rem 1rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--primary) 18%, white),
			color-mix(in srgb, var(--secondary) 18%, white)
		);

		span {
			font-size: 0.8125rem;
			color: var(--text-muted);
		}
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;

		@include lg {
			grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 0.9fr);
		}
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

		label {
			font-size: 0.875rem;
			font-weight: 500;
		}

		input {
			width: 100%;
			padding: 0.625rem 0.75rem;
			background-color: color-mix(in srgb, var(--surface) 78%, transparent);
			border: 1px solid var(--border);
			border-radius: 12px;
		}
	}

	.actions {
		display: flex;
		justify-content: flex-start;
	}

	.summary-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			color: var(--text-muted);
		}
	}

	.summary-list {
		display: grid;
		gap: 0.875rem;

		div {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
			padding-bottom: 0.875rem;
			border-bottom: 1px solid var(--border);
		}

		span {
			font-size: 0.8125rem;
			color: var(--text-muted);
		}
	}
</style>
