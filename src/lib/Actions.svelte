<script>
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="actions">
	{@render children?.()}
</div>

<style>
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--padding);
	}
</style>
