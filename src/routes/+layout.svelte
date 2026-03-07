<script lang="ts">
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import favicon from "$lib/assets/favicon.svg?url";
	import "$lib/assets/styles/global.scss";
	import Header from "$lib/components/layout/Header/index.svelte";
	import { locales, localizeHref } from "$lib/paraglide/runtime";
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
<Header />

<div>
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })} data-sveltekit-reload
			>{locale}</a
		>
	{/each}
</div>

<QueryClientProvider client={queryClient}
	>{@render children()}</QueryClientProvider
>
