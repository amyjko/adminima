<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<h2>{@render children?.()}</h2>

<style>
	h2 {
		font-size: 24pt;
		font-weight: bold;
		margin-bottom: 0;
	}

	h2:not(:first-of-type) {
		margin-top: var(--spacing);
	}
</style>
