<script lang="ts">
	import type { HowRow, ProcessRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import { getContext, tick } from 'svelte';
	import Visibility from './Visibility.svelte';
	import { getOrg } from './contexts';
	import type { HowID } from '$types/Organization';
	import Button from './Button.svelte';
	import type { Writable } from 'svelte/store';
	import ARCI from './ARCI.svelte';

	export let how: HowRow;
	export let process: ProcessRow;

	const org = getOrg();
	const focusID = getContext<Writable<string | undefined>>('focusID');

	let input: HTMLTextAreaElement;
	let text = how.what;
	// Helps us keep track of whether to give this an HTML ID for purposes of focusing.
	let deleted = false;

	function save() {
		Organizations.updateHowText(how, text);
	}

	function toggleDone() {
		Organizations.updateHowDone(
			how,
			how.done === 'no' ? 'pending' : how.done === 'pending' ? 'yes' : 'no'
		);
	}

	async function insertHow() {
		// See if this how has a parent, and if so, insert after this how.
		const parent = $org.getHowParent(how.id);
		if (parent) {
			const { id } = await Organizations.insertHow(process, parent, parent.how.indexOf(how.id) + 1);
			if (id) {
				focusID.set(id);
			}
		}
		// Otherwise, insert at the first position of this how.
		else {
			const { id } = await Organizations.insertHow(process, how, 0);
			if (id) focusID.set(id);
		}
	}

	function canDelete() {
		const parent = $org.getHowParent(how.id);
		return (
			parent &&
			process.howid !== how.id &&
			!(parent.id === process.howid && parent.how.length === 1)
		);
	}

	async function deleteHow() {
		const parent = $org.getHowParent(how.id);
		if (parent && canDelete()) {
			const newFocusID =
				parent.how.length === 1 || parent.how[0] === how.id
					? parent.id
					: parent.how[parent.how.indexOf(how.id) - 1];

			await Organizations.deleteHow(parent, how);

			focusID.set(newFocusID);
		}
	}

	function getIndent() {
		const parent = $org.getHowParent(how.id);
		if (parent) {
			const index = parent.how.indexOf(how.id);
			if (index > 0) {
				const previousID = parent.how[index - 1];
				const previousHow = $org.getHow(previousID);
				if (previousHow) return [parent, previousHow];
			}
		}
		return undefined;
	}

	async function indentHow(focus: boolean) {
		const result = getIndent();
		if (result) {
			const [parent, previousHow] = result;
			deleted = true;
			await Organizations.moveHow(how, parent, previousHow, previousHow.how.length);
			await tick();
			if (focus) focusID.set(how.id);
		}
	}

	function getUnindent() {
		const parent = $org.getHowParent(how.id);
		if (parent) {
			const grandparent = $org.getHowParent(parent.id);
			if (grandparent) {
				return [parent, grandparent];
			}
		}
		return undefined;
	}

	async function unindentHow(focus: boolean) {
		const result = getUnindent();
		if (result) {
			const [parent, grandparent] = result;
			deleted = true;
			await Organizations.moveHow(how, parent, grandparent, grandparent.how.indexOf(parent.id) + 1);
			await tick();
			if (focus) focusID.set(how.id);
		}
	}

	function enumerate(how: HowRow, list: HowID[] = []) {
		list.push(how.id);
		for (const subhow of how.how
			.map((id) => $org.getHow(id))
			.filter((h): h is HowRow => h !== undefined)) {
			enumerate(subhow, list);
		}
		return list;
	}

	function moveVertically(dir: -1 | 1) {
		if (process.howid) {
			const root = $org.getHow(process.howid);
			if (root) {
				const list = enumerate(root);
				const index = list.indexOf(how.id);
				if (index >= 0 && index + dir < list.length) {
					const next = list[index + dir];
					document.getElementById(`how-${next}`)?.focus();
				}
			}
		}
	}
</script>

<div class="how">
	{#if process.howid !== how.id}
		<div class="main">
			<div
				role="checkbox"
				class="complete"
				aria-checked={how.done === 'no' ? 'false' : how.done === 'pending' ? 'mixed' : 'true'}
				tabindex="0"
				on:keydown={(event) =>
					event.key === 'Enter' || event.key === ' ' ? toggleDone() : undefined}
				on:pointerdown={toggleDone}
			>
				{#if how.done === 'no'}&nbsp;{:else if how.done === 'pending'}…{:else}✔{/if}
			</div>
			<textarea
				rows={text.split('\n').length}
				class:done={how.done === 'yes'}
				class:pending={how.done === 'pending'}
				id={deleted ? '' : `how-${how.id}`}
				bind:value={text}
				bind:this={input}
				on:blur={save}
				on:keydown={(e) => {
					if (e.key === 'Enter' && e.metaKey) {
						e.preventDefault();
						insertHow();
					} else if (e.key === 'Backspace' && text === '') {
						e.preventDefault();
						deleteHow();
					} else if (e.key === 'ArrowRight' && e.metaKey) {
						e.preventDefault();
						indentHow(true);
					} else if (e.key === 'ArrowLeft' && e.metaKey) {
						e.preventDefault();
						unindentHow(true);
					} else if (e.key === 'ArrowDown') {
						const lines = text.split('\n');
						if (input && input.selectionEnd >= text.length - lines[lines.length - 1].length) {
							e.preventDefault();
							moveVertically(1);
						}
					} else if (e.key === 'ArrowUp') {
						const lines = text.split('\n');
						if (input && input.selectionEnd <= lines[0].length) {
							e.preventDefault();
							moveVertically(-1);
						}
					}
				}}
			/>
		</div>
	{/if}
	<div class="meta">
		<Visibility
			level={how.visibility}
			edit={(vis) =>
				vis === 'public' || vis === 'org' || vis === 'admin'
					? Organizations.updateHowVisibility(how, vis)
					: undefined}
		/>
		<Button action={() => unindentHow(false)} active={getUnindent() !== undefined}>&lt;</Button>
		<Button action={() => indentHow(false)} active={getIndent() !== undefined}>&gt;</Button>
		<ARCI {how} {process} />
		<Button action={insertHow}>+</Button>
		<Button action={deleteHow} active={canDelete()}>×</Button>
	</div>
	<ol>
		{#each how.how
			.map((h) => $org.getHow(h))
			.filter((h) => h !== undefined) as subhow, index (subhow ? subhow.id : index)}
			<li><svelte:self how={subhow} {process} /></li>
		{/each}
	</ol>
</div>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}

	.main,
	.meta {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
		align-items: baseline;
	}

	.complete {
		width: 1em;
		height: 1em;
		background: var(--chrome);
		padding: var(--padding);
		border-radius: 50%;
		font-size: var(--font-size);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		cursor: pointer;
		user-select: none;
	}

	.complete:focus {
		outline: var(--focus) solid var(--thickness);
	}

	textarea {
		flex: 1;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		border: none;
		padding: var(--padding);
		min-height: calc(1em);
		resize: none;
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
		border-color: transparent;
	}

	textarea.done {
		text-decoration: line-through;
	}

	textarea.pending {
		font-style: italic;
		background: var(--chrome);
		border-radius: var(--radius);
	}
</style>
