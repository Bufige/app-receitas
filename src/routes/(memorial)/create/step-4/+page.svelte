<script lang="ts">
	import { goto } from "$app/navigation";
	import Button from "@components/ui/Button/index.svelte";
	import Icon from "@iconify/svelte";
	import imageIcon from "@iconify-icons/mdi/image-outline";
	import videoIcon from "@iconify-icons/mdi/video-outline";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useAnonymousSession } from "$lib/stores/anonymous-session.svelte";
	import { useAuthStore } from "$lib/stores/auth.svelte";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";
	import { memorialApi } from "$lib/api/memorial";

	const draft = useMemorialDraft();
	const auth = useAuthStore();
	const anonSession = useAnonymousSession();

	let uploading = $state(false);
	let uploadProgress = $state({ current: 0, total: 0 });
	let error = $state("");

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
		unknown: () => m.memorial_sex_unknown(),
	};

	function getPreviewUrl(id: string): string | null {
		const file = draft.getFile(id);
		if (!file) return null;
		return URL.createObjectURL(file);
	}

	function isVideo(fileType: string): boolean {
		return fileType.startsWith("video/");
	}

	async function handleSubmit() {
		error = "";
		uploading = true;

		try {
			// 1. Upload all media files in sequence
			const mediaRefs: { id: string; url: string; thumbnailUrl: string }[] = [];
			const filesToUpload = draft.media
				.map((item) => ({ item, file: draft.getFile(item.id) }))
				.filter(
					(entry): entry is { item: typeof entry.item; file: File } =>
						entry.file !== undefined,
				);

			uploadProgress = { current: 0, total: filesToUpload.length };

			for (const { file } of filesToUpload) {
				const result = await memorialApi.uploadMedia(file);
				mediaRefs.push(result.data);
				uploadProgress = {
					current: uploadProgress.current + 1,
					total: uploadProgress.total,
				};
			}

			// 2. Create the memorial
			const result = await memorialApi.create({
				petDetails: draft.petDetails,
				media: draft.media,
				tribute: draft.tribute,
			});

			// 3. Clean up draft
			draft.reset();

			// 4. Redirect based on auth state
			const memorialId = result.data.id;
			if (auth.isAuthenticated) {
				goto(localizeHref(`/memorial/${memorialId}`));
			} else {
				goto(
					localizeHref(
						`/register?returnTo=${encodeURIComponent(`/memorial/${memorialId}`)}`,
					),
				);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Something went wrong";
		} finally {
			uploading = false;
		}
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
			{#if draft.petDetails.birthDate}
				<div class="detail-row">
					<dt>{m.memorial_birth_date_label()}</dt>
					<dd>{draft.petDetails.birthDate}</dd>
				</div>
			{/if}
			{#if draft.petDetails.passingDate}
				<div class="detail-row">
					<dt>{m.memorial_passing_date_label()}</dt>
					<dd>{draft.petDetails.passingDate}</dd>
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
						{#if previewUrl && !isVideo(item.fileType)}
							<img
								src={previewUrl}
								alt={item.fileName}
								class="thumb-image"
								loading="lazy"
							/>
						{:else if isVideo(item.fileType)}
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

	<!-- Upload Progress -->
	{#if uploading}
		<div class="upload-status" role="status" aria-live="polite">
			<p>
				{m.memorial_uploading({
					current: String(uploadProgress.current),
					total: String(uploadProgress.total),
				})}
			</p>
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<p class="error-message" role="alert">{error}</p>
	{/if}

	<!-- Submit -->
	<div class="submit-area">
		<Button
			variant="primary"
			size="large"
			loading={uploading}
			onclick={handleSubmit}
			disabled={!draft.isStep1Valid}
		>
			{auth.isAuthenticated
				? m.memorial_submit_authenticated()
				: m.memorial_submit_anonymous()}
		</Button>
	</div>
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

	.upload-status {
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-muted);
		padding: 0.75rem;
		background-color: color-mix(in srgb, var(--primary) 8%, var(--surface));
		border-radius: 6px;
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--error);
		text-align: center;
	}

	.submit-area {
		display: flex;
		justify-content: center;
		padding-top: 0.5rem;
	}
</style>
