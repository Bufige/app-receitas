<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Stepper from "$lib/components/ui/Stepper/index.svelte";
	import Button from "@components/ui/Button/index.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useMemorialDraft } from "$lib/stores/memorial-draft.svelte";

	let { children } = $props();

	const draft = useMemorialDraft();

	const steps = $derived([
		{ label: m.memorial_step_details() },
		{ label: m.memorial_step_media() },
		{ label: m.memorial_step_tribute() },
		{ label: m.memorial_step_preview() },
	]);

	const currentStep = $derived(
		(() => {
			const path = page.url.pathname;
			if (path.includes("step-4")) return 4;
			if (path.includes("step-3")) return 3;
			if (path.includes("step-2")) return 2;
			return 1;
		})(),
	);

	const maxVisited = $derived(Math.max(currentStep, draft.currentStep));

	$effect(() => {
		if (currentStep > draft.currentStep) {
			draft.currentStep = currentStep;
		}
	});

	function handleStepClick(step: number) {
		goto(localizeHref(`/create/step-${step}`));
	}

	function goBack() {
		if (currentStep > 1) {
			goto(localizeHref(`/create/step-${currentStep - 1}`));
		} else {
			goto(localizeHref("/"));
		}
	}

	function goNext() {
		if (currentStep < 4) {
			goto(localizeHref(`/create/step-${currentStep + 1}`));
		}
	}

	const canGoNext = $derived(
		(() => {
			if (currentStep === 1) return draft.isStep1Valid;
			if (currentStep === 4) return false; // step 4 has its own submit
			return true;
		})(),
	);

	const isLastStep = $derived(currentStep === 4);
</script>

<div class="wizard">
	<header class="wizard-header">
		<h1 class="wizard-title">{m.memorial_create_title()}</h1>
		<p class="wizard-subtitle">{m.memorial_create_subtitle()}</p>
	</header>

	<Stepper {steps} {currentStep} {maxVisited} onstepclick={handleStepClick} />

	<div class="wizard-content">
		{@render children()}
	</div>

	{#if !isLastStep}
		<nav class="wizard-nav" aria-label="Wizard navigation">
			<Button variant="default" onclick={goBack}>
				{m.memorial_previous()}
			</Button>
			<Button variant="primary" onclick={goNext} disabled={!canGoNext}>
				{m.memorial_next()}
			</Button>
		</nav>
	{:else}
		<nav class="wizard-nav" aria-label="Wizard navigation">
			<Button variant="default" onclick={goBack}>
				{m.memorial_previous()}
			</Button>
		</nav>
	{/if}
</div>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.wizard {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		max-width: 640px;
		margin: 0 auto;
		padding: 1rem 0;

		@include md {
			gap: 1.5rem;
			padding: 1.5rem 0;
		}
	}

	.wizard-header {
		text-align: center;
	}

	.wizard-title {
		font-size: 1.5rem;
		font-weight: 700;

		@include md {
			font-size: 1.75rem;
		}
	}

	.wizard-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.wizard-content {
		width: 100%;
		min-height: 300px;
	}

	.wizard-nav {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
	}
</style>
