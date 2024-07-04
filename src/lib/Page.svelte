<script>
	import { navigating } from '$app/stores';
	import Link from './Link.svelte';
	import Loading from './Loading.svelte';
	import Logo from './Logo';
	import { getUser } from './contexts';

	const user = getUser();
</script>

<div class="header">
	<Link to="/">{Logo}</Link>{#if $navigating}<Loading inline={false} />{/if}<span class="account"
		>{#if $user}<Link to="/login">{$user.email}</Link>{:else}<Link to="/login">Login</Link
			>{/if}</span
	>
</div>
<div class="page">
	<slot />
</div>

<style>
	.page {
		padding: calc(2 * var(--spacing));
		padding-top: 0;
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
