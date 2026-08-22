<script lang="ts">
	import Dialog from './Dialog.svelte';
	import Options from './Options.svelte';
	import Field from './Field.svelte';
	import Labeled from './Labeled.svelte';
	import Button from './Button.svelte';
	import Note from './Note.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Reference from '../markup/Reference';
	import MarkupLink from '../markup/Link';
	import Characters from '../markup/Text';
	import type Segment from '../markup/Segment';
	import type { LinkContext } from './editor/host';
	import { untrack } from 'svelte';
	import { find, targetFor } from './editor/references';

	interface Props {
		/** What is being made into a link, and what is already there if the caret was on one. */
		context: LinkContext;
		/** Nothing means take the reference out and keep its words. */
		insert: (segments: Segment[]) => void;
		close: () => void;
	}

	let { context, insert, close }: Props = $props();

	const org = getOrg();

	/** Roles and processes in one list, since `<name@target>` says both the same way. */
	let roles = $derived(org().shortRoles);
	let processes = $derived(org().shortProcesses);

	/** Values are prefixed so that one list can hold both without confusing an id for another. */
	let choices = $derived([
		undefined,
		...roles.map((role) => `role:${role.id}`),
		...processes.map((process) => `process:${process.id}`)
	]);

	function roleFor(value: string | undefined) {
		return value?.startsWith('role:') ? roles.find((r) => r.id === value.slice(5)) : undefined;
	}
	function processFor(value: string | undefined) {
		return value?.startsWith('process:')
			? processes.find((p) => p.id === value.slice(8))
			: undefined;
	}

	function titleOf(value: string | undefined): string {
		return roleFor(value)?.title ?? processFor(value)?.title ?? '';
	}

	/** What ReferenceView matches on, by the same rule it uses. */
	function targetOf(value: string | undefined): string {
		const item = roleFor(value) ?? processFor(value);
		return item ? targetFor(item) : '';
	}

	/** Whichever of the two the caret was already on, so reopening starts where it left off. */
	function existing(): string | undefined {
		if (context.kind !== 'reference' || context.target === undefined) return undefined;
		const role = find(roles, context.target);
		if (role) return `role:${role.id}`;
		const process = find(processes, context.target);
		return process ? `process:${process.id}` : undefined;
	}

	/*
	 * The fields start from what was there and are then the person's to change, so these read the
	 * opening state on purpose rather than following it. The dialog is built afresh each time it
	 * opens, which is what makes that the whole story.
	 */
	let choice = $state<string | undefined>(untrack(() => existing()));
	let address = $state(untrack(() => (context.kind === 'link' ? (context.target ?? '') : '')));
	let label = $state(untrack(() => context.text));

	/** A web address wins if one has been typed, since choosing is the more common path. */
	let valid = $derived(choice !== undefined || address.trim().length > 0);

	function submit() {
		if (!valid) return;
		if (address.trim().length > 0) {
			const url = address.trim();
			insert([new MarkupLink(label.trim().length > 0 ? label.trim() : url, url)]);
		} else {
			const title = titleOf(choice);
			insert([new Reference(label.trim().length > 0 ? label.trim() : title, targetOf(choice))]);
		}
		close();
	}

	function remove() {
		// Keep the words, drop the link, which is otherwise a thing with no way back out of it.
		insert(context.text.length > 0 ? [new Characters('', context.text)] : []);
		close();
	}
</script>

<Dialog {close}>
	<h2>{context.target === undefined ? 'Insert a link' : 'Edit this link'}</h2>

	<Labeled label="Role or process" id="reference-target">
		<Options
			id="reference-target"
			tip="Choose a role or process to refer to"
			bind:selection={choice}
			options={choices}
			empty
			searchable={{
				placeholder: 'Find a role or process',
				include: (item, query) =>
					titleOf(item).toLocaleLowerCase().includes(query.toLocaleLowerCase())
			}}
			view={{ snippet: Choice, data: [] }}
			change={(value) => {
				choice = value;
				// Choosing something means it is not a web address, and an empty label takes its name.
				if (value !== undefined) address = '';
				if (label.trim().length === 0) label = titleOf(value);
				return true;
			}}
		/>
	</Labeled>

	<Labeled label="Or a web address">
		<Field fill label="" bind:text={address} placeholder="https://" active={choice === undefined} />
	</Labeled>

	<Labeled label="Words to show">
		<Field fill label="" bind:text={label} placeholder="Leave empty to use its name" />
	</Labeled>

	<Note>A reference keeps up with the role or process it points at, wherever it is shown.</Note>

	<div class="actions">
		<Button
			tip={context.target === undefined ? 'Insert this link' : 'Update this link'}
			active={valid}
			action={submit}
		>
			{context.target === undefined ? 'Insert' : 'Update'}
		</Button>
		{#if context.target !== undefined}
			<Button tip="Remove the link and keep the words" action={remove}>Remove</Button>
		{/if}
		<Button tip="Close without changing anything" action={close}>Cancel</Button>
	</div>
</Dialog>

{#snippet Choice(value: string | undefined)}
	<div class="choice">
		{#if roleFor(value)}<RoleLink role={roleFor(value)} />
		{:else if processFor(value)}<ProcessLink process={processFor(value)} />
		{:else}&mdash;{/if}
	</div>
{/snippet}

<style>
	.choice {
		display: inline-block;
		padding: var(--padding);
	}

	.actions {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
		margin-block-start: calc(2 * var(--padding));
	}
</style>
