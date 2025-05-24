<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import Title from '$lib/Title.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();
	const team = $derived(data.team);
	const teamRoles = $derived(data.roles);

	const user = getUser();
	const context = getOrg();
	const org = $derived(context.org);

	const db = getDB();

	let isAdmin = $derived($user && context.admin);
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

	{#each teamRoles.sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink {role} />
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
			const error = await queryOrError(db.deleteTeam(team.id), "Couldn't delete the team.");
			if (error === null) await goto(`/org/${Organization.getPath(org)}/roles`);
		}}
		warning>{Delete} Delete this team</Button
	>
{/if}
