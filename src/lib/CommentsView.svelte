<script lang="ts">
	import { type CommentID } from '$types/Organization';
	import CommentView from './CommentView.svelte';
	import Loading from './Loading.svelte';
	import { getDB } from './contexts';

	export let comments: CommentID[];

	const db = getDB();
</script>

{#await $db.getComments(comments)}
	<Loading />
{:then comments}
	<table>
		<tbody>
			{#each comments.reverse() as comment}
				<CommentView {comment} />
			{:else}
				No changes yet.
			{/each}
		</tbody>
	</table>
{/await}
