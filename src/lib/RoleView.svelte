<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import { type RoleRow } from '../database/OrganizationsDB';
	import PersonLink from './ProfileLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import Button, { Delete } from './Button.svelte';
	import { goto } from '$app/navigation';
	import Title from './Title.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import Header from './Header.svelte';
	import TeamLink, { TeamItem } from './TeamLink.svelte';
	import CommentsView from './CommentsView.svelte';
	import Notice from './Notice.svelte';
	import Changes from './Changes.svelte';
	import ChangeLink from './ChangeLink.svelte';
	import Tip from './Tip.svelte';
	import PathEditor from './PathEditor.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import Options from './Options.svelte';

	interface Props {
		role: RoleRow;
	}

	let { role }: Props = $props();

	const user = getUser();
	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();

	let profiles = $derived(org.getRoleProfiles(role.id));
	let isAdmin = $derived($user && org.hasAdminPerson($user.id));

	let visible = $derived(
		($user === null && org.getVisibility() === 'public') ||
			($user !== null && org.hasPerson($user.id))
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
				...org.getTeams().map((team) => {
					return team.id;
				})
			]}
			view={TeamItem}
			change={async (team) => {
				if (isAdmin && $user) {
					return (
						(await queryOrError(
							db.updateRoleTeam(
								role,
								team ?? null,
								org.getTeams().find((t) => t.id)?.name,
								$user.id
							),
							"Couldn't update role team"
						)) === null
					);
				}
				return true;
			}}
		/>
	{:else if role.team}<TeamLink id={role.team} />{:else}no team{/if}

	{#if isAdmin}<PathEditor
			short={role.short[0] ?? ''}
			path={'...role/'}
			update={async (text) => {
				await queryOrError(db.updateRoleShortName(role, text), "Couldn't update role short name");
				goto(`/org/${org.getPath()}/role/${text.length > 0 ? text : role.id}`, {
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

<RoleProcesses {role} processes={org.getRoleProcesses(role.id)} />

<Header>Changes</Header>

<ChangeLink id={null} role={role.id} />

<Tip>These are changes people have made that might affect this role.</Tip>

<Changes
	changes={org
		.getChanges()
		.filter((change) => change.status === 'active' && change.roles.includes(role.id))}
	><Paragraph>There are no active changes suggested for this role.</Paragraph></Changes
>

<Header>History</Header>

<CommentsView
	comments={role.comments}
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
			} else goto(`/org/${org.getPath()}/roles`);
		}}
		warning>{Delete} Delete this role</Button
	>
{/if}
