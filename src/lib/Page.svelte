<script>
	import { navigating, updated } from '$app/state';
	import { page } from '$app/state';
	import Link from './Link.svelte';
	import Loading from './Loading.svelte';
	import Logo from './Logo';
	import { getUser } from '$routes/+layout.svelte';

	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();

	const user = getUser();
</script>

<div class="header">
	<span
		>{#if page.url.pathname !== '/'}<Link to="/">{Logo}</Link> Adminima{/if}</span
	>
	{#if navigating.to !== null}<Loading inline={false} />{/if}
	<span class="account"
		>{#if $user}<Link to="/person/{$user.id}">{$user.email}</Link>{:else}<Link to="/login"
				>Login</Link
			>{/if}</span
	>
</div>
<main class="page" data-sveltekit-reload={updated.current ? '' : 'off'}>
	{@render children?.()}
</main>

<style>
	.page {
		width: calc(100vw - 4 * var(--spacing));
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
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing);
		gap: var(--spacing);
	}
</style>
