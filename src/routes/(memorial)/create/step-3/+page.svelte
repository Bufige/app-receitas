<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";

	const draft = useMemorialDraft();

	function handleMessageInput(e: Event) {
		const value = (e.target as HTMLTextAreaElement).value;
		draft.updateTribute({ message: value });
	}

	const charCount = $derived(draft.tribute.message.length);
</script>

<div class="step-tribute">
	<div class="field">
		<label class="label" for="tribute-message">
			{m.memorial_tribute_label()}
		</label>
		<textarea
			id="tribute-message"
			class="textarea"
			placeholder={m.memorial_tribute_placeholder()}
			value={draft.tribute.message}
			oninput={handleMessageInput}
			rows={6}
		></textarea>
		<span class="char-count">
			{m.memorial_tribute_chars({ count: String(charCount) })}
		</span>
	</div>
</div>

<style lang="scss">
	.step-tribute {
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

	.textarea {
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

		&::placeholder {
			color: var(--placeholder);
		}

		&:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
		}
	}

	.textarea {
		resize: vertical;
		min-height: 120px;
		line-height: 1.5;
	}

	.char-count {
		font-size: 0.75rem;
		color: var(--text-muted);
		align-self: flex-end;
	}
</style>
