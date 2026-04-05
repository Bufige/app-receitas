<script lang="ts">
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type { ShoppingItemStatus } from "$lib/types/planning";
	import { group_shopping_list_by_category } from "$lib/utils/shopping-list";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	const meal_plan_store = useMealPlanStore();
	const shopping_groups = $derived(
		group_shopping_list_by_category(meal_plan_store.shoppingList),
	);

	function update_status(ingredient_id: string, event: Event) {
		meal_plan_store.setShoppingItemStatus(
			ingredient_id,
			(event.currentTarget as HTMLSelectElement).value as ShoppingItemStatus,
		);
	}
</script>

<SEO
	title={m.seo_shopping_list_title()}
	description={m.seo_shopping_list_description()}
/>

<section class="page">
	<header class="hero">
		<h1>{m.shopping_title()}</h1>
		<p>{m.shopping_subtitle()}</p>
	</header>

	{#if shopping_groups.length === 0}
		<section class="empty-state">
			<p>{m.shopping_empty()}</p>
			<a href={localizeHref("/planner")}>{m.nav_planner()}</a>
		</section>
	{:else}
		<div class="group-list">
			{#each shopping_groups as group}
				<section class="group-panel">
					<h2>{m.shopping_category_title({ category: group.category })}</h2>
					<div class="items">
						{#each group.items as item}
							<article class="item-card">
								<div>
									<h3>{item.name}</h3>
									<p>{item.total_quantity} {item.unit}</p>
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
										<option value="bought">{m.shopping_status_bought()}</option>
										<option value="skipped"
											>{m.shopping_status_skipped()}</option
										>
										<option value="already_available">
											{m.shopping_status_already_available()}
										</option>
									</select>
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.hero,
	.empty-state,
	.group-panel {
		padding: 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background-color: color-mix(in srgb, var(--surface) 94%, transparent);
		box-shadow: var(--soft-box-shadow);
	}

	.hero p,
	.empty-state p {
		color: var(--text-muted);
	}

	.empty-state,
	.group-panel,
	.items {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state a {
		color: var(--primary);
		font-weight: 600;
	}

	.group-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.item-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 14px;
		border: 1px solid var(--border);

		@include md {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}

		h3 {
			margin-bottom: 0.25rem;
		}

		p {
			color: var(--text-muted);
		}
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

		label {
			font-size: 0.875rem;
			font-weight: 500;
		}

		select {
			padding: 0.625rem 0.75rem;
			background-color: color-mix(in srgb, var(--surface) 45%, transparent);
			border: 1px solid var(--border);
			border-radius: 6px;
		}
	}

	.compact {
		min-width: 13rem;
	}
</style>
