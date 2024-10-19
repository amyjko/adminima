<script lang="ts">
	interface Props {
		warning?: boolean;
		children?: import('svelte').Snippet;
	}

	let { warning = false, children }: Props = $props();
</script>

<h3 class:warning>{@render children?.()}</h3>

<style>
	h3 {
		font-size: 20pt;
		font-weight: bold;
		font-style: italic;
	}

	.warning {
		color: var(--warning);
	}
</style>
