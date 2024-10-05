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
	import Oops from '$lib/Oops.svelte';
	import type Organization from '$types/Organization';
	import type { RoleRow } from '$database/OrganizationsDB';

	const org = getOrg();
	const db = getDB();
	const errors = getErrors();
	const user = getUser();

	let newRole: string = '';
	let filter: string = '';
	$: lowerFilter = filter.toLocaleLowerCase().trim();

	$: visible =
		($user === null && $org.getVisibility() === 'public') ||
		($user !== null && $org.hasPerson($user.id));

	async function createRole() {
		const { data, error } = await $db.createRole($org.getID(), newRole);
		if (data) {
			goto(`/org/${$org.getPath()}/role/${data.id}`);
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
			goto(`/org/${$org.getPath()}/team/${data.id}`);
			return true;
		}
		return false;
	}

	function filteredProfiles(org: Organization, role: RoleRow) {
		return org
			.getRoleProfiles(role.id)
			.filter((prof) =>
				lowerFilter === '' || role.title.toLocaleLowerCase().includes(lowerFilter)
					? true
					: prof.name.toLocaleLowerCase().includes(lowerFilter) ||
					  prof.email.toLocaleLowerCase().includes(lowerFilter)
			);
	}
</script>

<Title title="Roles" kind="role" label={false} />
<Tip
	>These are the roles held in this organization. Each one is responsible for particular processes
	in this organization.</Tip
>

{#if !visible}
	<Oops
		text="You are not a member of this private organization, so people assigned to roles are not shown."
	/>
{/if}

<Flow>
	{#if $user && $org.hasAdminPerson($user.id)}
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
</Flow>
<Field label="Filter by role or person" bind:text={filter} />

{#if $org.getRoles().length === 0 && $org.getTeams().length === 0}
	<Notice>There are no roles or teams yet.</Notice>
{:else}
	{@const teamless = $org
		.getRoles()
		.filter((role) => role.team === null)
		// If no filter, include all. Otherwise, only include roles with a matching title or person with the role with a matching name.
		.filter(
			(role) =>
				lowerFilter === '' ||
				role.title.toLocaleLowerCase().includes(lowerFilter) ||
				$org
					.getRoleProfiles(role.id)
					.filter(
						(prof) =>
							prof.email.toLocaleLowerCase().includes(lowerFilter) ||
							prof.name.toLocaleLowerCase().includes(lowerFilter)
					).length > 0
		)}
	<ul>
		{#each $org
			.getTeams()
			.sort((a, b) => $org.getTeamRoles(b.id).length - $org.getTeamRoles(a.id).length) as team}
			{@const teamRoles = $org
				.getTeamRoles(team.id)
				.filter(
					(role) =>
						lowerFilter === '' ||
						role.title.toLocaleLowerCase().includes(lowerFilter) ||
						role.short.some((name) => name.toLocaleLowerCase().includes(lowerFilter))
				)}
			{#if teamRoles.length > 0 || filter.length === 0}
				<ul>
					<li><Header><TeamLink id={team.id} /></Header></li>
					<ul class="roles">
						{#each teamRoles.sort((a, b) => a.title.localeCompare(b.title)) as role}
							{@const profiles = filteredProfiles($org, role)}
							{#if profiles.length > 0 || filter.length === 0}
								<li><RoleLink roleID={role.id} /></li>
								{#if profiles.length > 0}
									<ul class="people">
										{#each profiles as profile}
											<li><ProfileLink {profile} /></li>
										{/each}
									</ul>
								{/if}
							{/if}
						{:else}
							<Notice
								>{#if filter.length > 0}No matching roles{:else}This team has no roles.{/if}</Notice
							>
						{/each}
					</ul>
				</ul>
			{/if}
		{/each}
	</ul>

	{#if teamless.length > 0}
		<ul>
			<li><Header>No team</Header></li>
			{#each teamless as role}
				{@const profiles = filteredProfiles($org, role)}
				<li><RoleLink roleID={role.id} /></li>
				{#if profiles.length > 0}
					<ul class="people">
						{#each profiles as profile}
							<li><ProfileLink {profile} /></li>
						{/each}
					</ul>
				{/if}
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.roles,
	.people {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
		margin-left: 1em;
	}

	ul {
		margin-inline-start: 0;
	}

	ul li {
		list-style-type: none;
		margin-top: 0;
		margin-bottom: 1em;
		padding-inline-start: 0;
	}
</style>
