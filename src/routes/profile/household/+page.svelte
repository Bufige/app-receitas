<script lang="ts">
	import Icon from "@iconify/svelte";
	import trashCanOutline from "@iconify-icons/mdi/trash-can-outline";
	import Button from "$lib/components/ui/Button/index.svelte";
	import Input from "$lib/components/ui/Input/index.svelte";
	import Modal from "$lib/components/ui/Modal/index.svelte";
	import ProfileTabs from "$lib/components/ui/ProfileTabs/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { getLocale } from "$lib/paraglide/runtime";
	import { useHouseholdProfileStore } from "$lib/stores/household-profile.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type { HouseholdKind } from "$lib/types/planning";
	import { announce } from "$lib/utils/announce";

	const household_store = useHouseholdProfileStore();
	const meal_plan_store = useMealPlanStore();
	const message_registry = m as Record<string, unknown>;
	const households = $derived(household_store.profiles);
	const home_household_id = $derived.by(
		() =>
			households.find((household) => household.kind === "home")?.id ??
			households[0]?.id ??
			"",
	);
	const pending_delete_household = $derived.by(
		() =>
			households.find(
				(household) => household.id === household_pending_delete_id,
			) ?? null,
	);
	const plan_counts = $derived.by(() => {
		const counts = new Map<string, number>();

		for (const plan of meal_plan_store.allMealPlans) {
			counts.set(plan.household_id, (counts.get(plan.household_id) ?? 0) + 1);
		}

		return counts;
	});

	let last_household_id = $state("");
	let name = $state("");
	let default_servings = $state("1");
	let dietary_preferences = $state("");
	let disliked_ingredients = $state("");
	let household_pending_delete_id = $state<string | null>(null);

	function localized_fallback(english: string, portuguese: string): string {
		return getLocale() === "pt-br" ? portuguese : english;
	}

	function call_optional_message<TInputs>(
		candidate: unknown,
		fallback: string,
		inputs?: TInputs,
	): string {
		if (typeof candidate !== "function") {
			return fallback;
		}

		try {
			return inputs === undefined
				? (candidate as () => string)()
				: (candidate as (input: TInputs) => string)(inputs);
		} catch {
			return fallback;
		}
	}

	function get_optional_message(key: string, fallback: string): string {
		return call_optional_message(message_registry[key], fallback);
	}

	function household_profiles_title(): string {
		return get_optional_message(
			"household_profiles_title",
			localized_fallback("Households and businesses", "Casas e negócios"),
		);
	}

	function household_active_label(): string {
		return get_optional_message(
			"household_active_label",
			localized_fallback("Active household", "Casa ativa"),
		);
	}

	function household_kind_label(): string {
		return get_optional_message(
			"household_kind_label",
			localized_fallback("Profile type", "Tipo de perfil"),
		);
	}

	function household_kind_name(kind: HouseholdKind): string {
		return kind === "business"
			? get_optional_message(
					"household_kind_business",
					localized_fallback("Business", "Negócio"),
				)
			: get_optional_message(
					"household_kind_home",
					localized_fallback("Home", "Casa"),
				);
	}

	function household_add_home(): string {
		return get_optional_message(
			"household_add_home",
			localized_fallback("Add home", "Adicionar casa"),
		);
	}

	function household_add_business(): string {
		return get_optional_message(
			"household_add_business",
			localized_fallback("Add business", "Adicionar negócio"),
		);
	}

	function household_plan_count(count: number): string {
		const fallback = localized_fallback(
			`${count} saved plans`,
			`${count} planos salvos`,
		);

		return call_optional_message(
			message_registry.household_plan_count,
			fallback,
			{
				count: `${count}`,
			},
		);
	}

	function household_filter_hint(): string {
		return get_optional_message(
			"household_household_filter_hint",
			localized_fallback(
				"Planner and shopping views follow the active household.",
				"O planejador e a lista de compras seguem a casa ativa.",
			),
		);
	}

	function household_created(name: string): string {
		const fallback = localized_fallback(`Created ${name}`, `${name} criado`);

		return call_optional_message(message_registry.household_created, fallback, {
			name,
		});
	}

	function household_deleted_message(): string {
		return get_optional_message(
			"a11y_household_deleted",
			localized_fallback("Household deleted", "Casa excluída"),
		);
	}

	function household_delete_label(): string {
		return get_optional_message(
			"household_delete_label",
			localized_fallback("Delete profile", "Excluir perfil"),
		);
	}

	function household_delete_title(): string {
		return get_optional_message(
			"household_delete_title",
			localized_fallback("Delete profile", "Excluir perfil"),
		);
	}

	function household_delete_description(): string {
		return get_optional_message(
			"household_delete_description",
			localized_fallback(
				"This permanently removes the selected profile and every plan connected to it.",
				"Isso remove permanentemente o perfil selecionado e todos os planos conectados a ele.",
			),
		);
	}

	function household_delete_cancel(): string {
		return get_optional_message(
			"household_delete_cancel",
			localized_fallback("Cancel", "Cancelar"),
		);
	}

	function household_delete_confirm(): string {
		return get_optional_message(
			"household_delete_confirm",
			localized_fallback("Delete profile", "Excluir perfil"),
		);
	}

	$effect(() => {
		const profile = household_store.profile;

		if (profile.id === last_household_id) {
			return;
		}

		last_household_id = profile.id;
		name = profile.name;
		default_servings = `${profile.default_servings}`;
		dietary_preferences = (profile.dietary_preferences ?? []).join(", ");
		disliked_ingredients = (profile.disliked_ingredients ?? []).join(", ");
	});

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

	function create_household(kind: HouseholdKind) {
		const created = household_store.createHousehold(kind);
		announce(household_created(created.name));
	}

	function request_delete_household(household_id: string) {
		household_pending_delete_id = household_id;
	}

	function close_delete_modal() {
		household_pending_delete_id = null;
	}

	function confirm_delete_household() {
		if (!household_pending_delete_id) {
			return;
		}

		meal_plan_store.deleteHouseholdPlans(
			household_pending_delete_id,
			home_household_id,
		);
		household_store.deleteHousehold(household_pending_delete_id);
		announce(household_deleted_message());
		close_delete_modal();
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
			<span>{household_active_label()}</span>
			<strong>{household_store.profile.name}</strong>
			<small>{household_kind_name(household_store.profile.kind)}</small>
		</div>
	</header>

	<ProfileTabs />

	<section class="panel households-panel">
		<div class="panel-header">
			<div>
				<h2>{household_profiles_title()}</h2>
				<p>{household_filter_hint()}</p>
			</div>
			<div class="household-actions">
				<Button
					variant="outline"
					size="small"
					round
					onclick={() => create_household("home")}
				>
					{household_add_home()}
				</Button>
				<Button
					variant="outline"
					size="small"
					round
					onclick={() => create_household("business")}
				>
					{household_add_business()}
				</Button>
			</div>
		</div>

		<div class="household-list" role="list">
			{#each households as household}
				<article
					class="household-card"
					class:active={household.id === household_store.profile.id}
				>
					<button
						type="button"
						class="household-card__select"
						onclick={() => household_store.selectHousehold(household.id)}
					>
						<div>
							<strong>{household.name}</strong>
							<span>{household_kind_name(household.kind)}</span>
						</div>
						<div class="household-card__meta">
							<span
								>{household_plan_count(
									plan_counts.get(household.id) ?? 0,
								)}</span
							>
							<strong>{household.default_servings}</strong>
						</div>
					</button>
					{#if household_store.canDeleteHousehold(household.id)}
						<button
							type="button"
							class="household-card__delete"
							aria-label={household_delete_label()}
							onclick={() => request_delete_household(household.id)}
						>
							<Icon icon={trashCanOutline} aria-hidden="true" />
						</button>
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<Modal
		open={Boolean(household_pending_delete_id)}
		title={household_delete_title()}
		description={household_delete_description()}
		titleId="household-delete-title"
		descriptionId="household-delete-description"
	>
		{#snippet children()}
			{#if pending_delete_household}
				<p class="modal-highlight">
					<strong>{pending_delete_household.name}</strong>
					· {household_kind_name(pending_delete_household.kind)}
				</p>
			{/if}
		{/snippet}

		{#snippet actions()}
			<Button
				variant="outline"
				size="medium"
				round
				onclick={close_delete_modal}
			>
				{household_delete_cancel()}
			</Button>
			<Button
				variant="danger"
				size="medium"
				round
				onclick={confirm_delete_household}
			>
				{household_delete_confirm()}
			</Button>
		{/snippet}
	</Modal>

	<div class="content-grid">
		<form class="panel form" onsubmit={(event) => event.preventDefault()}>
			<div class="field-group">
				<p class="field-label">{household_kind_label()}</p>
				<div class="kind-chip">
					{household_kind_name(household_store.profile.kind)}
				</div>
			</div>

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
			<h2>{household_store.profile.name}</h2>
			<p>{m.household_subtitle()}</p>
			<div class="summary-list">
				<div>
					<span>{household_kind_label()}</span>
					<strong>{household_kind_name(household_store.profile.kind)}</strong>
				</div>
				<div>
					<span>{m.household_default_servings_label()}</span>
					<strong>{household_store.profile.default_servings}</strong>
				</div>
				<div>
					<span>{m.household_dietary_preferences_label()}</span>
					<strong
						>{household_store.profile.dietary_preferences?.join(", ") ||
							"—"}</strong
					>
				</div>
				<div>
					<span>{m.household_disliked_ingredients_label()}</span>
					<strong
						>{household_store.profile.disliked_ingredients?.join(", ") ||
							"—"}</strong
					>
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
		border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--primary) 16%, var(--surface-strong)),
			color-mix(in srgb, var(--secondary) 14%, var(--surface-muted))
		);
		box-shadow: inset 0 1px 0 color-mix(in srgb, var(--white) 6%, transparent);

		span {
			font-size: 0.8125rem;
			color: var(--text-muted);
		}

		strong {
			color: var(--text);
		}

		small {
			color: var(--text-muted);
		}
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;

		p {
			color: var(--text-muted);
		}
	}

	.households-panel {
		display: grid;
		gap: 1rem;
	}

	.household-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.household-list {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: 1fr;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.household-card {
		position: relative;
		border-radius: 18px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 98%, transparent);

		&.active {
			border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
			background-color: color-mix(in srgb, var(--primary) 8%, var(--surface));
		}
	}

	.household-card__select {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		width: 100%;
		text-align: left;
		padding: 1rem 3.25rem 1rem 1rem;
		background: transparent;
		border: 0;
		cursor: pointer;

		span {
			display: block;
			color: var(--text-muted);
			font-size: 0.8125rem;
		}
	}

	.household-card__delete {
		position: absolute;
		top: 0.45rem;
		right: 0.45rem;
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--error) 35%, var(--border));
		background-color: color-mix(in srgb, var(--error) 10%, var(--surface));
		color: var(--error);
		cursor: pointer;
		transition:
			background-color 160ms ease,
			transform 160ms ease,
			border-color 160ms ease;

		&:hover {
			background-color: color-mix(in srgb, var(--error) 16%, var(--surface));
			border-color: color-mix(in srgb, var(--error) 48%, var(--border));
		}

		&:focus-visible {
			outline: 2px solid color-mix(in srgb, var(--error) 50%, transparent);
			outline-offset: 2px;
		}

		:global(svg) {
			width: 1rem;
			height: 1rem;
		}
	}

	.household-card__meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.modal-highlight {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: fit-content;
		margin-inline: auto;
		padding: 0.55rem 0.85rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--error) 22%, var(--border));
		background-color: color-mix(in srgb, var(--error) 10%, var(--surface));
		text-align: center;
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

	.kind-chip {
		display: inline-flex;
		align-items: center;
		width: fit-content;
		padding: 0.55rem 0.85rem;
		border-radius: 999px;
		background-color: color-mix(in srgb, var(--secondary) 16%, var(--surface));
		border: 1px solid color-mix(in srgb, var(--secondary) 28%, var(--border));
		font-weight: 600;
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
