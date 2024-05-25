<script lang="ts">
	import PersonLink from './PersonLink.svelte';
	import MarkupView from './MarkupView.svelte';
	import Row from './Row.svelte';
	import Rows from './Rows.svelte';
	import Header from './Header.svelte';
	import { format } from 'date-fns';
	import Paragraph from './Paragraph.svelte';
	import { getOrg } from './contexts';
	import { type CommentID } from '$types/Organization';
	import Organizations from '$database/Organizations';
	import Loading from './Loading.svelte';
	import timestampToDate from '$database/timestampToDate';

	export let mods: CommentID[];

	const org = getOrg();
</script>

<Header>Revision history</Header>

{#await Organizations.getComments(mods)}
	<Loading />
{:then comments}
	{#if comments}
		<Rows>
			{#each comments as comment}
				<Row name={format(timestampToDate(comment.when), 'MM/dd/yyyy')}>
					<Paragraph><PersonLink profile={$org.getProfile(comment.who)} /></Paragraph>
					<MarkupView markup={comment.what} />
				</Row>
			{:else}
				No revision history.
			{/each}
		</Rows>
	{:else}
		Unable to show comments.
	{/if}
{/await}
