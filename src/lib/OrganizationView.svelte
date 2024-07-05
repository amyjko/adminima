<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import Paragraph from './Paragraph.svelte';
	import type Organization from '$types/Organization';
	import { addError, getDB, getErrors, getUser, queryOrError } from './contexts';
	import Visibility from './Visibility.svelte';
	import CommentsView from './CommentsView.svelte';
	import Note from './Note.svelte';
	import Tip from './Tip.svelte';
	import Form from './Form.svelte';
	import Field from './Field.svelte';
	import Button from './Button.svelte';
	import Header from './Header.svelte';
	import { goto } from '$app/navigation';

	export let organization: Organization;

	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && organization.hasAdminPerson($user.id);
	$: editable = isAdmin;

	let newPath = '';
	let submitting = false;
	$: validPath = /[a-zA-Z]+/.test(newPath);
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

{#if isAdmin && $user}
	{@const paths = organization.getPaths()}
	<hr />

	<Header>Path</Header>
	<Tip
		>Want to use a custom URL for this organization? Set a path. You can override an existing path,
		and previous links will continue to work.</Tip
	>

	<Form
		active={!submitting && validPath}
		inactiveMessage={submitting ? undefined : 'Paths must be one or more a-z or A-Z characters.'}
		action={async () => {
			const available = await $db.pathIsAvailable(newPath);

			if (available) {
				await queryOrError(errors, $db.addOrgPath(organization, newPath), "Couldn't update path.");
				goto(`/org/${newPath}`);
				newPath = '';
			} else addError(errors, 'This path is not available');
			submitting = false;
		}}
		><Field label="path" bind:text={newPath} /><code>https://adminima.app/org/{newPath}</code
		><Button submit active={!submitting && validPath} action={() => {}} tip="Update this path"
			>{paths.length === 0 ? 'Set' : 'Update'} path</Button
		></Form
	>

	{#if paths.length > 0}
		<Paragraph
			>Existing paths: <code>https://adminima.app/org/[{paths.join(', ')}]</code>
		</Paragraph>
	{/if}
{/if}

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
