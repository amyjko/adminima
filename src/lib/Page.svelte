<div class="page">
	<div class="content"><slot /></div>
</div>

<style>
	.page {
		margin: var(--spacing);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.content {
		max-width: 32em;
		margin-block-start: 10vh;
	}
</style>
