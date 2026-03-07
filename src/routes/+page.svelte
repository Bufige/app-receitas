<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import SEO from "$lib/components/ui/SEO/index.svelte";
	import Button from "@components/ui/Button/index.svelte";
	import ButtonGroup from "@components/ui/ButtonGroup/index.svelte";

	const theme = useThemeStore();
</script>

<SEO title={m.seo_home_title()} description={m.seo_home_description()} />

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
</Button>
