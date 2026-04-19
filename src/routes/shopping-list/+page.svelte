<script lang="ts">
	import { browser } from "$app/environment";
	import Icon from "@iconify/svelte";
	import cartOutline from "@iconify-icons/mdi/cart-outline";
	import checkCircleOutline from "@iconify-icons/mdi/check-circle-outline";
	import clockOutline from "@iconify-icons/mdi/clock-outline";
	import layersTripleOutline from "@iconify-icons/mdi/layers-triple-outline";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type {
		ShoppingListItem,
		ShoppingItemStatus,
	} from "$lib/types/planning";
	import { format_plan_range_label } from "$lib/utils/planning";
	import { group_shopping_list_by_category } from "$lib/utils/shopping-list";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	const meal_plan_store = useMealPlanStore();
	const DESKTOP_BREAKPOINT = 1024;
	const active_plan = $derived(meal_plan_store.mealPlan);
	const shopping_view = $derived.by(() =>
		build_shopping_view(meal_plan_store.shoppingList),
	);
	const range_label = $derived.by(() => format_plan_range_label(active_plan));
	let shopping_layout_element = $state<HTMLElement | null>(null);
	let overview_panel_element = $state<HTMLElement | null>(null);
	let desktop_layout_height = $state<number | null>(null);
	let show_mobile_summary = $state(false);

	function build_shopping_view(items: ShoppingListItem[]) {
		const groups = group_shopping_list_by_category(items);
		const actionable_count = items.filter(
			(item) => item.status !== "skipped",
		).length;
		const covered_count = items.filter(
			(item) => item.status === "bought" || item.status === "already_available",
		).length;
		const bought_count = items.filter(
			(item) => item.status === "bought",
		).length;
		const available_count = items.filter(
			(item) => item.status === "already_available",
		).length;
		const pending_count = items.filter(
			(item) => item.status === "pending",
		).length;
		const skipped_count = items.filter(
			(item) => item.status === "skipped",
		).length;

		let progress_value = 0;

		if (items.length === 0) {
			progress_value = 0;
		} else if (actionable_count === 0) {
			progress_value = 100;
		} else {
			progress_value = Math.round((covered_count / actionable_count) * 100);
		}

		return {
			items,
			groups,
			actionable_count,
			covered_count,
			bought_count,
			available_count,
			pending_count,
			skipped_count,
			progress_value,
		};
	}
	function update_status(ingredient_id: string, event: Event) {
		const next_status = (event.currentTarget as HTMLSelectElement)
			.value as ShoppingItemStatus;

		meal_plan_store.setShoppingItemStatus(ingredient_id, next_status);
	}

	function get_status_label(status: ShoppingItemStatus | undefined): string {
		switch (status) {
			case "bought":
				return m.shopping_status_bought();
			case "skipped":
				return m.shopping_status_skipped();
			case "already_available":
				return m.shopping_status_already_available();
			case "pending":
			default:
				return m.shopping_status_pending();
		}
	}

	function get_status_class(status: ShoppingItemStatus | undefined): string {
		switch (status) {
			case "bought":
				return "is-bought";
			case "skipped":
				return "is-skipped";
			case "already_available":
				return "is-available";
			case "pending":
			default:
				return "is-pending";
		}
	}

	function get_group_pending_count(group: {
		items: { status?: ShoppingItemStatus }[];
	}) {
		return group.items.filter((item) => item.status === "pending").length;
	}

	function update_mobile_summary_visibility() {
		if (
			!browser ||
			!overview_panel_element ||
			shopping_view.items.length === 0
		) {
			show_mobile_summary = false;
			return;
		}

		const header_offset = window.innerWidth >= 768 ? 64 : 56;
		const overview_bounds = overview_panel_element.getBoundingClientRect();

		show_mobile_summary = overview_bounds.bottom <= header_offset + 12;
	}

	function update_desktop_layout_height() {
		if (
			!browser ||
			!shopping_layout_element ||
			shopping_view.items.length === 0 ||
			window.innerWidth < DESKTOP_BREAKPOINT
		) {
			desktop_layout_height = null;
			return;
		}

		const layout_bounds = shopping_layout_element.getBoundingClientRect();
		const viewport_gap = 16;

		desktop_layout_height = Math.max(
			window.innerHeight - layout_bounds.top - viewport_gap,
			320,
		);
	}

	$effect(() => {
		if (
			!browser ||
			!overview_panel_element ||
			shopping_view.items.length === 0
		) {
			show_mobile_summary = false;
			return;
		}

		const frame_id = window.requestAnimationFrame(() => {
			update_mobile_summary_visibility();
		});

		return () => {
			window.cancelAnimationFrame(frame_id);
		};
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const update_layout_height = () => {
			update_desktop_layout_height();
		};

		const frame_id = window.requestAnimationFrame(() => {
			update_layout_height();
		});

		window.addEventListener("resize", update_layout_height);

		return () => {
			window.cancelAnimationFrame(frame_id);
			window.removeEventListener("resize", update_layout_height);
			desktop_layout_height = null;
		};
	});
</script>

<svelte:window
	onscroll={update_mobile_summary_visibility}
	onresize={update_mobile_summary_visibility}
/>

<SEO
	title={m.seo_shopping_list_title()}
	description={m.seo_shopping_list_description()}
/>

<section class="page">
	<PageHero title={m.shopping_title()} subtitle={m.shopping_subtitle()}>
		{#snippet actions()}
			<div class="hero-actions">
				<Button
					href={localizeHref("/planner")}
					variant="primary"
					size="medium"
					round
				>
					{m.nav_planner()}
				</Button>
				<Button
					href={localizeHref("/planned-meals")}
					variant="outline"
					size="medium"
					round
				>
					{m.nav_planned_meals()}
				</Button>
			</div>
		{/snippet}
	</PageHero>

	{#if shopping_view.items.length === 0}
		<section class="empty-state surface-panel">
			<p>{m.shopping_empty()}</p>
			<div class="empty-actions">
				<Button
					href={localizeHref("/planner")}
					variant="primary"
					size="medium"
					round
				>
					{m.nav_planner()}
				</Button>
				<Button
					href={localizeHref("/recipes")}
					variant="outline"
					size="medium"
					round
				>
					{m.nav_recipes()}
				</Button>
			</div>
		</section>
	{:else}
		<div class:visible={show_mobile_summary} class="mobile-shopping-summary">
			<div class="mobile-shopping-summary__copy">
				<p>{m.home_feature_shopping_title()}</p>
				<strong title={active_plan.name}>{active_plan.name}</strong>
				<span title={range_label}>{range_label}</span>
			</div>
			<div class="mobile-shopping-summary__stats">
				<strong>{shopping_view.progress_value}%</strong>
				<span>
					{shopping_view.pending_count}
					{m.shopping_status_pending().toLowerCase()}
				</span>
			</div>
			<div class="mobile-shopping-summary__track" aria-hidden="true">
				<span
					class="mobile-shopping-summary__bar"
					style={`width: ${shopping_view.progress_value}%`}
				></span>
			</div>
		</div>

		<div
			bind:this={shopping_layout_element}
			class="shopping-layout"
			style={desktop_layout_height
				? `--desktop-layout-height: ${desktop_layout_height}px`
				: undefined}
		>
			<aside
				bind:this={overview_panel_element}
				class="overview-panel surface-panel"
			>
				<div class="overview-copy">
					<p class="eyebrow">{m.home_feature_shopping_eyebrow()}</p>
					<h2>{m.home_feature_shopping_title()}</h2>
					<p class="overview-meta">
						<strong title={active_plan.name}>{active_plan.name}</strong>
						<span title={range_label}>{range_label}</span>
					</p>
					<p>{m.home_feature_shopping_description()}</p>
				</div>

				<div class="progress-card">
					<div class="progress-header">
						<div>
							<p>{m.home_feature_shopping_title()}</p>
							<strong>{shopping_view.progress_value}%</strong>
						</div>
						<Icon icon={checkCircleOutline} width="20" height="20" />
					</div>
					<div class="progress-track" aria-hidden="true">
						<span
							class="progress-bar"
							style={`width: ${shopping_view.progress_value}%`}
						></span>
					</div>
				</div>

				<div class="status-grid">
					<article class="status-card is-pending">
						<div class="status-title">
							<Icon icon={clockOutline} width="18" height="18" />
							<span>{m.shopping_status_pending()}</span>
						</div>
						<strong>{shopping_view.pending_count}</strong>
					</article>
					<article class="status-card is-bought">
						<div class="status-title">
							<Icon icon={checkCircleOutline} width="18" height="18" />
							<span>{m.shopping_status_bought()}</span>
						</div>
						<strong>{shopping_view.bought_count}</strong>
					</article>
					<article class="status-card is-skipped">
						<div class="status-title">
							<Icon icon={cartOutline} width="18" height="18" />
							<span>{m.shopping_status_skipped()}</span>
						</div>
						<strong>{shopping_view.skipped_count}</strong>
					</article>
					<article class="status-card is-available">
						<div class="status-title">
							<Icon icon={layersTripleOutline} width="18" height="18" />
							<span>{m.shopping_status_already_available()}</span>
						</div>
						<strong>{shopping_view.available_count}</strong>
					</article>
				</div>

				<p class="progress-note">
					{shopping_view.actionable_count} · {m
						.shopping_status_pending()
						.toLowerCase()} / {m.shopping_status_bought().toLowerCase()} / {m
						.shopping_status_already_available()
						.toLowerCase()}
				</p>
			</aside>

			<div
				class:mobile-summary-visible={show_mobile_summary}
				class="group-list-scroll"
			>
				<section class="group-list">
					{#each shopping_view.groups as group}
						<section class="group-panel surface-panel">
							<header class="group-header">
								<div>
									<h2>
										{m.shopping_category_title({ category: group.category })}
									</h2>
									<p>
										{get_group_pending_count(group)}
										{m.shopping_status_pending().toLowerCase()}
									</p>
								</div>
								<span class="group-count">{group.items.length}</span>
							</header>

							<div class="items">
								{#each group.items as item}
									<article class="item-card">
										<div class="item-copy">
											<div class="item-topline">
												<h3>{item.name}</h3>
												<span
													class={`status-badge ${get_status_class(item.status)}`}
												>
													{get_status_label(item.status)}
												</span>
											</div>
											<p class="quantity">{item.total_quantity} {item.unit}</p>
										</div>
										<div class="field-group compact">
											<label for={`status-${item.ingredient_id}`}
												>{m.shopping_status_label()}</label
											>
											<select
												id={`status-${item.ingredient_id}`}
												value={item.status ?? "pending"}
												onchange={(event) =>
													update_status(item.ingredient_id, event)}
											>
												<option value="pending"
													>{m.shopping_status_pending()}</option
												>
												<option value="bought"
													>{m.shopping_status_bought()}</option
												>
												<option value="skipped"
													>{m.shopping_status_skipped()}</option
												>
												<option value="already_available"
													>{m.shopping_status_already_available()}</option
												>
											</select>
										</div>
									</article>
								{/each}
							</div>
						</section>
					{/each}
				</section>
			</div>
		</div>
	{/if}
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: grid;
		gap: 1rem;
		padding-bottom: 1.5rem;

		@include lg {
			align-content: start;
			padding-bottom: 0;
		}
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		width: 100%;

		@include md {
			justify-content: flex-end;
		}
	}

	.empty-state,
	.overview-panel,
	.group-panel {
		padding: 1rem;
		border-radius: 24px;

		@include md {
			padding: 1.15rem;
		}
	}

	.empty-state {
		display: grid;
		gap: 1rem;
		justify-items: start;

		p {
			color: var(--text-muted);
		}
	}

	.empty-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.shopping-layout {
		display: grid;
		gap: 1rem;
		min-height: 0;

		@include lg {
			grid-template-columns: minmax(20rem, 0.8fr) minmax(0, 1.2fr);
			align-items: stretch;
			height: var(--desktop-layout-height, auto);
			max-height: var(--desktop-layout-height, none);
			min-height: 0;
			overflow: hidden;
		}
	}

	.mobile-shopping-summary {
		position: fixed;
		top: calc(56px + safe-area-top());
		left: 0;
		right: 0;
		z-index: 90;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.6rem 1rem;
		padding: 0.85rem 1rem;
		border-bottom: 1px solid
			color-mix(in srgb, var(--primary) 14%, var(--border));
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: blur(18px);
		transform: translateY(calc(-100% - 0.5rem));
		opacity: 0;
		pointer-events: none;
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			opacity var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&.visible {
			transform: translateY(0);
			opacity: 1;
			pointer-events: auto;
		}

		@include md {
			display: none;
		}
	}

	.mobile-shopping-summary__copy {
		display: grid;
		gap: 0.1rem;
		min-width: 0;

		p {
			font-size: 0.72rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--text-muted);
		}

		strong,
		span {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		strong {
			font-size: 0.95rem;
			color: var(--text);
		}

		span {
			font-size: 0.82rem;
			color: var(--text-muted);
		}
	}

	.mobile-shopping-summary__stats {
		display: grid;
		justify-items: end;
		align-content: start;
		gap: 0.15rem;

		strong {
			font-size: 1.2rem;
			line-height: 1;
		}

		span {
			font-size: 0.76rem;
			font-weight: 700;
			color: var(--text-muted);
		}
	}

	.mobile-shopping-summary__track {
		grid-column: 1 / -1;
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--border) 78%, transparent);
		overflow: hidden;
	}

	.mobile-shopping-summary__bar {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(
			90deg,
			var(--primary) 0%,
			var(--secondary) 100%
		);
	}

	.overview-panel {
		display: grid;
		gap: 1rem;
		height: fit-content;

		@include lg {
			align-self: start;
			position: sticky;
		}
	}

	.overview-copy {
		display: grid;
		gap: 0.45rem;

		h2 {
			font-size: 1.3rem;
			line-height: 1.1;
		}

		p:last-child {
			color: var(--text-muted);
		}
	}

	.overview-meta {
		display: grid;
		gap: 0.2rem;

		strong,
		span {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		span {
			color: var(--text-muted);
			font-size: 0.92rem;
		}
	}

	.eyebrow {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent-berry);
	}

	.progress-card {
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border-radius: 20px;
		background: color-mix(in srgb, var(--surface-muted) 78%, var(--surface));
		border: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
	}

	.progress-note {
		font-size: 0.84rem;
		color: var(--text-muted);
	}

	.progress-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;

		p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		strong {
			font-size: 1.6rem;
			line-height: 1;
		}
	}

	.progress-track {
		height: 0.65rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--border) 78%, transparent);
		overflow: hidden;
	}

	.progress-bar {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(
			90deg,
			var(--primary) 0%,
			var(--secondary) 100%
		);
		transition: width var(--motion-base, 180ms) var(--ease-emphasized, ease);
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.status-card {
		display: grid;
		gap: 0.45rem;
		padding: 0.9rem;
		border-radius: 18px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 95%, transparent);

		strong {
			font-size: 1.2rem;
		}
	}

	.status-title {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.is-pending {
		border-color: color-mix(in srgb, var(--warning) 30%, var(--border));
	}

	.is-bought {
		border-color: color-mix(in srgb, var(--success) 35%, var(--border));
	}

	.is-skipped {
		border-color: color-mix(in srgb, var(--accent-berry) 28%, var(--border));
	}

	.is-available {
		border-color: color-mix(in srgb, var(--secondary) 40%, var(--border));
	}

	.group-list-scroll {
		min-width: 0;
		padding-top: 0;
		transition: padding-top var(--motion-base, 180ms)
			var(--ease-emphasized, ease);

		&.mobile-summary-visible {
			@include responsive-safe-area-offset(
				padding-top,
				13.25rem,
				$xs: 12.5rem,
				$phone-lg: 11.5rem,
				$sm: 9rem
			);
		}

		@include md {
			padding-top: 0;

			&.mobile-summary-visible {
				padding-top: 0;
			}
		}

		@include lg {
			align-self: stretch;
			height: 100%;
			min-height: 0;
			overflow-y: auto;
			overflow-x: hidden;
			padding-right: 0.35rem;
			scrollbar-gutter: stable;
			overscroll-behavior: contain;
		}
	}

	.group-list {
		display: grid;
		gap: 1rem;
	}

	.group-panel {
		display: grid;
		gap: 1rem;
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;

		h2 {
			font-size: 1.15rem;
			line-height: 1.1;
		}

		p {
			margin-top: 0.25rem;
			color: var(--text-muted);
			font-size: 0.9rem;
		}
	}

	.group-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.25rem;
		height: 2.25rem;
		padding: 0 0.7rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface-muted) 80%, var(--surface));
		border: 1px solid var(--border);
		font-weight: 700;
	}

	.items {
		display: grid;
		gap: 0.85rem;
	}

	.item-card {
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 95%, transparent);
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			box-shadow var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
			box-shadow: var(--card-shadow-hover);
		}

		@include md {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}
	}

	.item-copy {
		display: grid;
		gap: 0.35rem;
	}

	.item-topline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;

		h3 {
			font-size: 1rem;
		}
	}

	.quantity {
		color: var(--text-muted);
		font-size: 0.92rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.6rem;
		border-radius: 999px;
		font-size: 0.76rem;
		font-weight: 700;
		border: 1px solid transparent;
	}

	.status-badge.is-pending {
		background: color-mix(in srgb, var(--warning) 12%, var(--surface));
		border-color: color-mix(in srgb, var(--warning) 22%, var(--border));
		color: var(--warning);
	}

	.status-badge.is-bought {
		background: color-mix(in srgb, var(--success) 12%, var(--surface));
		border-color: color-mix(in srgb, var(--success) 24%, var(--border));
		color: var(--success);
	}

	.status-badge.is-skipped {
		background: color-mix(in srgb, var(--accent-berry) 12%, var(--surface));
		border-color: color-mix(in srgb, var(--accent-berry) 22%, var(--border));
		color: var(--accent-berry);
	}

	.status-badge.is-available {
		background: color-mix(in srgb, var(--secondary) 18%, var(--surface));
		border-color: color-mix(in srgb, var(--secondary) 24%, var(--border));
		color: color-mix(in srgb, var(--text) 78%, var(--secondary));
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
		max-width: 100%;

		label {
			font-size: 0.82rem;
			font-weight: 700;
			color: var(--text-muted);
		}

		select {
			width: 100%;
			max-width: 100%;
			min-width: 0;
			padding: 0.75rem 0.85rem;
			background-color: color-mix(in srgb, var(--surface) 92%, transparent);
			border: 1px solid var(--border);
			border-radius: 16px;
			color: var(--text);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.compact {
		min-width: min(100%, 14rem);
	}
</style>
