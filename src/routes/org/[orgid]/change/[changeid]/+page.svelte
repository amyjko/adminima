<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import PersonLink, { ProfileItem } from '$lib/ProfileLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink, { RoleItem } from '$lib/RoleLink.svelte';
	import ProcessLink, { ProcessItem } from '$lib/ProcessLink.svelte';
	import TimeView from '$lib/TimeView.svelte';
	import { type CommentRow } from '$database/Organization';
	import Button, { Delete } from '$lib/Button.svelte';
	import { goto } from '$app/navigation';
	import Title from '$lib/Title.svelte';
	import Status from '$lib/Status.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import timestampToDate from '$database/timestampToDate';
	import Tip from '$lib/Tip.svelte';
	import Loading from '$lib/Loading.svelte';
	import CommentView from '$lib/CommentView.svelte';
	import Header from '$lib/Header.svelte';
	import Visibility from '$lib/VisibilityChooser.svelte';
	import Table from '$lib/Table.svelte';
	import StatusChooser from '$lib/StatusChooser.svelte';
	import { isStatus } from '$lib/status';
	import NewComment from '$lib/NewComment.svelte';
	import type { CommentID } from '$database/Organization';
	import Field from '$lib/Field.svelte';
	import Options from '$lib/Options.svelte';
	import Flow from '$lib/Flow.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();
	const change = $derived(data.change);
	const roles = $derived(data.roles);
	const profiles = $derived(data.profiles);
	const processes = $derived(data.processes);

	const context = getOrg();
	let organization = $derived(context.org);

	let deleteError: string | undefined = undefined;

	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && context.admin);
	let editable = $derived(
		$user && (isAdmin || change.who === $user.id || change.lead === $user.id)
	);
	let unselectedRoles = $derived(
		roles.filter((r) => !change.roles.includes(r.id)).sort((a, b) => a.title.localeCompare(b.title))
	);
	let unselectedProcesses = $derived(
		processes
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
	<PersonLink profile={Organization.getProfileWithPersonID(profiles, change.who) ?? undefined} />
	reported this problem on <TimeView date={timestampToDate(change.when)} />.</Paragraph
>

<div>
	{#if editable}
		<Options
			id="lead-chooser"
			tip="Choose who is leading this change"
			selection={change.lead ?? undefined}
			options={[undefined, ...profiles.map((person) => person.id)]}
			view={{ snippet: ProfileItem, data: profiles }}
			searchable={{
				placeholder: 'name',
				include: (person, query) =>
					(Organization.getProfileWithNameOrEmail(profiles, person) ?? '')
						.toLowerCase()
						.includes(query.toLowerCase())
			}}
			change={async (person) =>
				(await queryOrError(
					db.updateChangeLead(change, person ?? null),
					"Couldn't update change processes."
				)) === null}
		/>
	{:else if change.lead}
		<PersonLink profile={Organization.getProfileWithID(profiles, change.lead) ?? undefined} />
	{:else}
		No one
	{/if} is currently leading this change.
</div>

<Flow>
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
</Flow>

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
		<RoleLink role={roles.find((r) => r.id === role)}
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
			bind:selection={roleSelection}
			view={{ snippet: RoleItem, data: roles }}
			empty={false}
			change={async (r) => {
				if (r !== undefined) {
					const error = await queryOrError(
						db.updateChangeRoles(change, Array.from(new Set([...change.roles, r]))),
						"Couldn't update change roles."
					);
					roleSelection = undefined;
					return error === null;
				} else return true;
			}}
		/>
	{/if}
</div>

<Header>Affected processes</Header>
<div class="row">
	{#each change.processes as process}
		<ProcessLink process={processes.find((p) => p.id === process) ?? null} />
		<Button
			tip="Remove this process from the affected processes."
			chromeless
			action={async () =>
				(await queryOrError(
					db.updateChangeProcesses(
						change,
						change.processes.filter((p) => p !== process)
					),
					"Couldn't update change processes."
				)) !== null}
		>
			{Delete}</Button
		>
	{/each}
	{#if unselectedProcesses.length > 0}
		<Options
			id="process-chooser"
			tip="Add a process that is affected by this change."
			options={[undefined, ...unselectedProcesses.map((process) => process.id)]}
			bind:selection={processSelection}
			view={{ snippet: ProcessItem, data: processes }}
			empty={false}
			change={async (p) => {
				if (p !== undefined) {
					const error = await queryOrError(
						db.updateChangeProcesses(change, Array.from(new Set([...change.processes, p]))),
						"Couldn't update change processes."
					);
					processSelection = undefined;
					return error === null;
				}
				return true;
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
						{profiles}
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
			else
				await goto(`/org/${Organization.getPath(organization)}/changes`, { invalidateAll: true });
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
