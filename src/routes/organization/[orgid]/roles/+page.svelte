<script lang="ts">
	import Database from '$database/Database';
	import { goto } from '$app/navigation';
	import Oops from '$lib/Oops.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Form from '$lib/Form.svelte';
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

	const org = getOrg();

	let newRole: string = '';
	let newRoleError: string | undefined = undefined;

	async function createRole() {
		const roleID = await Database.createRole($org.getID(), newRole);
		if (roleID) goto(`/organization/${$org.getID()}/role/${roleID}`);
		else newRoleError = "We couldn't create the new role.";
	}
</script>

<Title title="roles" kind={$locale?.term.organization} visibility="org" />
<Paragraph
	>These are the roles held in this organization. Each one is responsible for particular processes
	in this organization.</Paragraph
>

{#if $org.getRoles().length === 0}
	<Notice>There are no roles yet in this organization.</Notice>
{:else}
	{@const teamless = $org.getRoles().filter((role) => role.team === null)}

	{#each $org
		.getOrganization()
		.teams.sort((a, b) => $org.getTeamRoles(b.id).length - $org.getTeamRoles(a.id).length) as team}
		<Header><TeamLink id={team.id} /></Header>
		<MarkupView markup={team.description} />
		<Flow>
			{#each $org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
				<RoleLink roleID={role.id} />
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
	<Form action={createRole}>
		<Paragraph>Want to add a new role to this organization?</Paragraph>
		<Field label="title of new role" bind:text={newRole} />
		<Button end submit active={newRole.length > 3} action={() => {}}>create</Button>
		{#if newRoleError}
			<Oops text={newRoleError} />
		{/if}
	</Form>
</Admin>
