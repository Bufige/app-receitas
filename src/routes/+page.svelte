<script lang="ts">
	import Icon from "@iconify/svelte";
	import bowlMixOutline from "@iconify-icons/mdi/bowl-mix-outline";
	import calendarRefreshOutline from "@iconify-icons/mdi/calendar-refresh-outline";
	import cartCheck from "@iconify-icons/mdi/cart-check";
	import clockOutline from "@iconify-icons/mdi/clock-outline";
	import frigeOutline from "@iconify-icons/mdi/fridge-outline";
	import silverwareForkKnife from "@iconify-icons/mdi/silverware-fork-knife";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { mock_recipes } from "$lib/mocks/recipes";
	import { get_recipe_tag_label } from "$lib/utils/recipe-tags";
	import ButtonGroup from "$lib/components/ui/ButtonGroup/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Button from "$lib/components/ui/Button/index.svelte";

	const hero_recipe = mock_recipes[1] ?? mock_recipes[0];
	const support_recipe = mock_recipes[0] ?? mock_recipes[1];
	const comfort_recipe = mock_recipes[2] ?? mock_recipes[0];

	const preview_plan_icons = [
		silverwareForkKnife,
		calendarRefreshOutline,
		bowlMixOutline,
	] as const;
	const shopping_preview_icons = [
		cartCheck,
		frigeOutline,
		clockOutline,
	] as const;
</script>

<SEO title={m.seo_home_title()} description={m.seo_home_description()} />
<section class="hero">
	<div class="content">
		<div class="text-group">
			<div class="hero-copy">
				<p class="eyebrow">{m.home_eyebrow()}</p>
				<h1 class="title">
					{m.home_content_title()}
					<span class="highlight">{m.home_content_title_highlight()}</span>
					{m.home_content_title_suffix()}
				</h1>
				<p class="description">{m.home_content_description()}</p>

				<div class="actions">
					<ButtonGroup gap="0.875rem">
						<Button
							href={localizeHref("/recipes")}
							variant="primary"
							size="large"
							round={true}
							class="hero-cta primary-cta"
						>
							{m.home_cta()}
						</Button>
						<Button
							href={localizeHref("/planner")}
							variant="outline"
							size="large"
							round={true}
							class="hero-cta secondary-cta"
						>
							{m.home_cta_secondary()}
						</Button>
					</ButtonGroup>
				</div>
			</div>

			<div class="proof-strip" aria-label={m.home_preview_badge()}>
				<div class="proof-item surface-panel">
					<Icon
						icon={calendarRefreshOutline}
						width="1.1rem"
						height="1.1rem"
						aria-hidden="true"
					/>
					<span>{m.home_proof_recurrence()}</span>
				</div>
				<div class="proof-item surface-panel">
					<Icon
						icon={cartCheck}
						width="1.1rem"
						height="1.1rem"
						aria-hidden="true"
					/>
					<span>{m.home_proof_shopping()}</span>
				</div>
				<div class="proof-item surface-panel">
					<Icon
						icon={silverwareForkKnife}
						width="1.1rem"
						height="1.1rem"
						aria-hidden="true"
					/>
					<span>{m.home_proof_servings()}</span>
				</div>
			</div>
		</div>

		<div class="preview surface-panel">
			<div class="preview-header">
				<p class="preview-badge">{m.home_preview_badge()}</p>
				<h2>{m.home_preview_title()}</h2>
				<p>{m.home_preview_description()}</p>
			</div>

			<div class="preview-grid">
				<article class="recipe-spotlight surface-panel">
					<p class="card-label">{m.home_preview_recipe_label()}</p>
					<img src={hero_recipe.image_url} alt={hero_recipe.name} />
					<div class="recipe-copy">
						<div>
							<h3>{hero_recipe.name}</h3>
							<p>{hero_recipe.description}</p>
						</div>
						<div class="recipe-meta">
							<span>{m.recipes_servings()}: {hero_recipe.servings}</span>
							<span
								>{m.recipes_prep_time()}: {m.recipes_minutes({
									count: hero_recipe.preparation_time_in_minutes,
								})}</span
							>
						</div>
						<div class="tags">
							{#each hero_recipe.tags ?? [] as tag}
								<span class="tag-chip">{get_recipe_tag_label(tag, m)}</span>
							{/each}
						</div>
					</div>
				</article>

				<div class="preview-side">
					<article class="mini-card plan-card surface-panel">
						<div class="mini-header">
							<p class="card-label">{m.home_preview_plan_label()}</p>
							<h3>{m.home_preview_plan_title()}</h3>
						</div>
						<ul>
							<li>
								<Icon
									icon={preview_plan_icons[0]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_plan_day_one()}</span>
							</li>
							<li>
								<Icon
									icon={preview_plan_icons[1]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_plan_day_two()}</span>
							</li>
							<li>
								<Icon
									icon={preview_plan_icons[2]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_plan_day_three()}</span>
							</li>
						</ul>
					</article>

					<article class="mini-card shopping-card surface-panel">
						<div class="mini-header">
							<p class="card-label">{m.home_preview_list_label()}</p>
							<h3>{m.home_preview_list_title()}</h3>
						</div>
						<ul>
							<li>
								<Icon
									icon={shopping_preview_icons[0]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_list_item_one()}</span>
							</li>
							<li>
								<Icon
									icon={shopping_preview_icons[1]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_list_item_two()}</span>
							</li>
							<li>
								<Icon
									icon={shopping_preview_icons[2]}
									width="1rem"
									height="1rem"
									aria-hidden="true"
								/>
								<span>{m.home_preview_list_item_three()}</span>
							</li>
						</ul>
					</article>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="features-section">
	<div class="features">
		<article class="feature-card surface-panel featured">
			<div class="feature-heading">
				<p class="feature-eyebrow">{m.home_feature_recipes_eyebrow()}</p>
				<h2>{m.home_feature_recipes_title()}</h2>
			</div>
			<p>{m.home_feature_recipes_description()}</p>
			<div class="feature-highlight">
				<img src={support_recipe.image_url} alt={support_recipe.name} />
				<div>
					<strong>{support_recipe.name}</strong>
					<span
						>{m.recipes_prep_time()}: {m.recipes_minutes({
							count: support_recipe.preparation_time_in_minutes,
						})}</span
					>
				</div>
			</div>
		</article>

		<article class="feature-card surface-panel">
			<div class="feature-heading">
				<p class="feature-eyebrow">{m.home_feature_recurrence_eyebrow()}</p>
				<h2>{m.home_feature_recurrence_title()}</h2>
			</div>
			<p>{m.home_feature_recurrence_description()}</p>
			<div class="feature-stat">
				<strong>1×</strong>
				<span>{m.home_proof_recurrence()}</span>
			</div>
		</article>

		<article class="feature-card surface-panel">
			<div class="feature-heading">
				<p class="feature-eyebrow">{m.home_feature_shopping_eyebrow()}</p>
				<h2>{m.home_feature_shopping_title()}</h2>
			</div>
			<p>{m.home_feature_shopping_description()}</p>
			<div class="feature-highlight compact">
				<img src={comfort_recipe.image_url} alt={comfort_recipe.name} />
				<div>
					<strong>{comfort_recipe.name}</strong>
					<span>{m.home_preview_list_item_two()}</span>
				</div>
			</div>
		</article>
	</div>
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.hero {
		padding: 1rem;

		@include md {
			padding: 1.25rem 1.5rem 0;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem 0 0;
		flex: 1;

		@include md {
			align-items: stretch;
			grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
			grid-auto-rows: 1fr;
			display: grid;
			gap: 1.5rem;
		}

		@include lg {
			gap: 2rem;
		}
	}

	.text-group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		text-align: left;
		padding: 0;

		@include md {
			justify-content: space-between;
			padding: 0;
			height: 100%;
			min-height: 100%;
		}
	}

	.hero-copy {
		display: grid;
		gap: 1rem;
		align-content: start;
		width: 100%;

		@include md {
			flex: 1;
		}
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--secondary) 16%, var(--surface));
		border: 1px solid color-mix(in srgb, var(--secondary) 38%, var(--border));
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--accent-berry);
	}

	.title {
		max-width: 12ch;
		font-size: clamp(2.25rem, 7vw, 2.75rem);
		font-weight: 800;
		line-height: 0.98;
		letter-spacing: -0.04em;
		animation: fade-up var(--motion-hero) var(--ease-emphasized) both;

		@include md {
			font-size: clamp(3.5rem, 7vw, 4.75rem);
		}
	}

	.highlight {
		color: var(--primary);
		font-weight: 800;
	}

	.description {
		max-width: 34rem;
		font-size: 1rem;
		color: var(--text-muted);
		animation: fade-up var(--motion-hero) var(--ease-emphasized) 40ms both;

		@include md {
			font-size: 1.125rem;
		}
	}

	.actions {
		width: 100%;
		max-width: 36rem;
		animation: fade-up var(--motion-hero) var(--ease-emphasized) 80ms both;

		@include md {
			margin-top: 0.25rem;
		}
	}

	:global(.actions .btn.hero-cta) {
		width: 100%;
		min-height: 3.5rem;
		font-weight: 700;
		box-shadow: none;

		@include md {
			width: auto;
			min-width: 12.5rem;
		}
	}

	:global(.actions .btn.primary-cta) {
		box-shadow: var(--box-shadow);
	}

	.proof-strip {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
		width: 100%;
		animation: fade-up var(--motion-hero) var(--ease-emphasized) 120ms both;
		align-self: end;

		@include sm {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		@include md {
			margin-top: auto;
		}
	}

	.proof-item {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.95rem 1rem;
		border-radius: 20px;
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
	}

	.proof-item :global(svg) {
		color: var(--primary);
		flex-shrink: 0;
	}

	.preview {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		background: linear-gradient(
				180deg,
				color-mix(in srgb, var(--surface) 96%, transparent),
				var(--surface-muted)
			),
			var(--surface);
		overflow: hidden;
		animation: fade-up var(--motion-hero) var(--ease-emphasized) 160ms both;

		@include md {
			height: 100%;
			gap: 0.85rem;
			padding: 1rem;
		}

		@include lg {
			gap: 1rem;
			padding: 1.1rem;
		}
	}

	.preview-header {
		display: grid;
		gap: 0.5rem;

		@include md {
			gap: 0.35rem;
		}

		h2 {
			font-size: 1.5rem;
			line-height: 1.05;

			@include md {
				font-size: 1.35rem;
			}
		}

		p:last-child {
			color: var(--text-muted);
			max-width: 56ch;

			@include md {
				font-size: 0.95rem;
			}
		}
	}

	.preview-badge,
	.card-label,
	.feature-eyebrow {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent-berry);
	}

	.preview-grid {
		display: grid;
		gap: 1rem;

		@include md {
			gap: 0.85rem;
		}

		@include lg {
			grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.85fr);
		}
	}

	.recipe-spotlight {
		display: grid;
		gap: 0.9rem;
		padding: 0.85rem;
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);

		img {
			width: 100%;
			height: 13.5rem;
			object-fit: cover;
			border-radius: 22px;
		}

		@include md {
			grid-template-columns: minmax(12rem, 0.9fr) minmax(0, 1fr);
			align-items: stretch;
			gap: 0.75rem;
			padding: 0.7rem;

			img {
				height: 100%;
				min-height: 13.5rem;
			}
		}
	}

	.recipe-copy {
		display: grid;
		gap: 0.85rem;

		@include md {
			gap: 0.7rem;
		}

		h3 {
			font-size: 1.35rem;
			line-height: 1.1;

			@include md {
				font-size: 1.2rem;
			}
		}

		p {
			color: var(--text-muted);

			@include md {
				font-size: 0.92rem;
			}
		}
	}

	.recipe-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.92rem;
		font-weight: 600;
		color: var(--text);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 12%, var(--border));
		background-color: color-mix(in srgb, var(--surface) 92%, transparent);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1;
	}

	.preview-side {
		display: grid;
		gap: 1rem;

		@include md {
			gap: 0.85rem;
		}
	}

	.mini-card {
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		background-color: color-mix(in srgb, var(--surface) 95%, transparent);

		@include md {
			gap: 0.75rem;
			padding: 0.8rem;
		}

		ul {
			list-style: none;
			display: grid;
			gap: 0.75rem;

			@include md {
				gap: 0.6rem;
			}
		}

		li {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.75rem 0.85rem;
			border-radius: 18px;
			background-color: color-mix(
				in srgb,
				var(--surface-muted) 70%,
				var(--surface)
			);
			font-weight: 600;

			@include md {
				gap: 0.6rem;
				padding: 0.65rem 0.75rem;
				font-size: 0.9rem;
			}
		}

		:global(svg) {
			color: var(--primary);
			flex-shrink: 0;
		}
	}

	.mini-header {
		display: grid;
		gap: 0.25rem;

		h3 {
			font-size: 1.05rem;

			@include md {
				font-size: 1rem;
			}
		}
	}

	.features-section {
		padding: 1rem;

		@include md {
			padding: 1.5rem;
		}
	}

	.features {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		width: 100%;

		@include md {
			grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(0, 0.9fr));
		}
	}

	.feature-card {
		display: grid;
		gap: 1rem;
		padding: 1.2rem;
		background-color: color-mix(in srgb, var(--surface) 95%, transparent);

		&.featured {
			background: radial-gradient(
					circle at top right,
					color-mix(in srgb, var(--secondary) 22%, transparent),
					transparent 30%
				),
				linear-gradient(
					180deg,
					color-mix(in srgb, var(--surface) 92%, transparent),
					var(--surface-muted)
				);
		}

		h2 {
			font-size: 1.2rem;
			line-height: 1.1;
		}

		p {
			color: var(--text-muted);
			font-size: 0.95rem;
		}
	}

	.feature-heading {
		display: grid;
		gap: 0.35rem;
	}

	.feature-highlight {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.8rem;
		border-radius: 20px;
		background-color: color-mix(
			in srgb,
			var(--surface) 94%,
			var(--surface-muted)
		);

		img {
			width: 4.25rem;
			height: 4.25rem;
			object-fit: cover;
			border-radius: 16px;
			flex-shrink: 0;
		}

		div {
			display: grid;
			gap: 0.2rem;
		}

		strong {
			font-size: 0.98rem;
		}

		span {
			color: var(--text-muted);
			font-size: 0.88rem;
		}

		&.compact img {
			width: 3.75rem;
			height: 3.75rem;
		}
	}

	.feature-stat {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		border-radius: 20px;
		background-color: color-mix(
			in srgb,
			var(--surface-muted) 68%,
			var(--surface)
		);

		strong {
			font-size: 1.35rem;
			line-height: 1;
			color: var(--primary);
		}

		span {
			font-size: 0.9rem;
			font-weight: 700;
		}
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(18px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.title,
		.description,
		.actions,
		.proof-strip,
		.preview {
			animation: none;
		}
	}
</style>
