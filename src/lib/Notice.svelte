<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div>{@render children?.()}</div>

<style>
	div {
		display: inline-block;
		background-color: var(--warning);
		color: var(--background);
		padding: var(--padding);
		border-radius: var(--radius);
	}
</style>
