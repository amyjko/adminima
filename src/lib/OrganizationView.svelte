<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Title from './Title.svelte';
	import type Organization from '$types/Organization';
	import { getDB } from '$routes/+layout.svelte';
	import { addError, getErrors, queryOrError } from '$routes/+layout.svelte';
	import Visibility from './Visibility.svelte';
	import CommentsView from './CommentsView.svelte';
	import Note from './Note.svelte';
	import { goto } from '$app/navigation';
	import PathEditor from './PathEditor.svelte';
	import Export from './Export.svelte';
	import { getUser } from '$routes/+layout.svelte';

	interface Props {
		organization: Organization;
	}

	let { organization }: Props = $props();

	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	let isAdmin = $derived($user && organization.hasAdminPerson($user.id));
	let editable = $derived(isAdmin);
</script>

<Title
	title={organization.getName()}
	kind="organization"
	edit={$user && isAdmin
		? (text) =>
				queryOrError(
					errors,
					db.updateOrgName(organization, text, $user.id),
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
										db.updateOrgVisibility(organization, vis, $user.id),
										"Couldn't update organization visibility."
									)
								: undefined
					: undefined}
			/>
			<Note inline
				>{#if organization.getVisibility() === 'public'}Everyone on the internet can see this
					organization's details.{:else if organization.getVisibility() === 'org'}Only members can
					see this organization's private processes and changes.{:else if organization.getVisibility() === 'admin'}Only
					admins can see this organization's details.{/if}</Note
			>
		</div>
		{#if isAdmin}<PathEditor
				short={organization.getPaths()[0] ?? ''}
				path={'https://adminima.app/org/'}
				update={async (text) => {
					if (text === '') return null;
					const available = await db.pathIsAvailable(text);

					if (available) {
						await queryOrError(errors, db.addOrgPath(organization, text), "Couldn't update path.");
						goto(`/org/${text}`, { replaceState: true });
					} else addError(errors, 'This path is not available');

					return null;
				}}
			/>{/if}
	</div></Title
>

<MarkupView
	markup={organization.getDescription()}
	placeholder="No description"
	edit={editable && $user
		? (text) => db.updateOrgDescription(organization, text, $user.id)
		: undefined}
/>

<CommentsView
	comments={organization.getComments()}
	remove={isAdmin
		? (comment) => db.deleteComment(organization.getRow(), 'orgs', comment)
		: undefined}
/>

{#if isAdmin}
	<Export />
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
