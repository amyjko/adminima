<script lang="ts">
	import type { MutationResult } from '$database/Organization';
	import EditableText from './EditableText.svelte';

	interface Props {
		concern: string;
		edit?: ((concern: string) => Promise<MutationResult>) | undefined;
	}

	let { concern, edit = undefined }: Props = $props();
</script>

<div class="concern">
	<span class="dot">•&nbsp;</span>
	{#if concern.length === 0}
		<em>no concern</em>
	{:else if edit}
		<EditableText text={concern} {edit} />
	{:else}
		{concern}
	{/if}
</div>

<style>
	.dot {
		color: var(--warning);
	}
	.concern {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		background: var(--background);
		color: var(--foreground);
		padding: var(--padding);
		border-radius: var(--radius);
	}
</style>
