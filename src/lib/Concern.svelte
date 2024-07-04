<script lang="ts">
	export let concern: string;
</script>

<div class="row">
	<span class="dot" />
	{#if concern.length === 0}<em>no concern</em>{:else}{concern}{/if}
</div>

<style>
	.dot {
		display: inline-block;
		border-radius: 50%;
		background: var(--warning);
		color: var(--background);
		padding: var(--padding);
		font-style: italic;
	}
	.row {
		display: inline-block;
	}
</style>
