<script lang="ts">
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import Organizations, { type RoleRow } from '../database/Organizations';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import ChangeForm from './ChangeForm.svelte';
	import Button from './Button.svelte';
	import Oops from './Oops.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import { getOrg, getUser } from './contexts';
	import Header from './Header.svelte';
	import TeamLink from './TeamLink.svelte';
	import CommentsView from './CommentsView.svelte';
	import Choice from './Choice.svelte';
	import Notice from './Notice.svelte';

	export let role: RoleRow;

	let deleteError: string | undefined = undefined;

	const user = getUser();
	const org = getOrg();
	$: profiles = $org.getRoleProfiles(role.id);
	$: isAdmin = $user && $org.hasAdminPerson($user.id);
</script>

<Title
	title={role.title}
	kind={$locale?.term.role}
	edit={isAdmin && $user
		? (text) => Organizations.updateRoleTitle(role, text, $user.id)
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
					return await Organizations.updateRoleTeam(role, team, $user.id);
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
	edit={$user ? (text) => Organizations.updateRoleDescription(role, text, $user.id) : undefined}
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

<ChangeForm role={role.id} />

<CommentsView comments={role.comments} />

<Admin>
	<Paragraph
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Paragraph
	>
	<Button
		action={async () => {
			try {
				const org = role.orgid;
				const error = await Organizations.deleteRole(role.id);
				if (error) deleteError = error.message;
				else goto(`/organization/${org}/roles`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this role</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>
