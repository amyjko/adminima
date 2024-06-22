<script lang="ts">
	import { type CommentID } from '$types/Organization';
	import Button from './Button.svelte';
	import CommentView from './CommentView.svelte';
	import Dialog from './Dialog.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import { getDB, getErrors } from './contexts';

	export let comments: CommentID[];

	const db = getDB();
	const errors = getErrors();

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
				<table>
					<tbody>
						{#each comments.data.reverse() as comment}
							<CommentView {comment} />
						{:else}
							No changes yet.
						{/each}
					</tbody>
				</table>
			{:else}
				Unable to load history.
			{/if}
		{/await}
	</Dialog>
{/if}
