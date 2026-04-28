import type { Action } from "svelte/action";

type IntersectParameters = {
	enabled?: boolean;
	root?: Element | Document | null;
	rootMargin?: string;
	threshold?: number | number[];
	onIntersect?: (entry: IntersectionObserverEntry) => void;
	onLeave?: (entry: IntersectionObserverEntry) => void;
	once?: boolean;
};

export const intersect: Action<HTMLElement, IntersectParameters> = (
	node,
	parameters = {},
) => {
	let observer: IntersectionObserver | null = null;
	let current_parameters = parameters;

	function disconnect() {
		observer?.disconnect();
		observer = null;
	}

	function connect() {
		disconnect();

		if (current_parameters.enabled === false) {
			return;
		}

		if (typeof IntersectionObserver === "undefined") {
			return;
		}

		observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];

				if (!entry) {
					return;
				}

				if (entry.isIntersecting) {
					current_parameters.onIntersect?.(entry);

					if (current_parameters.once) {
						observer?.unobserve(node);
					}

					return;
				}

				current_parameters.onLeave?.(entry);
			},
			{
				root: current_parameters.root ?? null,
				rootMargin: current_parameters.rootMargin ?? "0px",
				threshold: current_parameters.threshold ?? 0,
			},
		);

		observer.observe(node);
	}

	connect();

	return {
		update(next_parameters = {}) {
			current_parameters = next_parameters;
			connect();
		},
		destroy() {
			disconnect();
		},
	};
};
