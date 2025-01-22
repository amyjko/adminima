<script lang="ts">
	import PersonLink, { ProfileItem } from './ProfileLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import MarkupView from './MarkupView.svelte';
	import RoleLink, { RoleItem } from './RoleLink.svelte';
	import ProcessLink, { ProcessItem } from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import { type ChangeRow, type CommentRow } from '../database/OrganizationsDB';
	import Oops from './Oops.svelte';
	import Button, { Delete } from './Button.svelte';
	import { goto } from '$app/navigation';
	import Title from './Title.svelte';
	import Status from './Status.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import timestampToDate from '$database/timestampToDate';
	import Tip from './Tip.svelte';
	import Loading from './Loading.svelte';
	import CommentView from './CommentView.svelte';
	import Header from './Header.svelte';
	import Visibility from './VisibilityChooser.svelte';
	import Table from './Table.svelte';
	import StatusChooser from './StatusChooser.svelte';
	import { isStatus } from './status';
	import NewComment from './NewComment.svelte';
	import type { CommentID } from '$types/Organization';
	import Field from './Field.svelte';
	import Options from './Options.svelte';

	interface Props {
		change: ChangeRow;
	}

	let { change }: Props = $props();

	let deleteError: string | undefined = undefined;

	const context = getOrg();
	let org = $derived(context?.org);

	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && org?.hasAdminPerson($user.id));
	let editable = $derived(
		$user && (isAdmin || change.who === $user.id || change.lead === $user.id)
	);
	let unselectedRoles = $derived(
		org
			.getRoles()
			.filter((r) => !change.roles.includes(r.id))
			.sort((a, b) => a.title.localeCompare(b.title))
	);
	let unselectedProcesses = $derived(
		org
			.getProcesses()
			.filter((p) => !change.processes.includes(p.id))
			.sort((a, b) => a.title.localeCompare(b.title))
	);

	async function loadComments(commentIDs: CommentID[]): Promise<CommentRow[] | null> {
		const { data, error } = await db.getComments(commentIDs);
		if (error) return null;
		else return data;
	}

	// When change changes, reload the comments. undefined = loading, null = error.
	let comments = $state<undefined | null | CommentRow[]>(undefined);
	$effect(() => {
		loadComments(change.comments).then((newComments) => (comments = newComments));
	});

	let processSelection: string | undefined = $state(undefined);
	let roleSelection: string | undefined = $state(undefined);
</script>

<Title
	title={change.what}
	kind="change"
	edit={editable
		? (text) =>
				queryOrError(db.udpateChangeWhat(change, text), "Couldn't update the change's title")
		: undefined}
>
	{#if editable}
		<StatusChooser
			tip="Change the status of this change"
			value={change.status}
			none={false}
			change={async (status: string | undefined) => {
				if ($user && status !== undefined && isStatus(status))
					return await queryOrError(
						db.updateChangeStatus(change, status, $user.id),
						"Couldn't update the change's status."
					);
				else return null;
			}}
		/>
	{:else}
		<Status status={change.status} />
	{/if}

	{#if editable}
		<Visibility
			level={change.visibility}
			tip="Edit this change's visibility"
			edit={(vis) => db.updateChangeVisibility(change, vis)}
		/>
	{/if}
</Title>

<Tip admin>Use this page to capture progress on a change and to document decisions about it.</Tip>

<Paragraph>
	<PersonLink profile={org.getProfileWithPersonID(change.who)} /> reported this problem on <TimeView
		date={timestampToDate(change.when)}
	/>.</Paragraph
>

<div>
	{#if editable}
		<Options
			id="lead-chooser"
			tip="Choose who is leading this change"
			selection={change.lead ?? undefined}
			options={[undefined, ...org.getProfiles().map((person) => person.id)]}
			view={ProfileItem}
			change={(person) => {
				queryOrError(
					db.updateChangeLead(change, person ?? null),
					"Couldn't update change processes."
				);
			}}
		/>
	{:else if change.lead}
		<PersonLink profile={org.getProfileWithID(change.lead)} />
	{:else}
		No one
	{/if} is currently leading this change.
</div>

<Paragraph>
	Review this change on <Field
		text={change.review ? new Date(Date.parse(change.review)).toLocaleDateString() : ''}
		placeholder="date"
		invalid={(text: string) => {
			if (text.length > 0 && isNaN(Date.parse(text))) return 'Not a valid date.';
			return undefined;
		}}
		done={(text) => {
			queryOrError(
				db.updateChangeReview(
					change,
					text.length === 0 ? null : new Date(Date.parse(text)).toISOString()
				),
				"Couldn't update the change's review date."
			);
		}}
	></Field>.
</Paragraph>

<Header>Problem</Header>

<MarkupView
	markup={change.description}
	placeholder="No description"
	edit={editable
		? (text) =>
				queryOrError(
					db.updateChangeDescription(change, text),
					"Couldn't update change description."
				)
		: undefined}
/>

<Header>Proposal</Header>

<MarkupView
	markup={change.proposal}
	placeholder="No proposal"
	edit={editable
		? (text) =>
				queryOrError(db.updateChangeProposal(change, text), "Couldn't update change description.")
		: undefined}
/>

<Header>Affected roles</Header>
<div class="row">
	{#each change.roles as role}
		<RoleLink roleID={role}
			><Button
				chromeless
				tip="Remove this role from the affected roles."
				action={() =>
					queryOrError(
						db.updateChangeRoles(
							change,
							change.roles.filter((r) => r !== role)
						),
						"Couldn't update change roles."
					)}
			>
				{Delete}</Button
			></RoleLink
		>
	{/each}
	{#if unselectedRoles.length > 0}
		<Options
			id="role-chooser"
			tip="Add a role that is affected by this change."
			options={[undefined, ...unselectedRoles.map((role) => role.id)]}
			selection={roleSelection}
			view={RoleItem}
			empty={false}
			change={(r) => {
				if (r !== undefined) {
					queryOrError(
						db.updateChangeRoles(change, Array.from(new Set([...change.roles, r]))),
						"Couldn't update change roles."
					);
					roleSelection = undefined;
				}
			}}
		/>
	{/if}
</div>

<Header>Affected processes</Header>
<div class="row">
	{#each change.processes as process}
		<ProcessLink processID={process} />
		<Button
			tip="Remove this process from the affected processes."
			chromeless
			action={() =>
				queryOrError(
					db.updateChangeProcesses(
						change,
						change.processes.filter((p) => p !== process)
					),
					"Couldn't update change processes."
				)}
		>
			{Delete}</Button
		>
	{/each}
	{#if unselectedProcesses.length > 0}
		<Options
			id="process-chooser"
			tip="Add a process that is affected by this change."
			options={[undefined, ...unselectedProcesses.map((process) => process.id)]}
			selection={processSelection}
			view={ProcessItem}
			empty={false}
			change={(p) => {
				if (p !== undefined) {
					queryOrError(
						db.updateChangeProcesses(change, Array.from(new Set([...change.processes, p]))),
						"Couldn't update change processes."
					);
					processSelection = undefined;
				}
			}}
		/>
	{/if}
</div>

<Header>Discussion</Header>

<div class="comments">
	<NewComment {change} />
	{#if comments === undefined}
		<Loading />
	{:else if comments === null}
		Unable to load comment history.
	{:else}
		<Table full={false}>
			<tbody>
				{#each comments.toSorted((a, b) => timestampToDate(b.when).getTime() - timestampToDate(a.when).getTime()) as comment (comment.id)}
					<CommentView
						{comment}
						remove={$user && comment.who === $user.id
							? (comment) => db.deleteComment(change, 'suggestions', comment)
							: undefined}
					/>
				{:else}
					<tr><td>No changes yet.</td></tr>
				{/each}
			</tbody>
		</Table>
	{/if}
</div>

{#if editable}
	<hr />

	<Paragraph>Is this request no longer needed? You can permanently delete it.</Paragraph>
	<Button
		tip="Permanently delete this change."
		action={async () => {
			const { error } = await db.deleteChange(change.id);
			if (error) addError("Couldn't delete this change.", error);
			else goto(`/org/${org.getPath()}`);
		}}
		warning>{Delete} Delete this change</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
{/if}

<style>
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--padding);
	}

	.comments {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
		width: 100%;
	}
</style>
