<script lang="ts">
	export let spaced: boolean = true;
</script>

<div class="flow" class:spaced><slot /></div>

<style>
	.flow {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: left;
		align-items: baseline;
	}

	.spaced {
		gap: var(--spacing);
		row-gap: var(--spacing);
	}
</style>
