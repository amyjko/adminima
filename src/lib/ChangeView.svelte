<script lang="ts">
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import Organizations, { type ChangeRow } from '../database/Organizations';
	import Oops from './Oops.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Modifications from './Revisions.svelte';
	import Quote from './Quote.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';
	import timestampToDate from '$database/timestampToDate';
	import Loading from './Loading.svelte';

	export let change: ChangeRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
</script>

<Title title={change.what} kind={$locale?.term.request} status={change.status} visibility="org" />

<Status status={change.status} />

<Paragraph
	>On <TimeView time={timestampToDate(change.when).getTime()} />
	<PersonLink profile={$org.getProfile(change.who)} /> reported:</Paragraph
>

<Quote><MarkupView markup={change.description} /></Quote>

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

{#await Organizations.getComments(change.comments)}
	<Loading>/</Loading>
{:then comments}
	{#each comments as comment}
		<div class="comment">
			<div class="meta">
				<TimeView time={timestampToDate(comment.when).getTime()} />
				<PersonLink profile={$org.getProfile(comment.who)} />
			</div>
			<Quote>
				<MarkupView markup={comment.what} />
			</Quote>
		</div>
	{:else}
		No comments yet.
	{/each}
{/await}

<Admin>
	<Paragraph>Is this request no longer needed? You can delete it, but it is permanent.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = change.orgid;
				await Organizations.deleteChange(change.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<Modifications mods={change.comments} />

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
