<script>
	import { getContext } from 'svelte';
	import Link from './Link.svelte';
	import Logo from './Logo';

	const user = getContext('user');
</script>

<div class="header">
	<Link to="/">{Logo}</Link><span class="account"
		>{#if $user}{$user.email}{:else}<Link to="/login">login</Link>{/if}</span
	>
</div>
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
		display: flex;
		flex-direction: row;
		justify-items: center;
		padding: var(--spacing);
	}

	.header .account {
		margin-inline-start: auto;
	}
</style>
