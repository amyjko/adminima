<script lang="ts">
	import PersonLink from './ProfileLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import { type ChangeRow } from '../database/OrganizationsDB';
	import Oops from './Oops.svelte';
	import Button, { Delete } from './Button.svelte';
	import { goto } from '$app/navigation';
	import Title from './Title.svelte';
	import Status from './Status.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
	import timestampToDate from '$database/timestampToDate';
	import Select from './Select.svelte';
	import Tip from './Tip.svelte';
	import Loading from './Loading.svelte';
	import CommentView from './CommentView.svelte';
	import Header from './Header.svelte';
	import Visibility from './Visibility.svelte';
	import Table from './Table.svelte';
	import Labeled from './Labeled.svelte';

	export let change: ChangeRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	const Statuses = { triage: 'Triage', backlog: 'Backlog', active: 'Active', done: 'Done' };

	$: isAdmin = $user && $org.hasAdminPerson($user.id);
	$: editable = $user && (isAdmin || change.who === $user.id);
	$: unselectedRoles = $org
		.getRoles()
		.filter((r) => !change.roles.includes(r.id))
		.sort((a, b) => a.title.localeCompare(b.title));
	$: unselectedProcesses = $org
		.getProcesses()
		.filter((p) => !change.processes.includes(p.id))
		.sort((a, b) => a.title.localeCompare(b.title));

	let processSelection: string | undefined = undefined;
	let roleSelection: string | undefined = undefined;

	let newComment: string = '';
</script>

<Title
	title={change.what}
	kind="change"
	edit={$user && isAdmin && change.who === $user.id
		? (text) =>
				queryOrError(
					errors,
					$db.udpateChangeWhat(change, text),
					"Couldn't update the change's title"
				)
		: undefined}
>
	<Status status={change.status} />
	{#if editable}
		<Select
			tip="Change the status of this change"
			selection={change.status}
			options={Object.entries(Statuses).map(([key, value]) => ({ value: key, label: value }))}
			change={async (status) => {
				if (
					$user &&
					(status === 'triage' || status === 'active' || status === 'done' || status === 'backlog')
				)
					return await queryOrError(
						errors,
						$db.updateChangeStatus(change, status, $user.id),
						"Couldn't update the change's status."
					);
				else return null;
			}}
		/>

		<Visibility
			level={change.visibility}
			tip="Edit this change's visibility"
			edit={(vis) => $db.updateChangeVisibility(change, vis)}
		/>
	{/if}
</Title>

<Tip admin>Use changes as a place to capture progress on a change and to document decisions.</Tip>

<Paragraph>
	<PersonLink profile={$org.getProfileWithPersonID(change.who)} /> reported this problem on <TimeView
		date={timestampToDate(change.when)}
	/>.</Paragraph
>

<Paragraph>
	{#if editable}<Select
			tip="Choose who is leading this change"
			selection={change.lead ?? undefined}
			options={[
				{ value: undefined, label: '—' },
				...$org.getProfiles().map((person) => {
					return { value: person.id, label: person.name.length === 0 ? person.email : person.name };
				})
			]}
			change={(person) => {
				queryOrError(
					errors,
					$db.updateChangeLead(change, person ?? null),
					"Couldn't update change processes."
				);
			}}
		/>{:else if change.lead}<PersonLink profile={$org.getProfileWithID(change.lead)} />{:else}No one{/if}
	is in currently leading this change project.</Paragraph
>

<Header>Problem</Header>

<MarkupView
	markup={change.description}
	placeholder="No description"
	edit={editable
		? (text) =>
				queryOrError(
					errors,
					$db.updateChangeDescription(change, text),
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
				queryOrError(
					errors,
					$db.updateChangeProposal(change, text),
					"Couldn't update change description."
				)
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
						errors,
						$db.updateChangeRoles(
							change,
							change.roles.filter((r) => r !== role)
						),
						"Couldn't update change roles."
					)}
			>
				{Delete}</Button
			></RoleLink
		>
	{:else}
		&mdash;
	{/each}
	{#if unselectedRoles.length > 0}
		<Select
			tip="Add a role that is affected by this change."
			options={[
				{ value: undefined, label: '▼' },
				...unselectedRoles.map((role) => {
					return { value: role.id, label: role.title };
				})
			]}
			selection={roleSelection}
			change={(r) => {
				if (r !== undefined) {
					queryOrError(
						errors,
						$db.updateChangeRoles(change, Array.from(new Set([...change.roles, r]))),
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
			action={() =>
				queryOrError(
					errors,
					$db.updateChangeProcesses(
						change,
						change.processes.filter((p) => p !== process)
					),
					"Couldn't update change processes."
				)}
		>
			{Delete}</Button
		>
	{:else}
		&mdash;
	{/each}
	{#if unselectedProcesses.length > 0}
		<Select
			tip="Add a process that is affected by this change."
			options={[
				{ value: undefined, label: '▼' },
				...unselectedProcesses.map((process) => {
					return { value: process.id, label: process.title };
				})
			]}
			selection={processSelection}
			change={(p) => {
				if (p !== undefined) {
					queryOrError(
						errors,
						$db.updateChangeProcesses(change, Array.from(new Set([...change.processes, p]))),
						"Couldn't update change processes."
					);
					processSelection = undefined;
				}
			}}
		/>
	{/if}
</div>

<Header>Discussion</Header>

{#await $db.getComments(change.comments)}
	<Loading />
{:then comments}
	{#if comments.data}
		<div class="comments">
			{#if $user}
				<Labeled label="Have a comment?">
					<MarkupView bind:markup={newComment} placeholder="Add a comment" editing />
				</Labeled>
				<Button
					end
					tip="Add a comment to this change."
					action={async () => {
						const result = await $db.addComment(
							$org.getID(),
							$user.id,
							newComment,
							'suggestions',
							change.id,
							comments.data.map((c) => c.id)
						);
						if (result) return false;
						newComment = '';
						return true;
					}}>Submit</Button
				>
			{/if}

			<Table>
				<tbody>
					{#each comments.data.sort((a, b) => timestampToDate(b.when).getTime() - timestampToDate(a.when).getTime()) as comment}
						<CommentView
							{comment}
							remove={$user && comment.who === $user.id
								? (comment) => $db.deleteComment(change, 'suggestions', comment)
								: undefined}
						/>
					{:else}
						No changes yet.
					{/each}
				</tbody>
			</Table>
		</div>
	{:else}
		Unable to load comment history.
	{/if}
{/await}

{#if editable}
	<hr />

	<Paragraph>Is this request no longer needed? You can permanently delete it.</Paragraph>
	<Button
		tip="Permanently delete this change."
		action={async () => {
			const { error } = await $db.deleteChange(change.id);
			if (error) addError(errors, "Couldn't delete this change.", error);
			else goto(`/org/${$org.getPath()}`);
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
