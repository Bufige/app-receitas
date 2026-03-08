import { browser } from "$app/environment";

const STORAGE_KEY = "magic_link_cooldown";
const COOLDOWN_SECONDS = 60;

let remainingSeconds = $state(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

function getStoredExpiry(): number {
	if (!browser) return 0;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return 0;
	return Number.parseInt(stored, 10) || 0;
}

function syncFromStorage() {
	const expiry = getStoredExpiry();
	const now = Date.now();
	if (expiry > now) {
		remainingSeconds = Math.ceil((expiry - now) / 1000);
		startTick();
	} else {
		remainingSeconds = 0;
		localStorage.removeItem(STORAGE_KEY);
	}
}

function startTick() {
	stopTick();
	intervalId = setInterval(() => {
		const expiry = getStoredExpiry();
		const now = Date.now();
		if (expiry > now) {
			remainingSeconds = Math.ceil((expiry - now) / 1000);
		} else {
			remainingSeconds = 0;
			localStorage.removeItem(STORAGE_KEY);
			stopTick();
		}
	}, 1000);
}

function stopTick() {
	if (intervalId !== null) {
		clearInterval(intervalId);
		intervalId = null;
	}
}

function startCooldown() {
	if (!browser) return;
	const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
	localStorage.setItem(STORAGE_KEY, String(expiry));
	remainingSeconds = COOLDOWN_SECONDS;
	startTick();
}

export function useMagicLinkCooldown() {
	if (browser) {
		syncFromStorage();
	}

	return {
		get remaining() {
			return remainingSeconds;
		},
		get isOnCooldown() {
			return remainingSeconds > 0;
		},
		start: startCooldown,
	};
}
