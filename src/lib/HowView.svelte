<script lang="ts">
	import HowView from './HowView.svelte';
	import type { HowRow, ProcessRow } from '$database/OrganizationsDB';
	import { getContext, tick } from 'svelte';
	import Visibility from './Visibility.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, addError, queryOrError } from '$routes/+layout.svelte';
	import Button, { Delete } from './Button.svelte';
	import type { Writable } from 'svelte/store';
	import ARCI from './ARCI.svelte';
	import MarkupView from './MarkupView.svelte';
	import Status from './Status.svelte';

	interface Props {
		how: HowRow;
		process: ProcessRow;
		editable: boolean;
	}

	let { how, process, editable }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();

	const focusID = getContext<Writable<string | undefined>>('focusID');

	let parent = $derived(org.getHowParent(how.id));
	let index = $derived(parent?.how.indexOf(how.id) ?? -1);
	let length = $derived(parent?.how.length ?? -1);
	let subhows = $derived(how.how.map((h) => org.getHow(h)).filter((h) => h !== undefined));

	let text = how.what;
	// Helps us keep track of whether to give this an HTML ID for purposes of focusing.
	let deleted = $state(false);

	function save(newText: string) {
		return queryOrError(db.updateHowText(how, newText), "Couldn't update step text.");
	}

	function toggleDone() {
		db.updateHowDone(how, how.done === 'no' ? 'pending' : how.done === 'pending' ? 'yes' : 'no');
	}

	async function insertHow() {
		// See if this how has a parent, and if so, insert after this how.
		if (parent) {
			const { error, id } = await db.insertHow(
				process,
				parent.visibility,
				parent,
				parent.how.indexOf(how.id) + 1
			);
			if (error) addError('Unable to insert how.', error);
			else if (id) focusID.set(id);
		}
		// Otherwise, insert at the first position of this how.
		else {
			const { error, id } = await db.insertHow(process, how.visibility, how, 0);
			if (error) addError('Unable to insert how.', error);
			if (id) focusID.set(id);
		}
	}

	function canDelete() {
		return (
			parent &&
			process.howid !== how.id &&
			!(parent.id === process.howid && parent.how.length === 0)
		);
	}

	async function deleteHow() {
		if (parent && canDelete()) {
			const newFocusID =
				parent.how.length === 1 || parent.how[0] === how.id
					? parent.id
					: parent.how[parent.how.indexOf(how.id) - 1];

			const error = await queryOrError(db.deleteHow(parent, how), "Couldn't delete how.");
			if (error) return;

			focusID.set(newFocusID);
		}
	}

	function getIndent() {
		if (parent && index > 0) {
			const previousID = parent.how[index - 1];
			const previousHow = org.getHow(previousID);
			if (previousHow) return [parent, previousHow];
		}
		return undefined;
	}

	async function indentHow(focus: boolean) {
		const result = getIndent();
		if (result) {
			const [parent, previousHow] = result;
			deleted = true;
			const error = await queryOrError(
				db.reparentHow(how, parent, previousHow, previousHow.how.length),
				"Couldn't indent how."
			);
			if (error) return;
			await tick();
			if (focus) focusID.set(how.id);
		}
	}

	function getUnindent() {
		if (parent) {
			const grandparent = org.getHowParent(parent.id);
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
				db.reparentHow(how, parent, grandparent, grandparent.how.indexOf(parent.id) + 1),
				"Couldn't unindent how."
			);
			if (error) return;
			await tick();
			if (focus) focusID.set(how.id);
		}
	}

	// function enumerate(how: HowRow, list: HowID[] = []) {
	// 	list.push(how.id);
	// 	for (const subhow of how.how
	// 		.map((id) => org.getHow(id))
	// 		.filter((h): h is HowRow => h !== undefined)) {
	// 		enumerate(subhow, list);
	// 	}
	// 	return list;
	// }

	// function focusVertically(dir: -1 | 1) {
	// 	const index = getIndex();
	// 	if (index >= 0 && process.howid) {
	// 		const root = org.getHow(process.howid);
	// 		if (root) {
	// 			const list = enumerate(root);
	// 			if (index >= 0 && index + dir < list.length) {
	// 				const next = list[index + dir];
	// 				document.getElementById(`how-${next}`)?.focus();
	// 			}
	// 		}
	// 	}
	// }

	async function moveVertically(dir: -1 | 1) {
		const parent = org.getHowParent(how.id);
		if (parent) {
			if (index >= 0 && index + dir < parent.how.length) {
				const error = await queryOrError(
					db.moveHow(how, parent, index + dir),
					"Couldn't move how."
				);
				if (error) return;
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
				onkeydown={(event) =>
					editable && (event.key === 'Enter' || event.key === ' ') ? toggleDone() : undefined}
				onpointerdown={editable ? toggleDone : undefined}
			>
				{#if how.done === 'no'}&nbsp;{:else if how.done === 'pending'}…{:else}✓{/if}
			</div>
			{#if editable}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					style:width="100%"
					class:done={how.done === 'yes'}
					class:pending={how.done === 'pending'}
					onkeydown={(e) => {
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
				<MarkupView markup={text} edit={undefined} placeholder="Explain this step…" />
			{/if}
			{#if editable}
				<Button tip="Move up" action={() => moveVertically(-1)} active={index > 0}>⏶</Button>
				<Button tip="Move down" action={() => moveVertically(1)} active={index + 1 < length}
					>⏷</Button
				>
				<Button
					tip="Unindent this step"
					action={() => unindentHow(false)}
					active={getUnindent() !== undefined}>⏴</Button
				>
				<Button
					tip="Indent this step"
					action={() => indentHow(false)}
					active={getIndent() !== undefined}>⏵</Button
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
						? db.updateHowVisibility(how, vis)
						: undefined}
			/>
		{:else}
			<Status status={how.visibility} />
		{/if}
		<ARCI {how} verbose={false} {editable} />
	</div>
	{#if subhows.length > 0}
		<div class="steps">
			{#each subhows as subhow (subhow.id)}
				<HowView how={subhow} {process} {editable} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: 0;
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

	.meta {
		margin-left: calc(1em + var(--padding));
	}

	.complete {
		min-width: 1em;
		height: 1em;
		background: var(--chrome);
		font-size: var(--font-size);
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: space-around;
		cursor: pointer;
		user-select: none;
	}

	.complete[aria-disabled='true'] {
		cursor: not-allowed;
		transform: translateY(0.1em);
	}

	.complete:focus {
		outline: var(--focus) solid var(--thickness);
	}

	.steps {
		margin-block-start: calc(2 * var(--padding));
		margin-inline-start: 1em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		padding-left: 1em;
		border-left: 1px solid var(--border);
	}
</style>
