<script lang="ts">
	import type { HowRow, ProcessRow } from '$database/OrganizationsDB';
	import { getContext, tick } from 'svelte';
	import Visibility from './Visibility.svelte';
	import { addError, getDB, getErrors, getOrg, queryOrError } from './contexts';
	import type { HowID } from '$types/Organization';
	import Button, { Delete } from './Button.svelte';
	import type { Writable } from 'svelte/store';
	import ARCI from './ARCI.svelte';
	import MarkupView from './MarkupView.svelte';
	import BlocksView from './BlocksView.svelte';
	import { parse } from '../markup/parser';
	import Status from './Status.svelte';

	export let how: HowRow;
	export let process: ProcessRow;
	export let editable: boolean;

	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	const focusID = getContext<Writable<string | undefined>>('focusID');

	let input: HTMLTextAreaElement;
	let text = how.what;
	// Helps us keep track of whether to give this an HTML ID for purposes of focusing.
	let deleted = false;

	function save(newText: string) {
		return queryOrError(errors, $db.updateHowText(how, newText), "Couldn't update step text.");
	}

	function toggleDone() {
		$db.updateHowDone(how, how.done === 'no' ? 'pending' : how.done === 'pending' ? 'yes' : 'no');
	}

	async function insertHow() {
		// See if this how has a parent, and if so, insert after this how.
		const parent = $org.getHowParent(how.id);
		if (parent) {
			const { error, id } = await $db.insertHow(process, parent, parent.how.indexOf(how.id) + 1);
			if (error) addError(errors, 'Unable to insert how.', error);
			else if (id) focusID.set(id);
		}
		// Otherwise, insert at the first position of this how.
		else {
			const { error, id } = await $db.insertHow(process, how, 0);
			if (error) addError(errors, 'Unable to insert how.', error);
			if (id) focusID.set(id);
		}
	}

	function canDelete() {
		const parent = $org.getHowParent(how.id);
		return (
			parent &&
			process.howid !== how.id &&
			!(parent.id === process.howid && parent.how.length === 0)
		);
	}

	async function deleteHow() {
		const parent = $org.getHowParent(how.id);
		if (parent && canDelete()) {
			const newFocusID =
				parent.how.length === 1 || parent.how[0] === how.id
					? parent.id
					: parent.how[parent.how.indexOf(how.id) - 1];

			const error = await queryOrError(errors, $db.deleteHow(parent, how), "Couldn't delete how.");
			if (error) return;

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
			const error = await queryOrError(
				errors,
				$db.moveHow(how, parent, previousHow, previousHow.how.length),
				"Couldn't indent how."
			);
			if (error) return;
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
			const error = await queryOrError(
				errors,
				$db.moveHow(how, parent, grandparent, grandparent.how.indexOf(parent.id) + 1),
				"Couldn't unindent how."
			);
			if (error) return;
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
				aria-disabled={!editable}
				aria-checked={how.done === 'no' ? 'false' : how.done === 'pending' ? 'mixed' : 'true'}
				tabindex={editable ? 0 : null}
				on:keydown={(event) =>
					editable && (event.key === 'Enter' || event.key === ' ') ? toggleDone() : undefined}
				on:pointerdown={editable ? toggleDone : undefined}
			>
				{#if how.done === 'no'}&nbsp;{:else if how.done === 'pending'}…{:else}✓{/if}
			</div>
			{#if editable}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					style:width="100%"
					class:done={how.done === 'yes'}
					class:pending={how.done === 'pending'}
					on:keydown={(e) => {
						// if (e.key === 'Enter' && e.metaKey) {
						// 	e.preventDefault();
						// 	insertHow();
						// } else if (e.key === 'Backspace' && e.metaKey) {
						// 	e.preventDefault();
						// 	deleteHow();
						// } else if (e.key === 'ArrowRight' && e.altKey) {
						// 	e.preventDefault();
						// 	indentHow(true);
						// } else if (e.key === 'ArrowLeft' && e.altKey) {
						// 	e.preventDefault();
						// 	unindentHow(true);
						// } else if (e.key === 'ArrowDown') {
						// 	const lines = text.split('\n');
						// 	if (input && input.selectionEnd >= text.length - lines[lines.length - 1].length) {
						// 		e.preventDefault();
						// 		moveVertically(1);
						// 	}
						// } else if (e.key === 'ArrowUp') {
						// 	const lines = text.split('\n');
						// 	if (input && input.selectionEnd <= lines[0].length) {
						// 		e.preventDefault();
						// 		moveVertically(-1);
						// 	}
						// }
					}}
				>
					<MarkupView
						markup={text}
						edit={editable ? save : undefined}
						placeholder="Explain this step…"
						id={deleted ? '' : `how-${how.id}`}
					/>
				</div>
			{:else}
				<BlocksView blocks={parse(text).blocks} />
			{/if}
			{#if editable}
				<Button
					tip="Unindent this step"
					action={() => unindentHow(false)}
					active={getUnindent() !== undefined}>&lt;</Button
				>
				<Button
					tip="Indent this step"
					action={() => indentHow(false)}
					active={getIndent() !== undefined}>&gt;</Button
				>
				<Button tip="Insert a new step after this step" action={insertHow}>+</Button>
				<Button tip="Delete this step" action={deleteHow} active={canDelete()}>{Delete}</Button>
			{/if}
		</div>
	{/if}
	<div class="meta">
		{#if editable}
			<Visibility
				tip="Change visibility of this step"
				level={how.visibility}
				edit={(vis) =>
					vis === 'public' || vis === 'org' || vis === 'admin'
						? $db.updateHowVisibility(how, vis)
						: undefined}
			/>
		{:else}
			<Status status={how.visibility} />
		{/if}
		<ARCI {how} verbose={false} {editable} />
	</div>
	<ol>
		{#each how.how
			.map((h) => $org.getHow(h))
			.filter((h) => h !== undefined) as subhow, index (subhow ? subhow.id : index)}
			<li><svelte:self how={subhow} {process} {editable} /></li>
		{/each}
	</ol>
</div>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}

	.main {
		width: 100%;
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
		font-size: var(--font-size);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		cursor: pointer;
		user-select: none;
	}

	.complete[aria-disabled='true'] {
		cursor: not-allowed;
		background: none;
	}

	.complete:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
