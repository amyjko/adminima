<script lang="ts">
	export let to: string;
	export let external = false;
</script>

<a href={to} target={external ? '_blank' : ''}><slot /></a>{#if external}<sup class="external"
		>↗</sup
	>{/if}

<style>
	a {
		color: var(--salient);
		text-decoration: underline;
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		transition: transform 200ms;
	}

	a:hover,
	a:focus {
		display: inline-block;
		transform: rotate(2deg);
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.external {
		font-size: small;
	}
</style>
