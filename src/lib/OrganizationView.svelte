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
	<div class="meta">
		<div class="links">
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
			<Note inline
				>{#if organization.getVisibility() === 'public'}Everyone on the internet can see this
					organization's details.{:else if organization.getVisibility() === 'org'}Only members can
					see this organization's detail.{:else if organization.getVisibility() === 'admin'}Only
					admins can see this organization's details.{/if}</Note
			>
		</div>
		<div class="links">
			<span class="link">
				<strong>{organization.getRoles().length}</strong>
				<Link kind="role" to="/org/{organization.getID()}/roles"
					>Role{organization.getRoles().length === 1 ? '' : 's'}</Link
				>
			</span>
			<span class="link">
				<strong>{organization.getProfiles().length} </strong>
				<Link kind="person" to="/org/{organization.getID()}/people"
					>{organization.getProfiles().length !== 1 ? 'People' : 'Person'}</Link
				>
			</span>
			<span class="link">
				<strong>{organization.getProcesses().length}</strong>
				<Link kind="process" to="/org/{organization.getID()}/processes"
					>Process{organization.getProcesses().length !== 1 ? 'es' : ''}</Link
				>
			</span>
			<span class="link">
				<strong>{organization.getSuggestions().length}</strong>
				<Link kind="suggestion" to="/org/{organization.getID()}/suggestions"
					>Suggestion{organization.getSuggestions().length !== 1 ? 's' : ''}</Link
				>
			</span>
		</div>
	</div></Title
>

<MarkupView
	markup={organization.getDescription()}
	placeholder="No description"
	edit={editable && $user
		? (text) => $db.updateOrgDescription(organization, text, $user.id)
		: undefined}
/>

<CommentsView
	comments={organization.getComments()}
	remove={(comment) => $db.deleteComment(organization.getRow(), 'orgs', comment)}
/>

<style>
	.meta {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}
	.links {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing);
	}
</style>
