<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		options: (string | undefined)[];
		searchable?: { placeholder: string; include: (item: string, query: string) => boolean };
		selection: string | undefined;
		tip: string;
		/** Optionally async change handler that returns false if there was an error. */
		change: (value: string | undefined) => boolean | Promise<boolean>;
		active?: boolean;
		empty?: boolean;
		id: string;
		/** An optional snippet for rendering items */
		view?: Snippet<[string | undefined]>;
	}

	let {
		options = [],
		tip,
		change,
		searchable = undefined,
		selection = $bindable(),
		active = true,
		empty = true,
		id,
		view: item
	}: Props = $props();

	let expanded = $state(false);
	let query = $state('');

	let searching = $state(false);
	let search = $state<HTMLInputElement | null>(null);
	let list = $state<HTMLDataListElement | null>(null);
	let dropdown = $state<HTMLDivElement | null>(null);

	async function choose(option: string | undefined) {
		const original = selection;
		selection = option;
		// Select the option.
		if ((await change(option)) === false) {
			selection = original;
		} else {
			// Hide the list
			expanded = false;
			// Stop searching if searching.
			searching = false;
		}
	}

	function handleKey(event: KeyboardEvent, option: string | undefined) {
		if (!(event.currentTarget instanceof HTMLElement)) return;
		const isOption = event.currentTarget.classList.contains('option');
		switch (event.key) {
			case 'Enter':
				if (!isOption) {
					expanded = !expanded;
					event.stopPropagation();
				} else {
					choose(option);
					event.stopPropagation();
					event.preventDefault();
					dropdown?.focus();
					break;
				}
			case 'ArrowDown':
				if (!isOption) {
					if (list?.firstElementChild instanceof HTMLElement) {
						expanded = true;
						list.firstElementChild.focus();
						event.stopPropagation();
						event.preventDefault();
					}
				} else {
					const next = event.currentTarget.nextElementSibling;
					if (next instanceof HTMLElement) next.focus();
					event.stopPropagation();
					event.preventDefault();
				}
				break;
			case 'ArrowUp':
				if (isOption) {
					const prev = event.currentTarget.previousElementSibling;
					if (prev instanceof HTMLElement) prev.focus();
					else search !== undefined ? search?.focus() : dropdown?.focus();
					event.stopPropagation();
					event.preventDefault();
				}
				break;
			case 'Escape':
				expanded = false;
				dropdown?.focus();
				event.stopPropagation();
				event.preventDefault();
				break;
		}
	}
</script>

<div
	class="options"
	onfocusout={() => {
		// After focus resolves, if the input or list items aren't selected, hide the menu.
		tick().then(() => {
			if (document.activeElement !== search && document.activeElement?.parentElement !== list) {
				expanded = false;
			}
		});
	}}
>
	<div class="selection">
		<!-- Searching? Show the search box. -->
		{#if searchable && searching && active}
			<input
				type="text"
				bind:value={query}
				bind:this={search}
				placeholder={searchable ? searchable.placeholder : undefined}
				title={tip}
				aria-label={tip}
				role="combobox"
				onfocus={() => {
					expanded = true;
				}}
				onkeydown={(event) => handleKey(event, undefined)}
				aria-controls={id}
				aria-autocomplete="list"
				aria-expanded={expanded ? 'true' : 'false'}
				data-active-option="{id}-{options.findIndex((s) => s === selection)}"
			/>
		{:else if selection !== undefined || empty}
			<div
				role="button"
				class="dropdown"
				tabindex="0"
				aria-disabled={active ? 'false' : 'true'}
				bind:this={dropdown}
				onpointerdown={() => (expanded = !expanded)}
				onkeydown={(event) => handleKey(event, undefined)}
			>
				<!-- Otherwise, show the item -->
				{#if item}
					{@render item(selection)}
				{:else}
					{selection}
				{/if}
			</div>
		{/if}
		{#if searchable && active}
			<Button
				chromeless
				tip="search"
				onkeydown={(event) => handleKey(event, undefined)}
				action={() => {
					searching = !searching;
					tick().then(() => search?.focus());
				}}>🔍</Button
			>
		{:else}
			<Button
				chromeless
				{tip}
				{active}
				onkeydown={(event) => handleKey(event, undefined)}
				action={() => {
					expanded = !expanded;
				}}
			>
				▾
			</Button>
		{/if}
	</div>
	<datalist id="{id}-list" class:expanded bind:this={list}>
		{#each searchable ? options.filter((o) => (o === undefined && empty) || (o !== undefined ? searchable.include(o, query) : false)) : options as option}
			<div
				class="option"
				role="option"
				tabindex="0"
				onkeydown={(event) => handleKey(event, option)}
				onpointerdown={() => choose(option)}
				data-value={option}
				aria-selected={selection === option}
			>
				{#if item}
					{@render item(option)}
				{:else}
					<option>{option}</option>
				{/if}
			</div>
		{/each}
	</datalist>
</div>

<style>
	.options {
		display: inline-block;
		white-space: nowrap;
		font-size: var(--small-size);
		font-family: var(--font);
		position: relative;
	}

	.selection {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--padding);
		cursor: pointer;
	}

	input {
		font-family: inherit;
		font-size: inherit;
		font-style: normal;
		width: 5em;
		height: 1.5em;
	}

	input:focus,
	.option:focus,
	.dropdown:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.dropdown[aria-disabled='true'] {
		color: var(--inactive);
		cursor: default;
	}

	datalist {
		border: solid 1px var(--border);
		position: absolute;
		left: 0;
		top: 1.5em;
		background: var(--background);
		z-index: 2;
		overflow-y: auto;
		max-height: 15em;
	}

	datalist.expanded {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
	}

	.option {
		cursor: pointer;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		color: var(--foreground);
	}

	.option:hover,
	.option:focus {
		outline: var(--thickness) solid var(--focus);
		outline-offset: calc(-1 * var(--thickness));
	}

	option {
		padding: var(--padding);
	}
</style>
