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

export function useThemeStore() {
	return {
		get current() {
			return current;
		},
		set: applyTheme,
		init: initTheme,
		toggle() {
			applyTheme(current === "dark" ? "light" : "dark");
		},
	};
}
