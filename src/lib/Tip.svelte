<script lang="ts">
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		admin?: boolean;
		member?: boolean;
		children?: Snippet;
	}

	let { admin = false, member = false, children }: Props = $props();

	const context = getOrg();

	let isMember = $derived(context?.member === true);
	let isAdmin = $derived(context?.admin === true);
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
