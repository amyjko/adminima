<script lang="ts">
	export let center = false;
</script>

<h1 class:center><slot /></h1>

<style>
	h1 {
		margin-block-end: var(--spacing);
		font-size: 42pt;
		font-weight: bold;
		text-transform: uppercase;
	}

	.center {
		text-align: center;
	}
</style>
