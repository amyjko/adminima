<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';

	export let text: string;
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	let editing = false;
	let revision = '';

	async function save() {
		if (editing) {
			if (edit) {
				const error = await edit(revision);
				editing = false;
				if (error) return;
				else text = revision;
			}
		} else {
			editing = true;
			revision = text;
		}
	}
</script>

{#if edit}
	<form class="editable">
		{#if editing}
			<!-- svelte-ignore a11y-autofocus -->
			<input
				type="text"
				bind:value={revision}
				style:width={revision.length + 2 + 'ch'}
				on:keydown={(event) => (event.key === 'Enter' ? save() : undefined)}
				autofocus
			/>{:else}<span class="text"
				>{#if text.length === 0}&mdash;{:else}{text}{/if}</span
			>{/if}
		<Button tip="Save this edit" action={save}
			>{#if editing}&checkmark;{:else}✎{/if}</Button
		>
	</form>
{:else}{text}{/if}

<style>
	.editable {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: calc(2 * var(--padding));
	}

	input {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		text-transform: inherit;
		line-height: inherit;
		padding: 0;
		border: 0;
		border-radius: 0;
		height: 1em;
		outline: var(--thickness) solid var(--border);
	}

	input:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.text {
		display: inline-block;
	}
</style>
