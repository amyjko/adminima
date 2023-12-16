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
		color: var(--salient);
		text-decoration: underline;
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		transition: transform 200ms;
	}

	a.inactive {
		color: var(--inactive);
		text-decoration: none;
	}

	a.bland {
		color: var(--background);
	}

	a:hover,
	a:focus {
		display: inline-block;
		transform-origin: center;
		transform: scale(1.1) rotate(-2deg);
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.external {
		font-size: small;
	}
</style>
