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
		{ value: "unknown", label: () => m.memorial_sex_unknown() },
	];

	function handleNameInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		draft.updatePetDetails({ name: value });
	}

	function handleSpeciesChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as PetSpecies;
		draft.updatePetDetails({ species: value });
	}

	function handleSexChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as PetSex;
		draft.updatePetDetails({ sex: value });
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
		<label class="label" for="pet-species">{m.memorial_species_label()}</label>
		<select
			id="pet-species"
			class="select"
			value={draft.petDetails.species}
			onchange={handleSpeciesChange}
			required
		>
			<option value="" disabled>—</option>
			{#each speciesOptions as opt}
				<option value={opt.value}>{opt.label()}</option>
			{/each}
		</select>
	</div>

	<div class="field">
		<label class="label" for="pet-sex">{m.memorial_sex_label()}</label>
		<select
			id="pet-sex"
			class="select"
			value={draft.petDetails.sex}
			onchange={handleSexChange}
		>
			<option value="">—</option>
			{#each sexOptions as opt}
				<option value={opt.value}>{opt.label()}</option>
			{/each}
		</select>
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

	.select,
	.date-input {
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
		appearance: none;

		&:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
		}
	}

	.select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e6e' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.25rem;
	}
</style>
