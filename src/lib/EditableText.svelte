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
				if (error) console.error(error);
				text = revision;
				editing = false;
			}
		} else {
			editing = true;
			revision = text;
		}
	}
</script>

{#if edit}
	<form class="editable">
		<Button action={save}
			>{#if editing}&checkmark;{:else}✎{/if}</Button
		>{#if editing}
			<!-- svelte-ignore a11y-autofocus -->
			<input
				type="text"
				bind:value={revision}
				on:keydown={(event) => (event.key === 'Enter' ? save() : undefined)}
				autofocus
			/>{:else}<span class="text">{text}</span>{/if}
	</form>
{:else}{text}{/if}

<style>
	.editable {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: calc(2 * var(--padding));
		margin-inline-start: calc(-7 * (var(--padding)));
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
