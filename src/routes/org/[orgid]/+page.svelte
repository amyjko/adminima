<script lang="ts">
	import { getOrg } from '$routes/+layout.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import Visibility from '$lib/Visibility.svelte';
	import CommentsView from '$lib/CommentsView.svelte';
	import Note from '$lib/Note.svelte';
	import { goto } from '$app/navigation';
	import PathEditor from '$lib/PathEditor.svelte';
	import Export from '$lib/Export.svelte';
	import { getUser } from '$routes/+layout.svelte';

	const context = getOrg();
	let organization = $derived(context?.org);
	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && organization.hasAdminPerson($user.id));
	let editable = $derived(isAdmin);
</script>

<Title
	title={organization.getName()}
	kind="organization"
	edit={$user && isAdmin
		? (text) =>
				queryOrError(
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
						await queryOrError(db.addOrgPath(organization, text), "Couldn't update path.");
						goto(`/org/${text}`, { replaceState: true });
					} else addError('This path is not available');

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
