<script lang="ts">
	import { page } from '$app/stores';

	export let to: string;
	export let external = false;
	export let bland = false;

	$: inactive = to === $page.url.pathname;
</script>

<a class:inactive class:bland href={inactive ? null : to} target={external ? '_blank' : ''}
	><slot /></a
>{#if external}<sup class="external">↗</sup>{/if}

<style>
	a {
		background: var(--salient);
		color: var(--background);
		padding: calc(var(--padding));
		text-decoration: none;
		transition: transform 200ms;
		display: inline-block;
	}

	a.inactive {
		color: var(--inactive);
		text-decoration: none;
		background: none;
	}

	a.bland {
		color: var(--background);
	}

	a:hover:not(.inactive),
	a:focus:not(.inactive) {
		text-decoration: underline;
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		transform-origin: center;
		transform: scaleY(1.1);
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.external {
		font-size: small;
	}
</style>
