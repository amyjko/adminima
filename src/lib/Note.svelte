<script lang="ts">
	interface Props {
		inline?: boolean;
		children?: import('svelte').Snippet;
	}

	let { inline = false, children }: Props = $props();
</script>

<div class:inline><em>{@render children?.()}</em></div>

<style>
	div {
		font-size: var(--small-size);
		font-style: italic;
	}

	.inline {
		display: inline;
	}
</style>
