<script lang="ts">
	import Organizations from '$database/Organizations';
	import { type CommentID } from '$types/Organization';
	import CommentView from './CommentView.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';

	export let comments: CommentID[];
</script>

{#await Organizations.getComments(comments)}
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
