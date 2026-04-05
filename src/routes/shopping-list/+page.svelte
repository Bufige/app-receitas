<script lang="ts">
	import Icon from "@iconify/svelte";
	import calendarRangeOutline from "@iconify-icons/mdi/calendar-range-outline";
	import calendarTextOutline from "@iconify-icons/mdi/calendar-text-outline";
	import cartOutline from "@iconify-icons/mdi/cart-outline";
	import checkCircleOutline from "@iconify-icons/mdi/check-circle-outline";
	import clockOutline from "@iconify-icons/mdi/clock-outline";
	import backupRestore from "@iconify-icons/mdi/backup-restore";
	import cursorMove from "@iconify-icons/mdi/cursor-move";
	import layersTripleOutline from "@iconify-icons/mdi/layers-triple-outline";
	import Button from "$lib/components/ui/Button/index.svelte";
	import PageHero from "$lib/components/ui/PageHero/index.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import { useMealPlanStore } from "$lib/stores/meal-plan.svelte";
	import type {
		ExpandedMealPlanEntry,
		MealType,
		ShoppingListItem,
		ShoppingItemStatus,
	} from "$lib/types/planning";
	import {
		expand_meal_plan_entries,
		format_plan_range_label,
		format_plan_selection_label,
	} from "$lib/utils/planning";
	import {
		build_planned_meal_key,
		calculate_shopping_list_from_occurrences,
		filter_occurrences_by_selected_meals,
		group_shopping_list_by_category,
	} from "$lib/utils/shopping-list";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";

	const meal_plan_store = useMealPlanStore();
	const available_plans = $derived(meal_plan_store.mealPlans);
	let selected_occurrence_keys = $state<string[]>([]);
	let shopping_item_statuses = $state<Record<string, ShoppingItemStatus>>({
		...meal_plan_store.shoppingItemStatuses,
	});
	let floating_progress_element = $state<HTMLDivElement | null>(null);
	let floating_progress_position = $state<{ x: number; y: number } | null>(
		null,
	);
	let floating_progress_drag = $state<{
		pointer_id: number;
		offset_x: number;
		offset_y: number;
	} | null>(null);

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

	const expanded_entries = $derived.by(() =>
		expand_meal_plan_entries(
			meal_plan_store.mealPlan.entries,
			meal_plan_store.mealPlan.start_date,
			meal_plan_store.mealPlan.end_date,
		),
	);
	const selected_occurrences = $derived.by(() =>
		filter_occurrences_by_selected_meals(
			expanded_entries,
			selected_occurrence_keys,
		),
	);
	const shopping_view = $derived.by(() => {
		const items = calculate_shopping_list_from_occurrences(
			meal_plan_store.recipes,
			selected_occurrences,
			shopping_item_statuses,
		);

		return build_shopping_view(items);
	});
	const range_label = $derived.by(() =>
		format_plan_range_label(meal_plan_store.mealPlan),
	);
	const is_floating_progress_dragging = $derived(
		floating_progress_drag !== null,
	);
	const floating_progress_style = $derived.by(() => {
		if (!floating_progress_position) {
			return undefined;
		}

		return `left: ${floating_progress_position.x}px; top: ${floating_progress_position.y}px; bottom: auto; right: auto;`;
	});

	function are_same_keys(first: string[], second: string[]): boolean {
		if (first.length !== second.length) {
			return false;
		}

		return first.every((value, index) => value === second[index]);
	}

	$effect(() => {
		shopping_item_statuses = {
			...meal_plan_store.shoppingItemStatuses,
		};
	});

	$effect(() => {
		const next_keys = expanded_entries.map((entry) =>
			build_planned_meal_key(entry),
		);
		const persisted_keys = selected_occurrence_keys.filter((key) =>
			next_keys.includes(key),
		);
		const next_selected_keys =
			persisted_keys.length > 0 || next_keys.length === 0
				? persisted_keys
				: [...next_keys];

		if (are_same_keys(selected_occurrence_keys, next_selected_keys)) {
			return;
		}

		selected_occurrence_keys = next_selected_keys;
	});

	function update_status(ingredient_id: string, event: Event) {
		const next_status = (event.currentTarget as HTMLSelectElement)
			.value as ShoppingItemStatus;

		shopping_item_statuses = {
			...shopping_item_statuses,
			[ingredient_id]: next_status,
		};

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

	function get_occurrence_key(entry: ExpandedMealPlanEntry): string {
		return build_planned_meal_key(entry);
	}

	function is_occurrence_selected(entry: ExpandedMealPlanEntry): boolean {
		return selected_occurrence_keys.includes(get_occurrence_key(entry));
	}

	function toggle_occurrence(entry: ExpandedMealPlanEntry) {
		const occurrence_key = get_occurrence_key(entry);

		selected_occurrence_keys = selected_occurrence_keys.includes(occurrence_key)
			? selected_occurrence_keys.filter((key) => key !== occurrence_key)
			: [...selected_occurrence_keys, occurrence_key];
	}

	function select_current_range() {
		selected_occurrence_keys = expanded_entries.map((entry) =>
			build_planned_meal_key(entry),
		);
	}

	function clear_selected_meals() {
		selected_occurrence_keys = [];
	}

	function get_recipe_name(recipe_id: string): string {
		return (
			meal_plan_store.recipes.find((recipe) => recipe.id === recipe_id)?.name ??
			recipe_id
		);
	}

	function get_meal_type_label(meal_type: MealType): string {
		switch (meal_type) {
			case "breakfast":
				return m.planner_meal_type_breakfast();
			case "lunch":
				return m.planner_meal_type_lunch();
			case "dinner":
				return m.planner_meal_type_dinner();
			case "snack":
				return m.planner_meal_type_snack();
		}
	}

	function get_widget_dimensions() {
		const width = floating_progress_element?.offsetWidth ?? 208;
		const height = floating_progress_element?.offsetHeight ?? 96;

		return { width, height };
	}

	function clamp_floating_position(x: number, y: number) {
		if (typeof window === "undefined") {
			return { x, y };
		}

		const { width, height } = get_widget_dimensions();
		const margin = 12;
		const max_x = Math.max(margin, window.innerWidth - width - margin);
		const max_y = Math.max(margin, window.innerHeight - height - margin);

		return {
			x: Math.min(Math.max(x, margin), max_x),
			y: Math.min(Math.max(y, margin), max_y),
		};
	}

	function start_floating_progress_drag(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) {
			return;
		}

		event.preventDefault();

		const rect = floating_progress_element?.getBoundingClientRect();
		const fallback_y =
			typeof window === "undefined" ? 16 : window.innerHeight - 96 - 80;
		const origin = floating_progress_position ?? {
			x: rect?.left ?? 16,
			y: rect?.top ?? fallback_y,
		};

		floating_progress_position = origin;
		floating_progress_drag = {
			pointer_id: event.pointerId,
			offset_x: event.clientX - origin.x,
			offset_y: event.clientY - origin.y,
		};

		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function move_floating_progress(event: PointerEvent) {
		if (
			!floating_progress_drag ||
			event.pointerId !== floating_progress_drag.pointer_id
		) {
			return;
		}

		floating_progress_position = clamp_floating_position(
			event.clientX - floating_progress_drag.offset_x,
			event.clientY - floating_progress_drag.offset_y,
		);
	}

	function stop_floating_progress_drag(event?: PointerEvent) {
		if (
			event &&
			floating_progress_drag &&
			event.pointerId !== floating_progress_drag.pointer_id
		) {
			return;
		}

		floating_progress_drag = null;
	}

	function restore_floating_progress_position() {
		floating_progress_position = null;
		floating_progress_drag = null;
	}

	function handle_viewport_resize() {
		if (!floating_progress_position) {
			return;
		}

		floating_progress_position = clamp_floating_position(
			floating_progress_position.x,
			floating_progress_position.y,
		);
	}

	function select_plan(event: Event) {
		meal_plan_store.selectPlan(
			(event.currentTarget as HTMLSelectElement).value,
		);
	}
</script>

<svelte:window
	onpointermove={move_floating_progress}
	onpointerup={stop_floating_progress_drag}
	onpointercancel={stop_floating_progress_drag}
	onresize={handle_viewport_resize}
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

	<section class="plan-picker surface-panel">
		<div class="plan-picker__copy">
			<p>{m.planner_overview_period()}</p>
			<strong title={meal_plan_store.mealPlan.name}
				>{meal_plan_store.mealPlan.name}</strong
			>
			<span title={range_label}>{range_label}</span>
		</div>
		<div class="field-group">
			<label for="shopping-plan">{m.planner_plan_name_label()}</label>
			<select
				id="shopping-plan"
				value={meal_plan_store.activePlanId}
				onchange={select_plan}
			>
				{#each available_plans as plan}
					<option value={plan.id}>{format_plan_selection_label(plan)}</option>
				{/each}
			</select>
		</div>
	</section>

	<div class="summary-grid">
		<button
			type="button"
			class="summary-card surface-panel summary-button"
			onclick={select_current_range}
		>
			<div class="summary-icon">
				<Icon icon={calendarRangeOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_period()}</p>
				<strong>{range_label}</strong>
			</div>
		</button>
		<article class="summary-card surface-panel">
			<div class="summary-icon">
				<Icon icon={cartOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.profile_history_total_shopping_items()}</p>
				<strong>{shopping_view.items.length}</strong>
			</div>
		</article>
		<article class="summary-card surface-panel">
			<div class="summary-icon">
				<Icon icon={calendarTextOutline} width="20" height="20" />
			</div>
			<div>
				<p>{m.planner_overview_occurrences()}</p>
				<strong>{selected_occurrences.length}</strong>
			</div>
		</article>
	</div>

	<div class="meal-filter surface-panel">
		<header class="filter-header">
			<div>
				<p class="eyebrow">{m.nav_planned_meals()}</p>
				<h2>{m.planner_entries_title()}</h2>
				<p>{selected_occurrences.length} / {expanded_entries.length}</p>
			</div>
			<div class="filter-actions">
				<Button
					variant="outline"
					size="small"
					round
					onclick={select_current_range}
				>
					{m.planner_overview_period()}
				</Button>
				<Button
					variant="outline"
					size="small"
					round
					onclick={clear_selected_meals}
				>
					{m.planner_reset_form()}
				</Button>
			</div>
		</header>

		{#if expanded_entries.length === 0}
			<p class="filter-empty">{m.shopping_empty()}</p>
		{:else}
			<div class="meal-grid">
				{#each expanded_entries as entry}
					<button
						type="button"
						class="meal-chip"
						class:selected={is_occurrence_selected(entry)}
						onclick={() => toggle_occurrence(entry)}
						aria-pressed={is_occurrence_selected(entry)}
					>
						<span class="meal-date">{entry.occurrence_date}</span>
						<strong>{get_recipe_name(entry.recipe_id)}</strong>
						<span class="meal-meta"
							>{get_meal_type_label(entry.meal_type)} · {entry.servings}</span
						>
					</button>
				{/each}
			</div>
		{/if}
	</div>

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
		<div class="shopping-layout">
			<aside class="overview-panel surface-panel">
				<div class="overview-copy">
					<p class="eyebrow">{m.home_feature_shopping_eyebrow()}</p>
					<h2>{m.home_feature_shopping_title()}</h2>
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
	{/if}

	{#if shopping_view.items.length > 0}
		<div
			bind:this={floating_progress_element}
			class="floating-progress"
			class:floating-progress--docked={floating_progress_position === null}
			class:floating-progress--dragging={is_floating_progress_dragging}
			class:floating-progress--floating={floating_progress_position !== null}
			style={floating_progress_style}
			aria-live="polite"
		>
			<div class="floating-progress__topline">
				<div class="floating-progress__copy">
					<span>{m.home_feature_shopping_title()}</span>
					<strong>{shopping_view.progress_value}%</strong>
				</div>
				<div class="floating-progress__actions">
					<button
						type="button"
						class="floating-progress__action"
						aria-label={m.a11y_shopping_widget_drag()}
						onpointerdown={start_floating_progress_drag}
					>
						<Icon icon={cursorMove} width="14" height="14" aria-hidden="true" />
					</button>
					{#if floating_progress_position !== null}
						<button
							type="button"
							class="floating-progress__action"
							aria-label={m.a11y_shopping_widget_restore()}
							onclick={restore_floating_progress_position}
						>
							<Icon
								icon={backupRestore}
								width="14"
								height="14"
								aria-hidden="true"
							/>
						</button>
					{/if}
				</div>
			</div>
			<div class="floating-progress__track" aria-hidden="true">
				<span
					class="floating-progress__bar"
					style={`width: ${shopping_view.progress_value}%`}
				></span>
			</div>
		</div>
	{/if}
</section>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.page {
		display: grid;
		gap: 1rem;
		padding-bottom: 7rem;
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

	.summary-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;

		@include md {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.plan-picker {
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		min-width: 0;
		max-width: 100%;

		@include md {
			grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
			align-items: end;
		}
	}

	.plan-picker__copy {
		display: grid;
		gap: 0.2rem;
		min-width: 0;

		p,
		span {
			color: var(--text-muted);
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		strong {
			display: block;
			font-size: 1.05rem;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.summary-card {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem;

		p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		strong {
			display: block;
			margin-top: 0.15rem;
			font-size: 1rem;
		}
	}

	.summary-button {
		width: 100%;
		border: 1px solid var(--border);
		background: none;
		text-align: left;
		cursor: pointer;
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			box-shadow var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover,
		&:focus-visible {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
			box-shadow: var(--card-shadow-hover);
		}
	}

	.summary-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--primary) 10%, var(--surface));
		color: var(--primary);
		flex-shrink: 0;
	}

	.meal-filter {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 24px;

		@include md {
			padding: 1.15rem;
		}
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;

		h2 {
			font-size: 1.15rem;
			line-height: 1.1;
		}

		p:last-child {
			margin-top: 0.25rem;
			color: var(--text-muted);
			font-size: 0.9rem;
		}
	}

	.filter-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.filter-empty {
		color: var(--text-muted);
	}

	.meal-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;

		@include md {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.meal-chip {
		display: grid;
		justify-items: start;
		gap: 0.25rem;
		padding: 0.9rem 1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 95%, transparent);
		color: var(--text);
		text-align: left;
		cursor: pointer;
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			box-shadow var(--motion-base, 180ms) var(--ease-emphasized, ease),
			background-color var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover,
		&:focus-visible {
			transform: translateY(-2px);
			border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
			box-shadow: var(--card-shadow-hover);
		}

		&.selected {
			background: color-mix(in srgb, var(--primary) 10%, var(--surface));
			border-color: color-mix(in srgb, var(--primary) 34%, var(--border));
		}
	}

	.meal-date,
	.meal-meta {
		font-size: 0.85rem;
		color: var(--text-muted);
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

		@include lg {
			grid-template-columns: minmax(20rem, 0.8fr) minmax(0, 1.2fr);
			align-items: start;
		}
	}

	.overview-panel {
		display: grid;
		gap: 1rem;
		height: fit-content;

		@include lg {
			position: sticky;
			top: 5.5rem;
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

	.floating-progress {
		position: fixed;
		z-index: 120;
		display: grid;
		gap: 0.5rem;
		width: min(13.5rem, calc(100vw - 2rem));
		padding: 0.75rem 0.8rem;
		box-sizing: border-box;
		border-radius: 20px;
		border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: blur(18px);
		box-shadow: var(--shadow-strong);
		user-select: none;
		overflow: hidden;

		@include md {
			width: 12.75rem;
		}
	}

	.floating-progress--docked {
		left: max(1rem, calc(env(safe-area-inset-left) + 1rem));
		bottom: max(5rem, calc(env(safe-area-inset-bottom) + 5rem));
	}

	.floating-progress--floating {
		bottom: auto;
	}

	.floating-progress--dragging {
		cursor: grabbing;
	}

	.floating-progress__topline {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
		min-width: 0;
	}

	.floating-progress__copy {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
		flex: 1 1 auto;

		span {
			font-size: 0.72rem;
			font-weight: 700;
			color: var(--text-muted);
			line-height: 1.1;
			word-break: break-word;
		}

		strong {
			font-size: 1rem;
			line-height: 1;
		}
	}

	.floating-progress__actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.35rem;
		flex-shrink: 0;
		max-width: 100%;
	}

	.floating-progress__action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		flex: 0 0 auto;
		box-sizing: border-box;
		border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 78%, transparent);
		color: var(--text-muted);
		cursor: pointer;
		touch-action: none;
		transition:
			transform var(--motion-base, 180ms) var(--ease-emphasized, ease),
			border-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			background-color var(--motion-base, 180ms) var(--ease-emphasized, ease),
			color var(--motion-base, 180ms) var(--ease-emphasized, ease);

		&:hover,
		&:focus-visible {
			transform: translateY(-1px);
			border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
			background: color-mix(in srgb, var(--primary) 10%, var(--surface));
			color: var(--text);
		}
	}

	.floating-progress__track {
		width: 100%;
		max-width: 100%;
		height: 0.42rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--border) 78%, transparent);
		overflow: hidden;
	}

	.floating-progress__bar {
		display: block;
		max-width: 100%;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(
			90deg,
			var(--primary) 0%,
			var(--secondary) 100%
		);
	}
</style>
