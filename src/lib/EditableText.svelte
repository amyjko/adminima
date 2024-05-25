<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';
	import { tick } from 'svelte';

	export let text: string;
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	let editing = false;
	let revision = '';
	let editor: HTMLInputElement;
</script>

{#if edit}
	<form class="editable">
		<!-- svelte-ignore a11y-autofocus -->
		{#if editing}<input type="text" bind:value={revision} autofocus />{:else}<span class="text"
				>{text}</span
			>{/if}{#if edit}<Button
				action={async () => {
					if (editing) {
						if (edit) {
							const error = await edit(revision);
							if (error) console.error(error);
							editing = false;
						}
					} else {
						editing = true;
						revision = text;
					}
				}}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>{/if}
	</form>
{:else}{text}{/if}

<style>
	.editable {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--padding);
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
