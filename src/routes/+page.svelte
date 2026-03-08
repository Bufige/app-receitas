<script lang="ts">
	import { goto } from "$app/navigation";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Button from "@components/ui/Button/index.svelte";

	function startMemorial() {
		goto(localizeHref("/create/step-1"));
	}
</script>

<SEO title={m.seo_home_title()} description={m.seo_home_description()} />
<div class="content">
	<h1 class="title">
		{m.home_content_title()}
		<span class="highlight">{m.home_content_title_highlight()}</span>
		{m.home_content_title_suffix()}
	</h1>
	<p class="description">{m.home_content_description()}</p>
	<div class="actions">
		<Button
			variant="primary"
			size="large"
			onclick={startMemorial}
			loading={false}
			round={true}
		>
			{m.home_cta()}
		</Button>
	</div>
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem;
		text-align: center;
		flex: 1;

		@include md {
			gap: 1rem;
		}
	}
	.title {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;

		@include md {
			font-size: 3rem;
		}
	}

	.highlight {
		color: var(--primary);
		font-weight: 800;
	}
	.description {
		font-size: 0.9rem;
		color: var(--text-muted);
		@include md {
			font-size: 1.25rem;
		}
	}

	.actions {
		margin-top: auto;
		width: 100%;
		max-width: 400px;

		@include md {
			margin-top: 5%;
		}
	}
</style>
