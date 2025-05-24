<script lang="ts">
	import { type CommentID } from '$database/Organization';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button from './Button.svelte';
	import CommentView from './CommentView.svelte';
	import Dialog from './Dialog.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import { getDB } from '$routes/+layout.svelte';
	import Table from './Table.svelte';
	import type { ProfileRow } from '$database/Organization';

	interface Props {
		comments: CommentID[];
		profiles: ProfileRow[];
		remove: ((id: CommentID) => Promise<PostgrestError | null>) | undefined;
	}

	let { comments, profiles, remove }: Props = $props();

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
							<CommentView {profiles} {comment} {remove} />
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
