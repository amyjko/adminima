<script lang="ts">
	export let concern: string;
</script>

<div>
	{concern}
</div>

<style>
	div {
		background: var(--warning);
		color: var(--background);
		padding: var(--padding);
		font-style: italic;
	}
</style>
