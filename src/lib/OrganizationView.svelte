<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import Paragraph from './Paragraph.svelte';
	import type Organization from '$types/Organization';
	import { getDB, getErrors, getUser, queryOrError } from './contexts';
	import Visibility from './Visibility.svelte';
	import CommentsView from './CommentsView.svelte';
	import Note from './Note.svelte';
	import Tip from './Tip.svelte';

	export let organization: Organization;

	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && organization.hasAdminPerson($user.id);
	$: editable = isAdmin;
</script>

<Title
	title={organization.getName()}
	kind="organization"
	edit={$user && isAdmin
		? (text) =>
				queryOrError(
					errors,
					$db.updateOrgName(organization, text, $user.id),
					"Couldn't update organization name."
				)
		: undefined}
>
	<Visibility
		tip="Change the visibility of this organization"
		level={organization.getVisibility()}
		edit={$user && editable
			? (vis) =>
					vis === 'org' || vis === 'admin' || vis === 'public'
						? queryOrError(
								errors,
								$db.updateOrgVisibility(organization, vis, $user.id),
								"Couldn't update organization visibility."
						  )
						: undefined
			: undefined}
	/>
	<Note
		>{#if organization.getVisibility() === 'public'}Everyone on the internet can see this
			organization's details.{:else if organization.getVisibility() === 'org'}Only members can see
			this organization's detail.{:else if organization.getVisibility() === 'admin'}Only admins can
			see this organization's details.{/if}</Note
	>
</Title>

<Tip
	>This is an organization's dashboard. Learn about the organization, or edit it if you have
	permissions.</Tip
>

<Paragraph>
	See the <strong>{organization.getRoles().length}</strong>
	<Link kind="role" to="/organization/{organization.getID()}/roles"
		>Role{organization.getRoles().length === 1 ? '' : 's'}</Link
	> and <strong>{organization.getTeams().length}</strong> team{organization.getTeams().length === 1
		? ''
		: 's'} in this organization.</Paragraph
>

<Paragraph
	>See the <strong>{organization.getProfiles().length} </strong>
	<Link kind="person" to="/organization/{organization.getID()}/people"
		>{organization.getProfiles().length !== 1 ? 'People' : 'Person'}</Link
	> in this organization.</Paragraph
>

<Paragraph
	>See the <strong>{organization.getProcesses().length}</strong>
	<Link kind="process" to="/organization/{organization.getID()}/processes"
		>Process{organization.getProcesses().length !== 1 ? 'es' : ''}</Link
	>
	that make this organization work.</Paragraph
>

<Paragraph
	>See the <strong>{organization.getSuggestions().length}</strong>
	<Link kind="suggestion" to="/organization/{organization.getID()}/suggestions"
		>Suggestion{organization.getSuggestions().length !== 1 ? 's' : ''}</Link
	> proposed.</Paragraph
>

<hr />

<MarkupView
	markup={organization.getDescription()}
	placeholder="No description"
	edit={editable && $user
		? (text) => $db.updateOrgDescription(organization, text, $user.id)
		: undefined}
/>

<CommentsView comments={organization.getComments()} />
