const STORAGE_KEY = "theme";
type Theme = "light" | "dark" | (string & {});

let current = $state<Theme>("light");

function applyTheme(theme: Theme) {
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem(STORAGE_KEY, theme);
	}
	current = theme;
}

function initTheme() {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		applyTheme(stored);
		return;
	}

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	applyTheme(prefersDark ? "dark" : "light");
}

function toggleWithTransition(x: number, y: number) {
	const nextTheme = current === "dark" ? "light" : "dark";

	// Fallback: no View Transitions API or reduced motion preference
	if (
		!document.startViewTransition ||
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		applyTheme(nextTheme);
		return;
	}

	// Set the origin point for the circle animation
	document.documentElement.style.setProperty("--transition-x", `${x}px`);
	document.documentElement.style.setProperty("--transition-y", `${y}px`);

	const transition = document.startViewTransition(() => {
		applyTheme(nextTheme);
	});

	transition.finished.then(() => {
		document.documentElement.style.removeProperty("--transition-x");
		document.documentElement.style.removeProperty("--transition-y");
	});
}

export function useThemeStore() {
	return {
		get current() {
			return current;
		},
		set: applyTheme,
		init: initTheme,
		toggle(x?: number, y?: number) {
			if (x !== undefined && y !== undefined) {
				toggleWithTransition(x, y);
			} else {
				applyTheme(current === "dark" ? "light" : "dark");
			}
		},
	};
}
