<script lang="ts">
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import TimeView from './TimeView.svelte';
	import Organizations, { type SuggestionRow } from '../database/Organizations';
	import Oops from './Oops.svelte';
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Quote from './Quote.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';
	import timestampToDate from '$database/timestampToDate';
	import CommentsView from './CommentsView.svelte';

	export let suggestion: SuggestionRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
</script>

<Title title={suggestion.what} kind={$locale?.term.request}
	><Status status={suggestion.status} /></Title
>

<Paragraph
	>On <TimeView time={timestampToDate(suggestion.when).getTime()} />
	<PersonLink profile={$org.getProfileWithPersonID(suggestion.who)} /> reported:</Paragraph
>

<Quote><MarkupView markup={suggestion.description} unset="No description" /></Quote>

<Paragraph>This affects ...</Paragraph>

<ul>
	{#each suggestion.roles as role}
		<li><RoleLink roleID={role} /></li>
	{/each}
	{#each suggestion.processes as process}
		<li><ProcessLink processID={process} /></li>
	{/each}
</ul>

<Admin>
	<Paragraph>Is this request no longer needed? You can delete it, but it is permanent.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = suggestion.orgid;
				await Organizations.deleteChange(suggestion.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this suggestion</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<CommentsView comments={suggestion.comments} />
