<script>
	import Link from './Link.svelte';
	import Logo from './Logo';
</script>

<div class="header"><Link to="/">{Logo}</Link></div>
<div class="page">
	<slot />
</div>

<style>
	.page {
		padding: var(--spacing);
		display: flex;
		flex-direction: column;
		align-items: block-start;
		margin: auto;
		gap: var(--spacing);
		width: calc(100% - (2 * var(--spacing)));
		max-width: 36em;
		margin-block-start: 6vh;
	}

	.header {
		padding-block-start: var(--spacing);
		text-align: center;
	}
</style>
