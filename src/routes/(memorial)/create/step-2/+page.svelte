<script lang="ts">
	import FileUpload from "$lib/components/ui/FileUpload/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";

	const draft = useMemorialDraft();

	function handleAddFiles(files: File[]) {
		for (const file of files) {
			draft.addMedia(file);
		}
	}

	function handleRemoveFile(id: string) {
		draft.removeMedia(id);
	}

	const hasLostFiles = $derived(
		draft.media.length > 0 && !draft.getFile(draft.media[0].id),
	);
</script>

<div class="step-media">
	{#if hasLostFiles}
		<p class="reselect-notice" role="alert">
			{m.memorial_upload_reselect()}
		</p>
	{/if}

	<FileUpload
		files={draft.media}
		getFile={(id) => draft.getFile(id)}
		maxFiles={draft.maxMedia}
		onaddfiles={handleAddFiles}
		onremovefile={handleRemoveFile}
	/>
</div>

<style lang="scss">
	.step-media {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.reselect-notice {
		font-size: 0.8125rem;
		color: var(--warning);
		background-color: color-mix(in srgb, var(--warning) 10%, var(--surface));
		border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
		padding: 0.75rem;
		border-radius: 6px;
	}
</style>
