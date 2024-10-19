<script>
	import { navigating, updated } from '$app/stores';
	import Link from './Link.svelte';
	import Loading from './Loading.svelte';
	import Logo from './Logo';
	import Note from './Note.svelte';
	import { getUser } from './contexts.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();

	const user = getUser();
</script>

<div class="header">
	<Link to="/">{Logo}</Link>
	<span style="white-space: nowrap"
		><Note
			>Adminima is in <strong>beta</strong>. <Link
				to="https://github.com/amyjko/adminima/issues/new/choose">Feedback</Link
			>?
		</Note>
	</span>
	{#if $navigating}<Loading inline={false} />{/if}
	<span class="account"
		>{#if $user}<Link to="/person/{$user.id}">{$user.email}</Link>{:else}<Link to="/login"
				>Login</Link
			>{/if}</span
	>
</div>
<main class="page" data-sveltekit-reload={$updated ? '' : 'off'}>
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
