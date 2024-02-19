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
	import Quote from './Quote.svelte';
	import Status from './Status.svelte';

	export let change: change;

	let deleteError: string | undefined = undefined;
</script>

<Title title={change.title} kind={$locale?.term.request} />

<Status {change} />

<Paragraph
	>On <TimeView time={change.modifications[0].when} />
	<PersonLink personID={change.who} /> reported:</Paragraph
>

<Quote><MarkupView markup={change.problem} /></Quote>

<Paragraph>This affects ...</Paragraph>

<ul>
	{#each change.roles as role}
		<li><RoleLink roleID={role} /></li>
	{/each}
	{#each change.processes as process}
		<li><ProcessLink processID={process} /></li>
	{/each}
</ul>

<Header>Comments</Header>

{#each change.comments as comment}
	<div class="comment">
		<div class="meta">
			<TimeView time={comment.when} />
			<PersonLink personID={comment.who} />
		</div>
		<Quote>
			<MarkupView markup={comment.what} />
		</Quote>
	</div>
{:else}
	No comments yet.
{/each}

<Admin>
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
