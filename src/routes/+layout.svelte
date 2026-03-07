<script lang="ts">
	import { browser } from "$app/environment";
	import favicon from "$lib/assets/favicon.svg?url";
	import "$lib/assets/styles/global.scss";
	import Footer from "$lib/components/layout/Footer/index.svelte";
	import Header from "$lib/components/layout/Header/index.svelte";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

	let { children } = $props();

	const theme = useThemeStore();

	if (browser) {
		theme.init();
	}

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { enabled: browser, staleTime: 1000 * 60 * 5, retry: 1 },
		},
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="app">
	<Header />
	<main class="container">
		<QueryClientProvider client={queryClient}>
			{@render children()}
		</QueryClientProvider>
	</main>
	<Footer />
</div>

<style lang="scss">
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		flex: 1;
	}
</style>
