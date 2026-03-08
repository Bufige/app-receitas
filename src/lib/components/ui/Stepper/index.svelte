<script lang="ts">
	import Icon from "@iconify/svelte";
	import checkIcon from "@iconify-icons/mdi/check";

	interface StepperProps {
		steps: { label: string }[];
		currentStep: number;
		maxVisited: number;
		onstepclick?: (step: number) => void;
	}

	let { steps, currentStep, maxVisited, onstepclick }: StepperProps = $props();

	function handleClick(index: number) {
		const stepNumber = index + 1;
		if (stepNumber <= maxVisited && onstepclick) {
			onstepclick(stepNumber);
		}
	}

	function handleKeydown(event: KeyboardEvent, index: number) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick(index);
		}
	}
</script>

<nav class="stepper" aria-label="Progress">
	<ol class="steps">
		{#each steps as step, i}
			{@const stepNumber = i + 1}
			{@const isActive = stepNumber === currentStep}
			{@const isCompleted = stepNumber < currentStep}
			{@const isClickable =
				stepNumber <= maxVisited && stepNumber !== currentStep}
			<li
				class="step"
				class:active={isActive}
				class:completed={isCompleted}
				class:clickable={isClickable}
				aria-current={isActive ? "step" : undefined}
			>
				{#if i > 0}
					<span class="connector" class:filled={stepNumber <= currentStep}
					></span>
				{/if}
				<button
					type="button"
					class="step-indicator"
					disabled={!isClickable}
					onclick={() => handleClick(i)}
					onkeydown={(e) => handleKeydown(e, i)}
					aria-label="{step.label}, step {stepNumber} of {steps.length}"
				>
					{#if isCompleted}
						<Icon icon={checkIcon} width="1em" height="1em" />
					{:else}
						<span class="step-number">{stepNumber}</span>
					{/if}
				</button>
				<span class="step-label">{step.label}</span>
			</li>
		{/each}
	</ol>
</nav>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.stepper {
		width: 100%;
		padding: 0.5rem 0;
	}

	.steps {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		list-style: none;
		gap: 0;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		position: relative;
		flex: 1;
	}

	.connector {
		position: absolute;
		top: 14px;
		right: 50%;
		width: 100%;
		height: 2px;
		background-color: var(--border);
		z-index: 0;
		transition: background-color 0.3s;

		&.filled {
			background-color: var(--primary);
		}
	}

	.step-indicator {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		border: 2px solid var(--border);
		background-color: var(--surface);
		color: var(--text-muted);
		cursor: default;
		position: relative;
		z-index: 1;
		transition:
			border-color 0.3s,
			background-color 0.3s,
			color 0.3s;

		&:disabled {
			cursor: default;
			opacity: 1;
		}

		@include md {
			width: 32px;
			height: 32px;
			font-size: 0.8125rem;
		}
	}

	.active .step-indicator {
		border-color: var(--primary);
		background-color: var(--primary);
		color: var(--black);
	}

	.completed .step-indicator {
		border-color: var(--primary);
		background-color: var(--primary);
		color: var(--black);
	}

	.clickable .step-indicator {
		cursor: pointer;

		&:hover {
			background-color: color-mix(in srgb, var(--primary) 15%, var(--surface));
			border-color: var(--primary);
		}

		&:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}
	}

	.step-label {
		font-size: 0.6875rem;
		color: var(--text-muted);
		text-align: center;
		white-space: nowrap;
		transition: color 0.3s;

		@include md {
			font-size: 0.75rem;
		}
	}

	.active .step-label {
		color: var(--text);
		font-weight: 600;
	}

	.completed .step-label {
		color: var(--primary);
	}

	.step-number {
		line-height: 1;
	}
</style>
