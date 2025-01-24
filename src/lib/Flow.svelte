<script lang="ts">
	interface Props {
		spaced?: boolean;
		children?: import('svelte').Snippet;
	}

	let { spaced = true, children }: Props = $props();
</script>

<div class="flow" class:spaced>{@render children?.()}</div>

<style>
	.flow {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: left;
		align-items: baseline;
		width: 100%;
	}

	.spaced {
		gap: var(--spacing);
		row-gap: var(--spacing);
	}
</style>
