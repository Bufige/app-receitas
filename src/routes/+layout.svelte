<script lang="ts">
	import { browser } from "$app/environment";
	import "$lib/assets/styles/global.scss";
	import bgDay from "$lib/assets/background-day.webp";
	import bgNight from "$lib/assets/background-night.webp";
	import Footer from "$lib/components/layout/Footer/index.svelte";
	import Header from "$lib/components/layout/Header/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

	let { children } = $props();

	const theme = useThemeStore();

	const bgImage = $derived(theme.current === "dark" ? bgNight : bgDay);

	if (browser) {
		theme.init();
	}

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { enabled: browser, staleTime: 1000 * 60 * 5, retry: 1 },
		},
	});
</script>

<a class="skip-link" href="#main-content">{m.a11y_skip_to_content()}</a>

<div class="app">
	<Header />
	<main
		id="main-content"
		class="container"
		style:background-image="url({bgImage})"
	>
		<QueryClientProvider client={queryClient}>
			{@render children()}
		</QueryClientProvider>
	</main>
	<Footer />
</div>

<div aria-live="polite" aria-atomic="true" class="sr-only" id="announcer"></div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.skip-link {
		position: absolute;
		top: -100%;
		left: 1rem;
		padding: 0.5rem 1rem;
		background-color: var(--primary);
		color: var(--black);
		border-radius: 0 0 6px 6px;
		font-weight: 600;
		z-index: 1000;

		&:focus {
			top: 0;
		}
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		flex: 1;
		background-color: var(--bg-overlay);
		background-size: cover;
		background-position: var(--bg-offset) 10%;
		background-repeat: no-repeat;
		background-blend-mode: overlay;

		@include md {
			background-position: center;
		}
	}
</style>
