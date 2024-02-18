<script lang="ts">
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import type change from '../types/Change';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import database from '../database/Database';
	import Oops from './Oops.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Modifications from './Modifications.svelte';

	export let change: change;

	let deleteError: string | undefined = undefined;
</script>

<Title title={change.title} kind={$locale?.term.request} />

<Header>Requestor</Header>
<Paragraph><PersonLink personID={change.who} /></Paragraph>

<Header>The Problem</Header>
<MarkupView markup={change.problem} />

<Header>Affected Roles</Header>
<ul>
	{#each change.roles as role}
		<li><RoleLink roleID={role} /></li>
	{:else}
		&mdash;
	{/each}
</ul>

<Header>Affected Processes</Header>
<ul>
	{#each change.processes as process}
		<li><ProcessLink processID={process} /></li>
	{:else}
		&mdash;
	{/each}
</ul>

<Header>Comments</Header>

{#each change.comments as comment}
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
				const org = change.organization;
				await database.deleteRequest(change.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<Modifications mods={change.modifications} />

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
