<script lang="ts">
	import { type CommentID } from '$types/Organization';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';
	import CommentView from './CommentView.svelte';
	import Dialog from './Dialog.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import { getDB } from './contexts';
	import Table from './Table.svelte';

	export let comments: CommentID[];
	export let remove: ((id: CommentID) => Promise<PostgrestError | null>) | undefined;

	const db = getDB();

	let show = false;
</script>

<Button tip="Show the history of edits to this." action={() => (show = true)}>See history…</Button>
{#if show}
	<Dialog close={() => (show = false)}>
		<Header>History</Header>
		{#await $db.getComments(comments)}
			<Loading />
		{:then comments}
			{#if comments.data}
				<Table full={false}>
					<tbody>
						{#each comments.data.reverse() as comment (comment.id)}
							<CommentView {comment} {remove} />
						{:else}
							No changes yet.
						{/each}
					</tbody>
				</Table>
			{:else}
				Unable to load history.
			{/if}
		{/await}
	</Dialog>
{/if}
