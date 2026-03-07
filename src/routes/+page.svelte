<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
</script>

<h1 class="greeting">Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<a href="/auth/login">{m.auth_login()}</a>
<a href="/auth/register">{m.auth_register()}</a>

{m.hello_world({ name: 'World' })} 

<style lang="scss">
  /* Your SCSS code here */
  .greeting {
    color: darkblue;
  }
</style>
