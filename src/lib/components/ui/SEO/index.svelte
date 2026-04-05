<script lang="ts">
	import { page } from "$app/state";
	import { getLocale } from "$lib/paraglide/runtime";

	interface Props {
		title: string;
		description: string;
		ogImage?: string;
		noindex?: boolean;
		type?: "website" | "article";
	}

	const {
		title,
		description,
		ogImage,
		noindex = false,
		type = "website",
	}: Props = $props();

	const siteName = "SuaReceita";
	const fullTitle = $derived(`${title} | ${siteName}`);
	const canonicalUrl = $derived(page.url.href);
	const locale = $derived(getLocale() === "pt-br" ? "pt_BR" : "en_US");
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content={locale} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:alt" content={title} />
	{/if}

	<!-- Twitter -->
	<meta
		name="twitter:card"
		content={ogImage ? "summary_large_image" : "summary"}
	/>
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>
