<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';

	export let choice: string;
	export let choices: Record<string, string>;
	export let edit: undefined | ((choice: string) => Promise<PostgrestError | null> | undefined) =
		undefined;

	let editing = false;

	$: levels = Object.keys(choices) as [keyof typeof choices];

	function choose(newChoice: string) {
		if (edit) {
			const error = edit(newChoice);
			if (!error) choice = newChoice;
			editing = false;
		}
	}
</script>

<div class="row">
	{#if editing}
		<div class="choices" role="radiogroup">
			{#each levels as key}
				<div
					class="choice"
					class:interactive={choice !== key}
					class:selected={choice === key}
					title={choices[key]}
					tabindex="0"
					role="radio"
					aria-checked={choice === key}
					on:click={() => choose(key)}
					on:keydown={(e) => {
						if (e.key === 'Enter') choose(key);
					}}
				>
					{key}
				</div>
			{/each}
		</div>
	{:else}
		<div class="choice selected" title={choices[choice]}>
			<slot />
		</div>
	{/if}
	{#if edit}<Button action={() => (editing = !editing)}>✎</Button>{/if}
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
		align-items: middle;
	}
	.choices {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
		align-self: center;
	}

	.choice {
		text-transform: none;
		display: inline-block;
		align-self: flex-start;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		vertical-align: middle;
		color: var(--foreground);
		background-color: var(--chrome);
		align-self: center;
	}

	.interactive {
		cursor: pointer;
	}

	.interactive:hover {
		color: var(--background);
		background-color: var(--inactive);
	}

	.selected {
		color: var(--background);
		background-color: var(--focus);
	}
</style>
