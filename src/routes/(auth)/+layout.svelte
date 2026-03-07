<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
	let { children } = $props();
</script>

<nav>
	<a href={localizeHref('/login')}>{m.auth_login()}</a>
	<a href={localizeHref('/register')}>{m.auth_register()}</a>
</nav>

{@render children()}