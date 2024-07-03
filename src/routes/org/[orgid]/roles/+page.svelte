<script lang="ts">
	import { goto } from '$app/navigation';
	import RoleLink from '$lib/RoleLink.svelte';
	import Field from '$lib/Field.svelte';
	import { addError, getDB, getErrors, getOrg, getUser } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import Flow from '$lib/Flow.svelte';
	import Header from '$lib/Header.svelte';
	import TeamLink from '$lib/TeamLink.svelte';
	import Notice from '$lib/Notice.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import Tip from '$lib/Tip.svelte';
	import ProfileLink from '$lib/ProfileLink.svelte';

	const org = getOrg();
	const db = getDB();
	const errors = getErrors();
	const user = getUser();

	let newRole: string = '';

	async function createRole() {
		const { data, error } = await $db.createRole($org.getID(), newRole);
		if (data) {
			goto(`/org/${$org.getID()}/role/${data.id}`);
			return true;
		} else if (error) {
			addError(errors, "We couldn't create the new role.", error);
			return false;
		} else return false;
	}

	let newTeam = '';

	async function createTeam() {
		const { data, error } = await $db.createTeam($org.getID(), newTeam);
		if (error) {
			addError(errors, "We couldn't create the new team.", error);
			return false;
		} else if (data) {
			goto(`/org/${$org.getID()}/team/${data.id}`);
			return true;
		}
		return false;
	}
</script>

<Title title="roles" kind="role" />
<Tip
	>These are the roles held in this organization. Each one is responsible for particular processes
	in this organization.</Tip
>

{#if $org.getRoles().length === 0 && $org.getTeams().length === 0}
	<Notice>There are no roles or teams yet.</Notice>
{:else}
	{@const teamless = $org.getRoles().filter((role) => role.team === null)}

	{#each $org
		.getTeams()
		.sort((a, b) => $org.getTeamRoles(b.id).length - $org.getTeamRoles(a.id).length) as team}
		<Header><TeamLink id={team.id} /></Header>
		<Flow>
			{#each $org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
				<RoleLink roleID={role.id} />
			{:else}
				<Notice>This team has no roles.</Notice>
			{/each}
		</Flow>
	{/each}

	{#if teamless.length > 0}
		<Header>No team</Header>
		{#each teamless as role}
			<Flow>
				<RoleLink roleID={role.id} />
				{#each $org.getRoleProfiles(role.id) as profile}
					<ProfileLink {profile} />
				{/each}
			</Flow>
		{/each}
	{/if}
{/if}

{#if $user && $org.hasAdminPerson($user.id)}
	<Header>Admins</Header>

	<FormDialog
		button="Create role …"
		showTip="Create a new role."
		submitTip="Create this new role."
		header="New role"
		explanation="Create a new role for this organization"
		submit="Create"
		inactive="Ensure your role name is at least three characters."
		action={createRole}
		valid={() => newRole.length >= 3}
	>
		<Field label="title of new role" bind:text={newRole} />
	</FormDialog>

	<FormDialog
		button="Create team …"
		showTip="Create a new team."
		submitTip="Create this new team."
		header="New team"
		explanation="Create a new team for this organization"
		inactive="Make sure your team name is at least three characters."
		submit="Create"
		action={createTeam}
		valid={() => newTeam.length >= 3}
	>
		<Field label="name of new team" bind:text={newTeam} />
	</FormDialog>
{/if}
