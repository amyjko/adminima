<script lang="ts">
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import { type RoleRow } from '../database/OrganizationsDB';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
	import Header from './Header.svelte';
	import TeamLink from './TeamLink.svelte';
	import CommentsView from './CommentsView.svelte';
	import Choice from './Choice.svelte';
	import Notice from './Notice.svelte';
	import Link from './Link.svelte';
	import Suggestions from './Suggestions.svelte';
	import SuggestionLink from './SuggestionLink.svelte';

	export let role: RoleRow;

	const user = getUser();
	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	$: profiles = $org.getRoleProfiles(role.id);
	$: isAdmin = $user && $org.hasAdminPerson($user.id);
</script>

<Title
	title={role.title}
	kind="role"
	edit={isAdmin && $user
		? (text) =>
				queryOrError(
					errors,
					$db.updateRoleTitle(role, text, $user.id),
					"Couldn't update role title"
				)
		: undefined}
>
	<Choice
		choice={role.team ? $org.getTeam(role.team)?.name ?? '' : '—'}
		choices={Object.fromEntries(
			$org.getTeams().map((team) => [team.name, `Change to team ${team.name}`])
		)}
		edit={async (name) => {
			if (isAdmin && $user) {
				const team = $org.getTeams().find((team) => team.name === name);
				if (team) {
					return await queryOrError(
						errors,
						$db.updateRoleTeam(role, team, $user.id),
						"Couldn't update role team"
					);
				}
			}
			return null;
		}}
		>{#if role.team}<TeamLink id={role.team} />{:else}no team{/if}</Choice
	>
</Title>

<MarkupView
	markup={role.description}
	unset="No description yet."
	edit={$user
		? (text) =>
				queryOrError(
					errors,
					$db.updateRoleDescription(role, text, $user.id),
					"Couldn't update role description."
				)
		: undefined}
/>

<Header>Who</Header>

{#if profiles.length === 0}<Notice>No one holds this role.</Notice>{:else}
	<Paragraph
		>This role is held by
		{#each profiles as profile, index}<PersonLink {profile} />{#if index > 0},
			{/if}{#if index < profiles.length - 1} and {/if}{/each}.</Paragraph
	>{/if}

<Header>Processes</Header>

<Timeline {role} processes={$org.getRoleProcesses(role.id)} />

<Header>Pending changes</Header>

<SuggestionLink id={null} role={role.id} />

<Suggestions
	suggestions={$org
		.getSuggestions()
		.filter((change) => change.status === 'active' && change.roles.includes(role.id))}
	><Paragraph>There are no active changes suggested for this role.</Paragraph></Suggestions
>

<Admin>
	<Paragraph
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Paragraph
	>
	<Button
		tip="Permanently delete this role. All processes will remain, but without a role."
		action={async () => {
			const org = role.orgid;
			const error = await $db.deleteRole(role.id);
			if (error) {
				addError(errors, "We couldn't delete this role.", error);
			} else goto(`/organization/${org}/roles`);
		}}
		warning>Delete this role</Button
	>
</Admin>

<Header>History</Header>

<CommentsView comments={role.comments} />
