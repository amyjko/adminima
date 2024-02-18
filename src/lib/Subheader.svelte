<script lang="ts">
	export let warning = false;
</script>

<h3 class:warning><slot /></h3>

<style>
	h3 {
		font-size: 18pt;
		font-weight: bold;
		font-style: italic;
	}

	.warning {
		color: var(--warning);
	}
</style>
