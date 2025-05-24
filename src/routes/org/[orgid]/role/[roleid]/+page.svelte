<script lang="ts">
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import PersonLink from '$lib/ProfileLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import { goto } from '$app/navigation';
	import Title from '$lib/Title.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import Header from '$lib/Header.svelte';
	import TeamLink, { TeamItem } from '$lib/TeamLink.svelte';
	import CommentsView from '$lib/CommentsView.svelte';
	import Notice from '$lib/Notice.svelte';
	import Changes from '$lib/Changes.svelte';
	import ChangeLink from '$lib/ChangeLink.svelte';
	import Tip from '$lib/Tip.svelte';
	import PathEditor from '$lib/PathEditor.svelte';
	import RoleProcesses from '$lib/RoleProcesses.svelte';
	import Options from '$lib/Options.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();
	const role = $derived(data.role);
	const assignments = $derived(data.assignments);
	const allProfiles = $derived(data.profiles);
	const teams = $derived(data.teams);
	const changes = $derived(data.changes);
	const hows = $derived(data.hows);
	const processes = $derived(data.processes);

	const user = getUser();
	const db = getDB();
	const context = getOrg();
	let org = $derived(context.org);

	let profiles = $derived(Organization.getRoleProfiles(role.id, assignments, allProfiles));
	let isAdmin = $derived($user && context.admin);

	let visible = $derived(
		($user === null && org.visibility === 'public') || ($user !== null && context.member)
	);
</script>

<Title
	title={role.title}
	kind="role"
	edit={isAdmin && $user
		? (text) => queryOrError(db.updateRoleTitle(role, text, $user.id), "Couldn't update role title")
		: undefined}
>
	{#if isAdmin}
		<Options
			id="team-chooser"
			tip="Choose a team for this role"
			selection={role.team ?? undefined}
			options={[
				undefined,
				...teams.map((team) => {
					return team.id;
				})
			]}
			view={{ snippet: TeamItem, data: teams }}
			change={async (team) => {
				if (isAdmin && $user) {
					return (
						(await queryOrError(
							db.updateRoleTeam(role, team ?? null, teams.find((t) => t.id)?.name, $user.id),
							"Couldn't update role team"
						)) === null
					);
				}
				return true;
			}}
		/>
	{:else if role.team}<TeamLink team={teams.find((t) => t.id === role.team)} />{:else}no team{/if}

	{#if isAdmin}<PathEditor
			short={role.short[0] ?? ''}
			path={'...role/'}
			update={async (text) => {
				await queryOrError(db.updateRoleShortName(role, text), "Couldn't update role short name");
				goto(`/org/${Organization.getPath(org)}/role/${text.length > 0 ? text : role.id}`, {
					replaceState: true
				});
				return null;
			}}
		/>{/if}
</Title>

<Tip admin
	>This is a role in the organization. <strong>Admins</strong> can update it's description and team.
	Set a short name to use in URLs and links.</Tip
>

<MarkupView
	markup={role.description}
	placeholder="No description yet."
	edit={$user
		? (text) =>
				queryOrError(
					db.updateRoleDescription(role, text, $user.id),
					"Couldn't update role description."
				)
		: undefined}
/>

<Header>Who</Header>

{#if profiles.length === 0}{#if visible}<Notice>No one holds this role.</Notice>{:else}Who holds
		this role is private.{/if}{:else}
	<Paragraph
		>This role is held by
		{#each profiles as profile, index}<PersonLink
				{profile}
			/>{#if profiles.length >= 2 && index < profiles.length - 1 && index !== profiles.length - 2},
			{/if}{#if profiles.length >= 2 && index === profiles.length - 2}
				&nbsp;and
			{/if}{/each}.</Paragraph
	>{/if}

<Header>Processes</Header>

<RoleProcesses {role} {hows} processes={Organization.getRoleProcesses(role.id, hows, processes)} />

<Header>Changes</Header>

<ChangeLink change={null} role={role.id} />

<Tip>These are changes people have made that might affect this role.</Tip>

<Changes
	changes={changes.filter((change) => change.status === 'active' && change.roles.includes(role.id))}
	profiles={allProfiles}
	><Paragraph>There are no active changes suggested for this role.</Paragraph></Changes
>

<Header>History</Header>

<CommentsView
	comments={role.comments}
	profiles={allProfiles}
	remove={isAdmin ? (comment) => db.deleteComment(role, 'roles', comment) : undefined}
/>

<Header>Delete</Header>
{#if isAdmin}
	<Tip admin
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Tip
	>
	<Button
		tip="Permanently delete this role. All processes will remain, but without a role."
		action={async () => {
			const error = await db.deleteRole(role.orgid, role.id);
			if (error) {
				addError("We couldn't delete this role.", error);
			} else goto(`/org/${Organization.getPath(org)}/roles`);
		}}
		warning>{Delete} Delete this role</Button
	>
{/if}
