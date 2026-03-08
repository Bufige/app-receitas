<script lang="ts">
	import Icon from "@iconify/svelte";
	import uploadIcon from "@iconify-icons/mdi/cloud-upload-outline";
	import closeIcon from "@iconify-icons/mdi/close-circle";
	import videoIcon from "@iconify-icons/mdi/video-outline";
	import * as m from "$lib/paraglide/messages.js";

	interface FileUploadProps {
		files: {
			id: string;
			file_name: string;
			file_size: number;
			file_type: string;
		}[];
		getFile: (id: string) => File | undefined;
		maxFiles: number;
		onaddfiles: (files: File[]) => void;
		onremovefile: (id: string) => void;
	}

	let { files, getFile, maxFiles, onaddfiles, onremovefile }: FileUploadProps =
		$props();

	let dragOver = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);

	const acceptedTypes = "image/*,video/*";

	// Deterministic positions for floating photos based on index
	const positions = [
		{ x: 8, y: 10, rot: -12, delay: 0 },
		{ x: 72, y: 5, rot: 8, delay: 0.5 },
		{ x: 15, y: 55, rot: 6, delay: 1.2 },
		{ x: 65, y: 60, rot: -9, delay: 0.8 },
		{ x: 40, y: 8, rot: 4, delay: 1.5 },
		{ x: 5, y: 35, rot: -7, delay: 0.3 },
		{ x: 78, y: 35, rot: 10, delay: 1.0 },
		{ x: 35, y: 62, rot: -5, delay: 1.8 },
		{ x: 55, y: 15, rot: 11, delay: 0.6 },
		{ x: 25, y: 30, rot: -8, delay: 1.4 },
		{ x: 60, y: 42, rot: 6, delay: 0.2 },
		{ x: 45, y: 50, rot: -10, delay: 1.1 },
		{ x: 10, y: 70, rot: 7, delay: 0.9 },
		{ x: 80, y: 55, rot: -4, delay: 1.6 },
		{ x: 50, y: 30, rot: 9, delay: 0.4 },
		{ x: 20, y: 15, rot: -11, delay: 1.3 },
		{ x: 70, y: 70, rot: 5, delay: 0.7 },
		{ x: 30, y: 45, rot: -6, delay: 1.7 },
		{ x: 85, y: 20, rot: 8, delay: 1.9 },
		{ x: 55, y: 75, rot: -3, delay: 0.1 },
	];

	// Derive a stable index from the photo ID so position survives remounts
	function hashId(id: string): number {
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			hash = (hash * 31 + id.charCodeAt(i)) | 0;
		}
		return Math.abs(hash) % positions.length;
	}

	function getPhotoStyle(id: string): string {
		const pos = positions[hashId(id)];
		return `left: ${pos.x}%; top: ${pos.y}%; --rot: ${pos.rot}deg; animation-delay: ${pos.delay}s;`;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		const droppedFiles = event.dataTransfer?.files;
		if (droppedFiles) {
			processFiles(Array.from(droppedFiles));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			processFiles(Array.from(target.files));
			target.value = "";
		}
	}

	function processFiles(newFiles: File[]) {
		const valid = newFiles.filter(
			(f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
		);
		const remaining = maxFiles - files.length;
		const toAdd = valid.slice(0, remaining);
		if (toAdd.length > 0) {
			onaddfiles(toAdd);
		}
	}

	function openPicker() {
		inputRef?.click();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openPicker();
		}
	}

	function getPreviewUrl(id: string): string | null {
		const file = getFile(id);
		if (!file) return null;
		return URL.createObjectURL(file);
	}

	function isVideo(file_type: string): boolean {
		return file_type.startsWith("video/");
	}
</script>

<div class="file-upload">
	<div
		class="drop-zone"
		class:drag-over={dragOver}
		class:has-photos={files.length > 0}
		role="button"
		tabindex="0"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onclick={openPicker}
		onkeydown={handleKeydown}
		aria-label={m.memorial_upload_prompt()}
	>
		<input
			bind:this={inputRef}
			type="file"
			accept={acceptedTypes}
			multiple
			class="hidden-input"
			onchange={handleInputChange}
			tabindex={-1}
			aria-hidden="true"
		/>

		<!-- Floating photo overlays -->
		{#if files.length > 0}
			<div class="photo-overlay" aria-hidden="true">
				{#each files as item, i (item.id)}
					{@const previewUrl = getPreviewUrl(item.id)}
					<div class="floating-photo" style={getPhotoStyle(item.id)}>
						{#if previewUrl && !isVideo(item.file_type)}
							<img
								src={previewUrl}
								alt=""
								class="floating-image"
								loading="lazy"
							/>
						{:else if previewUrl && isVideo(item.file_type)}
							<video
								src={previewUrl}
								class="floating-video"
								muted
								autoplay
								loop
								playsinline
								preload="metadata"
							></video>
						{:else}
							<div class="floating-placeholder">
								<Icon icon={videoIcon} width="1.25em" height="1.25em" />
							</div>
						{/if}
						<button
							type="button"
							class="floating-remove"
							onclick={(e) => {
								e.stopPropagation();
								onremovefile(item.id);
							}}
							aria-label="{m.memorial_upload_remove()} {item.file_name}"
						>
							<Icon icon={closeIcon} width="1em" height="1em" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Upload prompt (always visible, centered) -->
		<div class="prompt" class:faded={files.length > 0}>
			<span class="upload-icon" aria-hidden="true">
				<Icon icon={uploadIcon} width="2em" height="2em" />
			</span>
			<span class="upload-text">{m.memorial_upload_prompt()}</span>
			<span class="upload-limit">
				{m.memorial_upload_limit({ max: String(maxFiles) })} · {files.length}/{maxFiles}
			</span>
		</div>
	</div>
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.file-upload {
		width: 100%;
	}

	.drop-zone {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 240px;
		border: 2px dashed var(--border);
		border-radius: 12px;
		background-color: var(--surface);
		cursor: pointer;
		overflow: hidden;
		transition:
			border-color 0.2s,
			background-color 0.2s;

		&:hover,
		&.drag-over {
			border-color: var(--primary);
			background-color: color-mix(in srgb, var(--primary) 5%, var(--surface));
		}

		&:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}

		@include md {
			min-height: 280px;
		}
	}

	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}

	// ── Floating photos overlay ──
	.photo-overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.floating-photo {
		position: absolute;
		width: 64px;
		height: 64px;
		border-radius: 6px;
		overflow: visible;
		box-shadow: var(--soft-box-shadow);
		border: 2px solid var(--primary);
		transform: rotate(var(--rot, 0deg));
		animation: float 6s ease-in-out infinite alternate;
		pointer-events: auto;
		z-index: 1;
		transition: transform 0.2s;

		&:hover {
			transform: rotate(0deg) scale(1.15);
			z-index: 10;
			box-shadow: var(--box-shadow);
		}

		@include md {
			width: 80px;
			height: 80px;
		}
	}

	.floating-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 4px;
	}

	.floating-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 4px;
	}

	.floating-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: color-mix(in srgb, var(--surface) 90%, var(--border));
		color: var(--text-muted);
		border-radius: 4px;
	}

	.floating-remove {
		position: absolute;
		top: -6px;
		right: -6px;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		color: var(--white);
		padding: 2px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.15s;
		pointer-events: auto;

		.floating-photo:hover & {
			opacity: 1;
		}

		&:focus-visible {
			opacity: 1;
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}

		&:hover {
			background: rgba(0, 0, 0, 0.9);
			color: var(--error);
		}
	}

	// ── Prompt text ──
	.prompt {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		transition: opacity 0.3s;

		&.faded {
			opacity: 0.6;
		}
	}

	.upload-icon {
		color: var(--text-muted);
	}

	.upload-text {
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
	}

	.upload-limit {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	// ── Float animation ──
	@keyframes float {
		0% {
			translate: 0 0;
		}

		25% {
			translate: 3px -5px;
		}

		50% {
			translate: -2px 4px;
		}

		75% {
			translate: 4px 2px;
		}

		100% {
			translate: -3px -3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.floating-photo {
			animation: none;
		}
	}
</style>
