<script lang="ts">
	import { getOrg, getUser } from './contexts.svelte';

	interface Props {
		admin?: boolean;
		member?: boolean;
		children?: import('svelte').Snippet;
	}

	let { admin = false, member = false, children }: Props = $props();

	const user = getUser();
	const context = getOrg();
	let org = $derived(context?.org);

	let isMember = $derived($user && org?.hasPerson($user.id));
	let isAdmin = $derived($user && org?.hasAdminPerson($user.id));
</script>

{#if (admin === false && member === false) || (admin && isAdmin) || (member && isMember)}
	<div class="tip">
		<div>💡</div>
		<div>{@render children?.()}</div>
	</div>
{/if}

<style>
	.tip {
		display: flex;
		width: 100%;
		flex-direction: row;
		gap: var(--padding);
		font-style: italic;
		padding: var(--padding);
		font-size: var(--small-size);
		border-left: var(--thickness) var(--border) solid;
	}
</style>
