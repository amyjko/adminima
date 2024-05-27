<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { type Visibility as Vis } from '../database/Organizations';
	import Button from './Button.svelte';

	export let level: Vis;
	export let edit: undefined | ((level: Vis) => Promise<PostgrestError | null>) = undefined;

	let editing = false;

	const tooltips = {
		public: 'Anyone on the internet can see this organization',
		org: 'Only people with a role in this organization can see this',
		admin: 'Only administrators can see this'
	};
	const levels = Object.keys(tooltips) as [keyof typeof tooltips];

	function setLevel(newLevel: Vis) {
		if (edit) {
			const error = edit(newLevel);
			if (!error) level = newLevel;
			editing = false;
		}
	}
</script>

<div class="row">
	{#if editing}
		<div class="choices" role="radiogroup">
			{#each levels as key}
				<div
					class="visibility"
					class:interactive={level !== key}
					class:selected={level === key}
					title={tooltips[key]}
					tabindex="0"
					role="radio"
					aria-checked={level === key}
					on:click={() => setLevel(key)}
					on:keydown={(e) => {
						if (e.key === 'Enter') setLevel(key);
					}}
				>
					{key}
				</div>
			{/each}
		</div>
	{:else}
		<div class="visibility selected" title={tooltips[level]}>
			{level}
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

	.visibility {
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
