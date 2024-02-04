<script lang="ts">
	export let center = false;
</script>

<h2 class:center><slot /></h2>

<style>
	h2 {
		font-size: 24pt;
		font-weight: bold;
		text-transform: lowercawse;
		margin-block-start: var(--spacing);
		margin-block-end: calc(var(--spacing) / 2);
	}

	.center {
		text-align: center;
	}
</style>
