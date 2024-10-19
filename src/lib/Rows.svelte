<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="rows">{@render children?.()}</div>

<style>
	.rows {
		width: 100%;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: var(--spacing);
	}
</style>
