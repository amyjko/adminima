<script lang="ts">
	import { type CommentRow } from '$database/OrganizationsDB';
	import { type CommentID } from '$types/Organization';
	import CommentView from './CommentView.svelte';
	import Loading from './Loading.svelte';
	import { addError, getDB, getErrors } from './contexts';

	export let comments: CommentID[];

	const db = getDB();
	const errors = getErrors();

	let data: CommentRow[] | undefined = undefined;
	$: {
		$db.getComments(comments).then((d) => {
			const { data: newComments, error } = d;
			if (error) addError(errors, 'Unable to get comments.', error);
			else data = newComments;
		});
	}
</script>

{#if data === undefined}
	<Loading />
{:else}
	<table>
		<tbody>
			{#each data.reverse() as comment}
				<CommentView {comment} />
			{:else}
				No changes yet.
			{/each}
		</tbody>
	</table>
{/if}
