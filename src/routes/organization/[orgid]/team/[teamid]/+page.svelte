<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { getDB, getErrors, getOrg, getUser, queryOrError } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { page } from '$app/stores';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Admin from '$lib/Admin.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';
	import Tip from '$lib/Tip.svelte';

	const user = getUser();
	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	$: teamID = $page.params.teamid;
	$: team = $org.getTeam(teamID);
	$: isAdmin = $user && $org.hasAdminPerson($user.id);
</script>

{#if team}
	<Title
		title={team.name}
		kind="team"
		edit={$user && isAdmin
			? (text) =>
					queryOrError(
						errors,
						$db.updateTeamName(team, text, $user.id),
						"We couldn't update the team's name."
					)
			: undefined}
	/>

	<Tip
		>Teams are helpful ways of organizing roles. <strong>Admins</strong> can update their names and which
		roles are in them.</Tip
	>

	<MarkupView
		markup={team.description}
		placeholder="No description"
		edit={isAdmin && $user
			? (text) =>
					queryOrError(
						errors,
						$db.updateTeamDescription(team, text, $user.id),
						"We couldn't update the team's description."
					)
			: undefined}
	/>

	{#each $org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink roleID={role.id} />
	{:else}
		<Notice>This team has no roles.</Notice>
	{/each}
{:else}
	<Oops text="No team" />
{/if}

<Admin>
	<Paragraph>If you delete this team, the roles on it will be without a team.</Paragraph>
	<Button
		tip="Delete this team from the organization. Any roles on the team will remain, but be teamless."
		action={async () => {
			const error = await queryOrError(errors, $db.deleteTeam(teamID), "Couldn't delete the team.");
			if (error === null) goto(`/organization/${$org.getID()}/roles`);
		}}
		warning>{Delete} Delete this team</Button
	>
</Admin>
