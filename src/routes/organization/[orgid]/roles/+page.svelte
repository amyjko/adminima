<script lang="ts">
	import Organizations from '$database/Organizations';
	import { goto } from '$app/navigation';
	import Oops from '$lib/Oops.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Field from '$lib/Field.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button from '$lib/Button.svelte';
	import Admin from '$lib/Admin.svelte';
	import { getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from '$lib/Flow.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import TeamLink from '$lib/TeamLink.svelte';
	import Notice from '$lib/Notice.svelte';
	import Dialog from '$lib/Dialog.svelte';
	import Actions from '$lib/Actions.svelte';
	import Form from '$lib/Form.svelte';
	import FormDialog from '$lib/FormDialog.svelte';

	const org = getOrg();

	let newRole: string = '';
	let newRoleError: string | undefined = undefined;

	async function createRole() {
		const roleID = await Organizations.createRole($org.getID(), newRole);
		if (roleID) goto(`/organization/${$org.getID()}/role/${roleID}`);
		else newRoleError = "We couldn't create the new role.";
	}

	let newTeam = '';
	let newTeamError: string | undefined = undefined;

	async function createTeam() {
		const teamID = await Organizations.createTeam($org.getID(), newTeam);
		if (teamID === null) "We couldn't create the new team.";
	}
</script>

<Title title="roles" kind={$locale?.term.organization} />
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
		header="New role"
		explanation="Create a new role for this organization"
		submit="Create"
		action={createRole}
		valid={() => newRole.length >= 3}
		error={newRoleError}
	>
		<Field label="title of new role" bind:text={newRole} />
	</FormDialog>

	<FormDialog
		button="Create team …"
		header="New team"
		explanation="Create a new team for this organization"
		submit="Create"
		action={createTeam}
		valid={() => newTeam.length >= 3}
		error={newTeamError}
	>
		<Field label="name of new team" bind:text={newTeam} />
	</FormDialog>
</Admin>
