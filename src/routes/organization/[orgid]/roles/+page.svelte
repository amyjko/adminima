<script lang="ts">
	import { goto } from '$app/navigation';
	import RoleLink from '$lib/RoleLink.svelte';
	import Field from '$lib/Field.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Admin from '$lib/Admin.svelte';
	import { addError, getDB, getErrors, getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import Flow from '$lib/Flow.svelte';
	import Header from '$lib/Header.svelte';
	import TeamLink from '$lib/TeamLink.svelte';
	import Notice from '$lib/Notice.svelte';
	import FormDialog from '$lib/FormDialog.svelte';

	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	let newRole: string = '';

	async function createRole() {
		const { data, error } = await $db.createRole($org.getID(), newRole);
		if (data) goto(`/organization/${$org.getID()}/role/${data.id}`);
		else if (error) addError(errors, "We couldn't create the new role.", error);
	}

	let newTeam = '';

	async function createTeam() {
		const { data, error } = await $db.createTeam($org.getID(), newTeam);
		if (error) addError(errors, "We couldn't create the new team.", error);
		else if (data) goto(`/organization/${$org.getID()}/team/${data.id}`);
	}
</script>

<Title title="roles" kind="role" />
<Paragraph
	>These are the roles held in this organization. Each one is responsible for particular processes
	in this organization.</Paragraph
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
		<Header>Roles without a team</Header>
		<Flow>
			{#each teamless as role}
				<RoleLink roleID={role.id} />
			{/each}
		</Flow>
	{/if}
{/if}

<Admin>
	<FormDialog
		button="Create role …"
		showTip="Create a new role."
		submitTip="Create this new role."
		header="New role"
		explanation="Create a new role for this organization"
		submit="Create"
		action={createRole}
		valid={() => newRole.length >= 3}
		error={undefined}
	>
		<Field label="title of new role" bind:text={newRole} />
	</FormDialog>

	<FormDialog
		button="Create team …"
		showTip="Create a new team."
		submitTip="Create this new team."
		header="New team"
		explanation="Create a new team for this organization"
		submit="Create"
		action={createTeam}
		valid={() => newTeam.length >= 3}
		error={undefined}
	>
		<Field label="name of new team" bind:text={newTeam} />
	</FormDialog>
</Admin>
