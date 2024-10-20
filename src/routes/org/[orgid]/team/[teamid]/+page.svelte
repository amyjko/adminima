<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { getOrg, getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import Title from '$lib/Title.svelte';
	import { page } from '$app/stores';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';

	const user = getUser();
	const context = getOrg();
	const org = $derived(context.org);

	const db = getDB();

	let teamID = $derived($page.params.teamid);
	let team = $derived(org.getTeam(teamID));
	let isAdmin = $derived($user && org.hasAdminPerson($user.id));
</script>

{#if team}
	<Title
		title={team.name}
		kind="team"
		edit={$user && isAdmin
			? (text) =>
					queryOrError(
						db.updateTeamName(team, text, $user.id),
						"We couldn't update the team's name."
					)
			: undefined}
	/>

	<Tip admin
		>Teams are helpful ways of organizing roles. <strong>Admins</strong> can update their names and which
		roles are in them.</Tip
	>

	<MarkupView
		markup={team.description}
		placeholder="No description"
		edit={isAdmin && $user
			? (text) =>
					queryOrError(
						db.updateTeamDescription(team, text, $user.id),
						"We couldn't update the team's description."
					)
			: undefined}
	/>

	{#each org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink roleID={role.id} />
	{:else}
		<Notice>This team has no roles.</Notice>
	{/each}
{:else}
	<Oops text="No team" />
{/if}

{#if isAdmin}
	<Header>Delete</Header>
	<Tip admin>Deleting this team will not delete the roles on the team.</Tip>
	<Button
		tip="Delete this team from the organization. Any roles on the team will remain, but be teamless."
		action={async () => {
			const error = await queryOrError(db.deleteTeam(teamID), "Couldn't delete the team.");
			if (error === null) goto(`/org/${org.getPath()}/roles`);
		}}
		warning>{Delete} Delete this team</Button
	>
{/if}
