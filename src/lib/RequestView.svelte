<script lang="ts">
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import type Request from '../types/Request';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ActivityLink from './ActivityLink.svelte';
	import TimeView from './TimeView.svelte';
	import database from '../database/Database';
	import Oops from './Oops.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';

	export let request: Request;

	let deleteError: string | undefined = undefined;
</script>

<Title title={request.title} kind={$locale?.term.request} />

<Header>Requestor</Header>
<Paragraph><PersonLink personID={request.who} /></Paragraph>

<Header>The Problem</Header>
<MarkupView markup={request.problem} />

<Header>Affected Roles</Header>
<ul>
	{#each request.roles as role}
		<li><RoleLink roleID={role} /></li>
	{:else}
		&mdash;
	{/each}
</ul>

<Header>Affected Activities</Header>
<ul>
	{#each request.activities as activity}
		<li><ActivityLink activityID={activity} /></li>
	{:else}
		&mdash;
	{/each}
</ul>

<Header>Comments</Header>

{#each request.comments as comment}
	<div class="comment">
		<div class="meta">
			<TimeView time={comment.when} />
			<PersonLink personID={comment.who} />
		</div>
		<MarkupView markup={comment.what} />
	</div>
{:else}
	No comments yet.
{/each}

<Admin>
	<Header>Delete</Header>

	<Paragraph>Is this request no longer needed? You can delete it, but it is permanent.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = request.organization;
				await database.deleteRequest(request.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this activity</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<style>
	.comment {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	.meta {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: var(--spacing);
	}
</style>
