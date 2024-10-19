<script lang="ts">
	import { type CommentID } from '$types/Organization';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';
	import CommentView from './CommentView.svelte';
	import Dialog from './Dialog.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import { getDB } from './contexts.svelte';
	import Table from './Table.svelte';

	interface Props {
		comments: CommentID[];
		remove: ((id: CommentID) => Promise<PostgrestError | null>) | undefined;
	}

	let { comments, remove }: Props = $props();

	const db = getDB();

	let show = $state(false);
</script>

<Button tip="Show the history of edits to this." action={() => (show = true)}>See history…</Button>
{#if show}
	<Dialog close={() => (show = false)}>
		<Header>History</Header>
		{#await db.getComments(comments)}
			<Loading />
		{:then comments}
			{#if comments.data}
				<Table full={false}>
					<tbody>
						{#each comments.data.reverse() as comment (comment.id)}
							<CommentView {comment} {remove} />
						{:else}
							<tr><td>No changes yet.</td></tr>
						{/each}
					</tbody>
				</Table>
			{:else}
				Unable to load history.
			{/if}
		{/await}
	</Dialog>
{/if}
