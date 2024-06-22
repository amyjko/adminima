<script>
	import { dev } from '$app/environment';
	import Link from './Link.svelte';
	import Logo from './Logo';
	import { getUser } from './contexts';

	const user = getUser();
</script>

<div class="header">
	<Link to="/">{Logo}</Link><span class="account"
		>{#if $user}<Link to="/login">{$user.email}</Link>{:else if dev}<Link to="/login">Login</Link
			>{/if}</span
	>
</div>
<div class="page">
	<slot />
</div>

<style>
	.page {
		padding-left: calc(2 * var(--spacing));
		padding-right: calc(2 * var(--spacing));
		display: flex;
		flex-direction: column;
		margin: auto;
		gap: calc(1.5 * var(--spacing));
		max-width: 36em;
		align-items: flex-start;
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
