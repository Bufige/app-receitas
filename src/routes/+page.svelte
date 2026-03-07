<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
	import { useThemeStore } from "$lib/stores/theme.svelte";
	import Button from "@components/ui/Button/index.svelte";

	const theme = useThemeStore();
</script>

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
<Button
	variant="primary"
	size="large"
	onclick={() => alert("Button clicked!")}
	loading={false}
>
	Click Me
</Button>
