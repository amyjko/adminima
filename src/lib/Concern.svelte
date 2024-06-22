<script lang="ts">
	export let concern: string;
</script>

{#if concern.length === 0}<em>no concern</em>
{:else}
	<div>
		{concern}
	</div>
{/if}

<style>
	div {
		background: var(--warning);
		color: var(--background);
		padding: var(--padding);
		font-style: italic;
	}
</style>
