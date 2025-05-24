<script lang="ts">
	import { goto } from '$app/navigation';
	import RoleLink from '$lib/RoleLink.svelte';
	import Field from '$lib/Field.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
	import Title from '$lib/Title.svelte';
	import Flow from '$lib/Flow.svelte';
	import Header from '$lib/Header.svelte';
	import TeamLink from '$lib/TeamLink.svelte';
	import Notice from '$lib/Notice.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import Tip from '$lib/Tip.svelte';
	import ProfileLink from '$lib/ProfileLink.svelte';
	import Oops from '$lib/Oops.svelte';
	import type { RoleRow, TeamRow } from '$database/Organization';
	import Organization from '$database/Organization';

	const { data } = $props();
	const roles = $derived(data.roles);
	const teams = $derived(data.teams);
	const assignments = $derived(data.assignments);
	const profiles = $derived(data.profiles);

	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();
	const user = getUser();

	let newRole: string = $state('');
	let filter: string = $state('');
	let lowerFilter = $derived(filter.toLocaleLowerCase().trim());
	let path = $derived(Organization.getPath(org));

	/** Roles are visible if the org is public or the authenticated user is in the org. */
	let visible = $derived(
		($user === null && org.visibility === 'public') || ($user !== null && context.member)
	);

	async function createRole() {
		const { data, error } = await db.createRole(org.id, newRole);
		if (data) {
			goto(`/org/${path}/role/${data.id}`);
			return true;
		} else if (error) {
			addError("We couldn't create the new role.", error);
			return false;
		} else return false;
	}

	let newTeam = $state('');

	async function createTeam() {
		const { data, error } = await db.createTeam(org.id, newTeam);
		if (error) {
			addError("We couldn't create the new team.", error);
			return false;
		} else if (data) {
			await goto(`/org/${path}/team/${data.id}`);
			return true;
		}
		return false;
	}

	function filteredProfiles(role: RoleRow) {
		return Organization.getRoleProfiles(role.id, assignments, profiles).filter((prof) =>
			lowerFilter === '' || role.title.toLocaleLowerCase().includes(lowerFilter)
				? true
				: prof.name.toLocaleLowerCase().includes(lowerFilter) ||
					prof.email.toLocaleLowerCase().includes(lowerFilter)
		);
	}

	function filteredRoles(team: TeamRow | null, roles: RoleRow[]) {
		// Otherwise, only include roles with a matching title or person with the role with a matching name.
		return roles.filter(
			(role) =>
				// Now filter? Show all.
				lowerFilter === '' ||
				// Title has the filter? Show it.
				role.title.toLocaleLowerCase().includes(lowerFilter) ||
				// Short name has the filter? Show it.
				role.short.some((name) => name.toLocaleLowerCase().includes(lowerFilter)) ||
				// Team has the filter? Show it.
				team?.name.toLocaleLowerCase().includes(filter) ||
				// A person with the role has the filter? Show it.
				Organization.getRoleProfiles(role.id, assignments, profiles).filter(
					(prof) =>
						prof.email.toLocaleLowerCase().includes(lowerFilter) ||
						prof.name.toLocaleLowerCase().includes(lowerFilter)
				).length > 0
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
	{#if context.admin}
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
<Field label="Filter by role, person, or team" bind:text={filter} />

{#if roles.length === 0 && teams.length === 0}
	<Notice>There are no roles or teams yet.</Notice>
{:else}
	{@const teamless = filteredRoles(
		null,
		roles.filter((role) => role.team === null)
	)}
	<ul>
		{#each teams.sort((a, b) => Organization.getTeamRoles(roles, b.id).length - Organization.getTeamRoles(roles, a.id).length) as team}
			{@const teamRoles = filteredRoles(team, Organization.getTeamRoles(roles, team.id))}
			{#if teamRoles.length > 0 || filter.length === 0}
				<ul>
					<li><Header><TeamLink {team} /></Header></li>
					<ul class="roles">
						{#each teamRoles.sort((a, b) => a.title.localeCompare(b.title)) as role}
							{@const profiles = filteredProfiles(role)}
							{#if profiles.length > 0 || filter.length === 0}
								<li><RoleLink {role} /></li>
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
				{@const profiles = filteredProfiles(role)}
				<li><RoleLink {role} /></li>
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
