import { browser } from "$app/environment";

const STORAGE_KEY = "anon_session_id";

let sessionId = $state<string>("");

function getOrCreateSessionId(): string {
	if (!browser) return "";

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) return stored;

	const id = crypto.randomUUID();
	localStorage.setItem(STORAGE_KEY, id);
	return id;
}

export function useAnonymousSession() {
	if (browser && !sessionId) {
		sessionId = getOrCreateSessionId();
	}

	return {
		get sessionId() {
			return sessionId;
		},
		clear() {
			sessionId = "";
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
	};
}
