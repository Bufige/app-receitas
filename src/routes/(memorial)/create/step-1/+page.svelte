<script lang="ts">
	import Input from "$lib/components/ui/Input/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";
	import type { PetSpecies, PetSex } from "$lib/types/memorial";

	const draft = useMemorialDraft();

	const speciesOptions: { value: PetSpecies; label: () => string }[] = [
		{ value: "dog", label: () => m.memorial_species_dog() },
		{ value: "cat", label: () => m.memorial_species_cat() },
		{ value: "bird", label: () => m.memorial_species_bird() },
		{ value: "rabbit", label: () => m.memorial_species_rabbit() },
		{ value: "other", label: () => m.memorial_species_other() },
	];

	const sexOptions: { value: PetSex; label: () => string }[] = [
		{ value: "male", label: () => m.memorial_sex_male() },
		{ value: "female", label: () => m.memorial_sex_female() },
	];

	function handleNameInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		draft.updatePetDetails({ name: value });
	}

	function selectSpecies(value: PetSpecies) {
		const newValue = draft.petDetails.species === value ? "" : value;
		draft.updatePetDetails({ species: newValue as PetSpecies });
	}

	function selectSex(value: PetSex) {
		const newValue = draft.petDetails.sex === value ? "" : value;
		draft.updatePetDetails({ sex: newValue as PetSex });
	}

	function handleBirthDateInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		draft.updatePetDetails({ birthDate: value });
	}

	function handlePassingDateInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		draft.updatePetDetails({ passingDate: value });
	}
</script>

<div class="step-details">
	<Input
		id="pet-name"
		label={m.memorial_pet_name_label()}
		placeholder={m.memorial_pet_name_placeholder()}
		value={draft.petDetails.name}
		required
		oninput={handleNameInput}
	/>

	<div class="field">
		<span class="label">{m.memorial_species_label()}</span>
		<div
			class="pill-group"
			role="radiogroup"
			aria-label={m.memorial_species_label()}
		>
			{#each speciesOptions as opt}
				<button
					type="button"
					class="pill"
					class:selected={draft.petDetails.species === opt.value}
					role="radio"
					aria-checked={draft.petDetails.species === opt.value}
					onclick={() => selectSpecies(opt.value)}
				>
					{opt.label()}
				</button>
			{/each}
		</div>
	</div>

	<div class="field">
		<span class="label">{m.memorial_sex_label()}</span>
		<div
			class="pill-group"
			role="radiogroup"
			aria-label={m.memorial_sex_label()}
		>
			{#each sexOptions as opt}
				<button
					type="button"
					class="pill"
					class:selected={draft.petDetails.sex === opt.value}
					role="radio"
					aria-checked={draft.petDetails.sex === opt.value}
					onclick={() => selectSex(opt.value)}
				>
					{opt.label()}
				</button>
			{/each}
		</div>
	</div>

	<div class="field">
		<label class="label" for="pet-birth-date">
			{m.memorial_birth_date_label()}
		</label>
		<input
			id="pet-birth-date"
			type="date"
			class="date-input"
			value={draft.petDetails.birthDate}
			onchange={handleBirthDateInput}
		/>
	</div>

	<div class="field">
		<label class="label" for="pet-passing-date">
			{m.memorial_passing_date_label()}
		</label>
		<input
			id="pet-passing-date"
			type="date"
			class="date-input"
			value={draft.petDetails.passingDate}
			onchange={handlePassingDateInput}
		/>
	</div>
</div>

<style lang="scss">
	.step-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text);
	}

	.date-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
		background-color: color-mix(in srgb, var(--surface) 45%, transparent);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		appearance: none;

		&:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
		}
	}

	// ── Pill buttons (species & sex) ──
	.pill-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pill {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		background-color: color-mix(in srgb, var(--surface) 45%, transparent);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			border-color 0.2s,
			color 0.2s,
			background-color 0.2s;

		&:hover {
			border-color: var(--primary);
			color: var(--text);
		}

		&:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}

		&.selected {
			border-color: var(--primary);
			background-color: color-mix(in srgb, var(--primary) 50%, transparent);
			// color: var(--primary);
		}
	}
</style>
