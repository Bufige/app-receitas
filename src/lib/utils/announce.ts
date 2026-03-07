import { browser } from "$app/environment";

/**
 * Announces a message to screen readers via the live region.
 * The #announcer element is defined in +layout.svelte.
 */
export function announce(message: string): void {
	if (!browser) return;

	const announcer = document.getElementById("announcer");
	if (announcer) {
		announcer.textContent = "";
		// Force reflow so the screen reader re-reads the region
		void announcer.offsetHeight;
		announcer.textContent = message;
	}
}
