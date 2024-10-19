<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="quote">{@render children?.()}</div>

<style>
	.quote {
		padding-left: var(--spacing);
		border-inline-start: var(--thickness) solid var(--border);
		font-style: italic;
	}
</style>
