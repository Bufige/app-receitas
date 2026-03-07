<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/assets/styles/global.scss';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { enabled: browser, staleTime: 1000 * 60 * 5, retry: 1 }
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>


<div>
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })} data-sveltekit-reload>{locale}</a>
	{/each}
</div>


<QueryClientProvider client={queryClient}>{@render children()}</QueryClientProvider>
