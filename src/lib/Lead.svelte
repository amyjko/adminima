<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<p>{@render children?.()}</p>

<style>
	p {
		margin-block-end: var(--spacing);
		font-size: 32pt;
	}
</style>
