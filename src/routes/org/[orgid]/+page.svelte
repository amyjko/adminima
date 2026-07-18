<script lang="ts">
	import MarkupView from '$lib/MarkupView.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { addError, mutate } from '$routes/errors.svelte';
	import Visibility from '$lib/VisibilityChooser.svelte';
	import CommentsView from '$lib/CommentsView.svelte';
	import Note from '$lib/Note.svelte';
	import { goto } from '$app/navigation';
	import PathEditor from '$lib/PathEditor.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import Link from '$lib/Link.svelte';
	import Organization, { ok } from '$database/Organization';
	import Row from '$lib/Row.svelte';

	let { data } = $props();

	let admin = $derived(data.admin);
	let profiles = $derived(data.profiles);

	const user = getUser();

	const dbContext = getDB();
	const db = $derived(dbContext());

	const organization = getOrg();
	let org = $derived(organization().org);

	$inspect(org.visibility);

	let editable = $derived(admin);
</script>

<Title
	title={org.name}
	kind="organization"
	edit={$user && admin
		? (text) => mutate(db.updateOrgName(org, text, $user.id), "Couldn't update organization name.")
		: undefined}
>
	<div class="meta">
		<Row name="Visibility">
			<Visibility
				tip="Change the visibility of this organization"
				level={org.visibility}
				edit={$user && editable
					? (vis) =>
							vis === 'org' || vis === 'admin' || vis === 'public'
								? mutate(
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
		</Row>
		{#if admin}
			<Row name="Link">
				<PathEditor
					short={org.paths[0] ?? ''}
					path={'https://adminima.app/org/'}
					update={async (text) => {
						if (text === '') return ok();
						const available = await db.pathIsAvailable(text);

						if (available) {
							// The goto below reloads; refreshing here would fetch the old path.
							await mutate(db.addOrgPath(org, text), "Couldn't update path.", {
								refresh: false
							});
							goto(`/org/${text}`, { replaceState: true });
						} else addError('This path is not available');

						return ok();
					}}
				/>
			</Row>
		{/if}
	</div></Title
>

<MarkupView
	markup={org.description}
	placeholder="No description"
	edit={editable && $user
		? (text) =>
				mutate(
					db.updateOrgDescription(org, text, $user.id),
					"Couldn't update organization description."
				)
		: undefined}
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
</style>
