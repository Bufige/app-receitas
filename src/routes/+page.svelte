<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import ButtonGroup from "$lib/components/ui/ButtonGroup/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Button from "@components/ui/Button/index.svelte";
</script>

<SEO title={m.seo_home_title()} description={m.seo_home_description()} />
<div class="content">
	<div class="text-group">
		<h1 class="title">
			{m.home_content_title()}
			<span class="highlight">{m.home_content_title_highlight()}</span>
			{m.home_content_title_suffix()}
		</h1>
		<p class="description">{m.home_content_description()}</p>
	</div>
	<div class="actions">
		<ButtonGroup gap="1rem">
			<a href={localizeHref("/recipes")}>
				<Button variant="primary" size="large" round={true}>
					{m.home_cta()}
				</Button>
			</a>
			<a href={localizeHref("/planner")}>
				<Button variant="outline" size="large" round={true}>
					{m.home_cta_secondary()}
				</Button>
			</a>
		</ButtonGroup>
	</div>
	<div class="features">
		<article class="feature-card">
			<h2>{m.home_feature_recipes_title()}</h2>
			<p>{m.home_feature_recipes_description()}</p>
		</article>
		<article class="feature-card">
			<h2>{m.home_feature_recurrence_title()}</h2>
			<p>{m.home_feature_recurrence_description()}</p>
		</article>
		<article class="feature-card">
			<h2>{m.home_feature_shopping_title()}</h2>
			<p>{m.home_feature_shopping_description()}</p>
		</article>
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

	.text-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin: auto 0;

		@include md {
			gap: 1rem;
			margin: 0;
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
		width: 100%;
		max-width: 42rem;

		@include md {
			margin-top: 1rem;
		}
	}

	.features {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		width: 100%;

		@include md {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			margin-top: 2rem;
		}
	}

	.feature-card {
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 16px;
		background-color: color-mix(in srgb, var(--surface) 92%, transparent);
		box-shadow: var(--soft-box-shadow);

		h2 {
			font-size: 1.05rem;
			margin-bottom: 0.5rem;
		}

		p {
			color: var(--text-muted);
			font-size: 0.9rem;
		}
	}
</style>
