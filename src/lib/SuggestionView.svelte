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
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import Quote from './Quote.svelte';
	import Status from './Status.svelte';
	import { getDB, getOrg, getUser } from './contexts';
	import timestampToDate from '$database/timestampToDate';
	import CommentsView from './CommentsView.svelte';
	import Choice from './Choice.svelte';
	import Select from './Select.svelte';

	export let suggestion: SuggestionRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	const db = getDB();
	const Statuses = { triage: 'Triage', active: 'Active', done: 'Done', backlog: 'Backlog' };

	$: isAdmin = $user && $org.hasAdminPerson($user.id);
	$: editable = $user && isAdmin && suggestion.who === $user.id;
	$: unselectedRoles = $org.getRoles().filter((r) => !suggestion.roles.includes(r.id));
	$: unselectedProcesses = $org.getProcesses().filter((p) => !suggestion.processes.includes(p.id));
</script>

<Title
	title={suggestion.what}
	kind="suggestion"
	edit={$user && isAdmin && suggestion.who === $user.id
		? (text) => $db.updateSuggestionWhat(suggestion, text)
		: undefined}
>
	<Choice
		choice={suggestion.status}
		choices={Statuses}
		edit={async (status) => {
			if (
				$user &&
				(status === 'triage' || status === 'active' || status === 'done' || status === 'backlog')
			)
				return await $db.updateSuggestionStatus(suggestion, status, $user.id);
			else return null;
		}}><Status status={suggestion.status} /></Choice
	>
</Title>

<Paragraph
	>On <TimeView time={timestampToDate(suggestion.when).getTime()} />
	<PersonLink profile={$org.getProfileWithPersonID(suggestion.who)} /> reported:</Paragraph
>

<Quote
	><MarkupView
		markup={suggestion.description}
		unset="No description"
		edit={editable ? (text) => $db.updateSuggestionDescription(suggestion, text) : undefined}
	/></Quote
>

<div class="row">
	<Paragraph>This affects these roles:</Paragraph>
	{#each suggestion.roles as role}
		<RoleLink roleID={role} />
		<Button
			action={() =>
				$db.updateSuggestionRoles(
					suggestion,
					suggestion.roles.filter((r) => r !== role)
				)}
		>
			x</Button
		>
	{/each}
	{#if unselectedRoles.length > 0}
		<Select
			options={[
				{ value: undefined, label: '—' },
				...unselectedRoles.map((role) => {
					return { value: role.id, label: role.title };
				})
			]}
			selection={undefined}
			change={(r) =>
				r !== undefined
					? $db.updateSuggestionRoles(suggestion, Array.from(new Set([...suggestion.roles, r])))
					: undefined}
		/>
	{/if}
</div>

<div class="row">
	<Paragraph>This affects these processes:</Paragraph>
	{#each suggestion.processes as process}
		<ProcessLink processID={process} />
		<Button
			action={() =>
				$db.updateSuggestionProcesses(
					suggestion,
					suggestion.processes.filter((p) => p !== process)
				)}
		>
			x</Button
		>
	{/each}
	{#if unselectedProcesses.length > 0}
		<Select
			options={[
				{ value: undefined, label: '—' },
				...unselectedProcesses.map((process) => {
					return { value: process.id, label: process.title };
				})
			]}
			selection={undefined}
			change={(p) =>
				p !== undefined
					? $db.updateSuggestionProcesses(
							suggestion,
							Array.from(new Set([...suggestion.processes, p]))
					  )
					: undefined}
		/>
	{/if}
</div>

<Admin>
	<Paragraph>Is this request no longer needed? You can delete it, but it is permanent.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = suggestion.orgid;
				await $db.deleteChange(suggestion.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this suggestion</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<CommentsView comments={suggestion.comments} />

<style>
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--padding);
	}
</style>
