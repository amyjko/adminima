<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';
	import Loading from './Loading.svelte';

	export let text: string;
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	let editing = false;
	let revision = '';
	let saving = false;

	async function save() {
		if (editing) {
			if (edit) {
				saving = true;
				const error = await edit(revision);
				saving = false;
				if (error) return;
				else {
					text = revision;
					editing = false;
				}
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
				disabled={saving}
				style:width={revision.length + 2 + 'ch'}
				on:keydown={(event) => (event.key === 'Enter' ? save() : undefined)}
				autofocus
			/>{:else}<span class="text"
				>{#if text.length === 0}&mdash;{:else}{text}{/if}</span
			>{/if}
		{#if saving}<Loading text="" />{:else}<Button tip="Save this edit" action={save}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>{/if}
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
		max-width: 16ch;
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
