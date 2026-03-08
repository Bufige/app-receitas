<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Button from "@components/ui/Button/index.svelte";
	import ButtonGroup from "@components/ui/ButtonGroup/index.svelte";

	const theme = useThemeStore();
</script>

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
			onclick={() => alert("Button clicked!")}
			loading={false}
			round={true}
		>
			Start a memorial
		</Button>
	</div>

	<!-- <SEO title={m.seo_home_title()} description={m.seo_home_description()} />
	<h1 class="greeting">Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
		documentation
	</p>

	<a href={localizeHref("/login")}>{m.auth_login()}</a>
	<a href={localizeHref("/register")}>{m.auth_register()}</a>

	{m.hello_world({ name: "World" })}

	<button onclick={() => theme.toggle()}>
		{theme.current === "dark" ? "☀️" : "🌙"}
	</button>
	<ButtonGroup direction="row" gap="1rem">
		<Button
			variant="primary"
			size="medium"
			onclick={() => alert("Primary Button Clicked!")}
		>
			Primary
		</Button>
		<Button
			variant="secondary"
			size="medium"
			onclick={() => alert("Secondary Button Clicked!")}
		>
			Secondary
		</Button>
		<Button
			variant="danger"
			size="medium"
			onclick={() => alert("Danger Button Clicked!")}
		>
			Danger
		</Button>
	</ButtonGroup>
	<Button
		variant="primary"
		size="large"
		onclick={() => alert("Button clicked!")}
		loading={false}
	>
		Click Me
	</Button> -->
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
