<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import EditableText from './EditableText.svelte';

	export let concern: string;
	export let edit: ((concern: string) => Promise<PostgrestError | null>) | undefined = undefined;
</script>

{#if concern.length === 0}
	<em>no concern</em>
{:else}
	<div class="row">
		<span class="dot">•&nbsp;</span>
		{#if edit}
			<EditableText text={concern} {edit} />
		{:else}
			{concern}
		{/if}
	</div>
{/if}

<style>
	.dot {
		color: var(--warning);
	}
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}
</style>
