<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { page } from "$app/state";
	import { locales, localizeHref } from "$lib/paraglide/runtime";
</script>

<footer class="footer">
	<div class="content">
		<p class="rights">{m.footer_rights()}</p>
		<nav class="links">
			<a href={localizeHref("/privacy-policy")}>{m.footer_privacy_policy()}</a>
			<a href={localizeHref("/terms-of-service")}
				>{m.footer_terms_of_service()}</a
			>
		</nav>
	</div>
</footer>

<style lang="scss">
	@use "$lib/assets/styles/breakpoints" as *;

	.footer {
		border-top: 1px solid var(--border);
		padding: 1rem;

		@include md {
			padding: 1.5rem 2rem;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		max-width: 1280px;
		margin: 0 auto;
	}

	.rights {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.links {
		display: flex;
		gap: 1rem;

		a {
			font-size: 0.875rem;
			color: var(--text-muted);

			&:hover {
				color: var(--text);
			}
		}
	}
</style>
