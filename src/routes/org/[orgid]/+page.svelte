<script lang="ts">
	import MarkupView from '$lib/MarkupView.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import Visibility from '$lib/VisibilityChooser.svelte';
	import CommentsView from '$lib/CommentsView.svelte';
	import Note from '$lib/Note.svelte';
	import { goto } from '$app/navigation';
	import PathEditor from '$lib/PathEditor.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import Link from '$lib/Link.svelte';
	import Organization from '$database/Organization';

	let { data } = $props();

	let admin = $derived(data.admin);
	let profiles = $derived(data.profiles);

	const user = getUser();
	const db = getDB();
	const organization = getOrg();
	let org = $derived(organization.org);

	let editable = $derived(admin);
</script>

<Title
	title={org.name}
	kind="organization"
	edit={$user && admin
		? (text) =>
				queryOrError(db.updateOrgName(org, text, $user.id), "Couldn't update organization name.")
		: undefined}
>
	<div class="meta">
		<div class="links">
			<Visibility
				tip="Change the visibility of this organization"
				level={org.visibility}
				edit={$user && editable
					? (vis) =>
							vis === 'org' || vis === 'admin' || vis === 'public'
								? queryOrError(
										db.updateOrgVisibility(org, vis, $user.id),
										"Couldn't update organization visibility."
									)
								: undefined
					: undefined}
			/>
			<Note inline
				>{#if org.visibility === 'public'}Everyone on the internet can see this organization's
					details.{:else if org.visibility === 'org'}Only members can see this organization's
					private processes and changes.{:else if org.visibility === 'admin'}Only admins can see
					this organization's details.{/if}</Note
			>
		</div>
		{#if admin}<PathEditor
				short={org.paths[0] ?? ''}
				path={'https://adminima.app/org/'}
				update={async (text) => {
					if (text === '') return null;
					const available = await db.pathIsAvailable(text);

					if (available) {
						await queryOrError(db.addOrgPath(org, text), "Couldn't update path.");
						goto(`/org/${text}`, { replaceState: true });
					} else addError('This path is not available');

					return null;
				}}
			/>{/if}
	</div></Title
>

<MarkupView
	markup={org.description}
	placeholder="No description"
	edit={editable && $user ? (text) => db.updateOrgDescription(org, text, $user.id) : undefined}
/>

<CommentsView
	comments={org.comments}
	{profiles}
	remove={admin ? (comment) => db.deleteComment(org, 'orgs', comment) : undefined}
/>

{#if admin}
	<Link to={`/org/${Organization.getPath(org)}/export`}>Export this organization...</Link>
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
