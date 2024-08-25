<script lang="ts">
	export let full = true;
</script>

<div class="table" class:full>
	<table><slot /></table>
</div>

<style>
	.table {
		overflow-x: auto;
		width: 100%;
	}

	.full {
		width: calc(100vw - 2em);
		margin-left: calc(-1 * (100vw - 2em - 100%) / 2);
	}
</style>
