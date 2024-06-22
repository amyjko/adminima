<script lang="ts">
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import { type SuggestionRow } from '../database/OrganizationsDB';
	import Oops from './Oops.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Title from './Title.svelte';
	import Quote from './Quote.svelte';
	import Status from './Status.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
	import timestampToDate from '$database/timestampToDate';
	import Select from './Select.svelte';
	import Tip from './Tip.svelte';
	import Loading from './Loading.svelte';
	import CommentView from './CommentView.svelte';
	import Header from './Header.svelte';
	import FormDialog from './FormDialog.svelte';

	export let suggestion: SuggestionRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	const Statuses = { triage: 'Triage', backlog: 'Backlog', active: 'Active', done: 'Done' };

	$: isAdmin = $user && $org.hasAdminPerson($user.id);
	$: editable = $user && (isAdmin || suggestion.who === $user.id);
	$: unselectedRoles = $org.getRoles().filter((r) => !suggestion.roles.includes(r.id));
	$: unselectedProcesses = $org.getProcesses().filter((p) => !suggestion.processes.includes(p.id));

	let newComment: string = '';
</script>

<Title
	title={suggestion.what}
	kind="suggestion"
	edit={$user && isAdmin && suggestion.who === $user.id
		? (text) =>
				queryOrError(
					errors,
					$db.updateSuggestionWhat(suggestion, text),
					"Couldn't update the suggestion's title"
				)
		: undefined}
>
	<Status status={suggestion.status} />
	{#if editable}
		<Select
			tip="Change the status of this suggestion"
			selection={suggestion.status}
			options={Object.entries(Statuses).map(([key, value]) => ({ value: key, label: value }))}
			change={async (status) => {
				if (
					$user &&
					(status === 'triage' || status === 'active' || status === 'done' || status === 'backlog')
				)
					return await queryOrError(
						errors,
						$db.updateSuggestionStatus(suggestion, status, $user.id),
						"Couldn't update the suggestion's status."
					);
				else return null;
			}}
		/>
	{/if}
</Title>

<Tip>Use suggestions as a place to capture progress on a change and to document decisions.</Tip>

<Paragraph
	>On <TimeView date={timestampToDate(suggestion.when)} />
	<PersonLink profile={$org.getProfileWithPersonID(suggestion.who)} /> reported:</Paragraph
>

<Quote
	><MarkupView
		markup={suggestion.description}
		placeholder="No description"
		edit={editable
			? (text) =>
					queryOrError(
						errors,
						$db.updateSuggestionDescription(suggestion, text),
						"Couldn't update suggestion description."
					)
			: undefined}
	/></Quote
>

<Header>Affected roles</Header>
<div class="row">
	{#each suggestion.roles as role}
		<RoleLink roleID={role} />
		<Button
			tip="Remove this role from the affected roles."
			action={() =>
				queryOrError(
					errors,
					$db.updateSuggestionRoles(
						suggestion,
						suggestion.roles.filter((r) => r !== role)
					),
					"Couldn't update suggestion roles."
				)}
		>
			x</Button
		>
	{:else}
		&mdash;
	{/each}
	{#if unselectedRoles.length > 0}
		<Select
			tip="Add a role that is affected by this suggestion."
			options={[
				{ value: undefined, label: '—' },
				...unselectedRoles.map((role) => {
					return { value: role.id, label: role.title };
				})
			]}
			selection={undefined}
			change={(r) =>
				r !== undefined
					? queryOrError(
							errors,
							$db.updateSuggestionRoles(suggestion, Array.from(new Set([...suggestion.roles, r]))),
							"Couldn't update suggestion roles."
					  )
					: undefined}
		/>
	{/if}
</div>

<Header>Affected processes</Header>
<div class="row">
	{#each suggestion.processes as process}
		<ProcessLink processID={process} />
		<Button
			tip="Remove this process from the affected processes."
			action={() =>
				queryOrError(
					errors,
					$db.updateSuggestionProcesses(
						suggestion,
						suggestion.processes.filter((p) => p !== process)
					),
					"Couldn't update suggestion processes."
				)}
		>
			x</Button
		>
	{:else}
		&mdash;
	{/each}
	{#if unselectedProcesses.length > 0}
		<Select
			tip="Add a process that is affected by this suggestion."
			options={[
				{ value: undefined, label: '—' },
				...unselectedProcesses.map((process) => {
					return { value: process.id, label: process.title };
				})
			]}
			selection={undefined}
			change={(p) =>
				p !== undefined
					? queryOrError(
							errors,
							$db.updateSuggestionProcesses(
								suggestion,
								Array.from(new Set([...suggestion.processes, p]))
							),
							"Couldn't update suggestion processes."
					  )
					: undefined}
		/>
	{/if}
</div>

<Header>Comments</Header>

{#await $db.getComments(suggestion.comments)}
	<Loading />
{:then comments}
	{#if comments.data}
		{#if $user}
			<FormDialog
				button="New comment…"
				showTip="Add a new comment on this suggestion."
				submit="Post"
				submitTip="Add this comment."
				header="Comment"
				explanation="What do you want to say?"
				valid={() => newComment.length > 0}
				action={() => {
					const result = $db.addComment(
						$org.getID(),
						$user.id,
						newComment,
						'suggestions',
						suggestion.id,
						comments.data.map((c) => c.id)
					);
					newComment = '';
					return result;
				}}
			>
				<textarea
					style:width="20em"
					style:height="8em"
					cols="20"
					bind:value={newComment}
				/></FormDialog
			>
		{/if}

		<table>
			<tbody>
				{#each comments.data.reverse() as comment}
					<CommentView
						{comment}
						remove={(comment) => $db.deleteComment(suggestion, 'suggestions', comment)}
					/>
				{:else}
					No changes yet.
				{/each}
			</tbody>
		</table>
	{:else}
		Unable to load history.
	{/if}
{/await}

{#if editable}
	<Paragraph>Is this request no longer needed? You can permanently delete it.</Paragraph>
	<Button
		tip="Permanently delete this suggestion."
		action={async () => {
			const org = suggestion.orgid;
			const { error } = await $db.deleteSuggestion(suggestion.id);
			if (error) addError(errors, "Couldn't delete this suggestion.", error);
			else goto(`/organization/${org}`);
		}}
		warning>Delete this suggestion</Button
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
</style>
