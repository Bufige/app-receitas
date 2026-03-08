<script lang="ts">
	import Icon from "@iconify/svelte";
	import imageIcon from "@iconify-icons/mdi/image-outline";
	import videoIcon from "@iconify-icons/mdi/video-outline";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";

	const draft = useMemorialDraft();

	const speciesLabels: Record<string, () => string> = {
		dog: () => m.memorial_species_dog(),
		cat: () => m.memorial_species_cat(),
		bird: () => m.memorial_species_bird(),
		rabbit: () => m.memorial_species_rabbit(),
		other: () => m.memorial_species_other(),
	};

	const sexLabels: Record<string, () => string> = {
		male: () => m.memorial_sex_male(),
		female: () => m.memorial_sex_female(),
	};

	function getPreviewUrl(id: string): string | null {
		const file = draft.getFile(id);
		if (!file) return null;
		return URL.createObjectURL(file);
	}

	function isVideo(file_type: string): boolean {
		return file_type.startsWith("video/");
	}
</script>

<div class="step-preview">
	<h2 class="preview-heading">{m.memorial_preview_title()}</h2>

	<!-- Pet Details Section -->
	<section class="preview-section">
		<div class="section-header">
			<h3 class="section-title">{m.memorial_preview_pet_section()}</h3>
			<a href={localizeHref("/create/step-1")} class="edit-link">
				{m.memorial_preview_edit()}
			</a>
		</div>
		<dl class="details-list">
			<div class="detail-row">
				<dt>{m.memorial_pet_name_label()}</dt>
				<dd>{draft.petDetails.name || "—"}</dd>
			</div>
			<div class="detail-row">
				<dt>{m.memorial_species_label()}</dt>
				<dd>
					{draft.petDetails.species
						? (speciesLabels[draft.petDetails.species]?.() ??
							draft.petDetails.species)
						: "—"}
				</dd>
			</div>
			{#if draft.petDetails.sex}
				<div class="detail-row">
					<dt>{m.memorial_sex_label()}</dt>
					<dd>{sexLabels[draft.petDetails.sex]?.() ?? draft.petDetails.sex}</dd>
				</div>
			{/if}
			{#if draft.petDetails.birth_date}
				<div class="detail-row">
					<dt>{m.memorial_birth_date_label()}</dt>
					<dd>{draft.petDetails.birth_date}</dd>
				</div>
			{/if}
			{#if draft.petDetails.passing_date}
				<div class="detail-row">
					<dt>{m.memorial_passing_date_label()}</dt>
					<dd>{draft.petDetails.passing_date}</dd>
				</div>
			{/if}
		</dl>
	</section>

	<!-- Media Section -->
	<section class="preview-section">
		<div class="section-header">
			<h3 class="section-title">{m.memorial_preview_media_section()}</h3>
			<a href={localizeHref("/create/step-2")} class="edit-link">
				{m.memorial_preview_edit()}
			</a>
		</div>
		{#if draft.media.length > 0}
			<div class="media-grid">
				{#each draft.media as item (item.id)}
					{@const previewUrl = getPreviewUrl(item.id)}
					<div class="media-thumb">
						{#if previewUrl && !isVideo(item.file_type)}
							<img
								src={previewUrl}
								alt={item.file_name}
								class="thumb-image"
								loading="lazy"
							/>
						{:else if isVideo(item.file_type)}
							<div class="thumb-placeholder">
								<Icon icon={videoIcon} width="1.5em" height="1.5em" />
							</div>
						{:else}
							<div class="thumb-placeholder">
								<Icon icon={imageIcon} width="1.5em" height="1.5em" />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-text">{m.memorial_preview_no_media()}</p>
		{/if}
	</section>

	<!-- Tribute Section -->
	<section class="preview-section">
		<div class="section-header">
			<h3 class="section-title">{m.memorial_preview_tribute_section()}</h3>
			<a href={localizeHref("/create/step-3")} class="edit-link">
				{m.memorial_preview_edit()}
			</a>
		</div>
		{#if draft.tribute.message}
			<p class="tribute-text">{draft.tribute.message}</p>
		{:else}
			<p class="empty-text">{m.memorial_preview_no_tribute()}</p>
		{/if}
	</section>
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.step-preview {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.preview-heading {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.preview-section {
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.edit-link {
		font-size: 0.8125rem;
		color: var(--primary);
		font-weight: 600;
		transition: color 0.2s;

		&:hover {
			color: var(--primary-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}
	}

	.details-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.detail-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;

		dt {
			color: var(--text-muted);
			min-width: 120px;
			flex-shrink: 0;

			&::after {
				content: ":";
			}
		}

		dd {
			color: var(--text);
		}
	}

	.media-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;

		@include sm {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	.media-thumb {
		aspect-ratio: 1;
		border-radius: 4px;
		overflow: hidden;
		background-color: color-mix(in srgb, var(--surface) 80%, var(--border));
	}

	.thumb-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
	}

	.empty-text {
		font-size: 0.8125rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.tribute-text {
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}
</style>
