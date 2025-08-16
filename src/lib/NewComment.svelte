<script lang="ts">
	import { type ChangeRow } from '$database/Organization';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
	import Button from './Button.svelte';
	import Form from './Form.svelte';
	import Labeled from './Labeled.svelte';
	import MarkupView from './MarkupView.svelte';

	let {
		change,
		submitted = undefined
	}: { change: ChangeRow; submitted?: (comment: string) => void } = $props();

	const db = getDB();
	const context = getOrg();
	let org = $derived(context.org);
	let newComment: string = $state('');
	let submitting = $state(false);

	const user = getUser();

	async function submitComment() {
		if (!$user) return null;
		submitting = true;
		const error = await db.addComment(
			org.id,
			$user.id,
			newComment,
			'suggestions',
			change.id,
			change.comments
		);
		if (error) {
			addError(error.message);
		} else {
			submitted?.(newComment);
			newComment = '';
		}
		submitting = false;
		return error;
	}
</script>

{#if $user && context.member}
	<Form active={!submitting} inactiveMessage={undefined} action={() => submitComment()}>
		<Labeled label="Have a comment?">
			<MarkupView bind:markup={newComment} placeholder="Add a comment" editing />
		</Labeled>
		<Button
			end
			submit
			active={!submitting}
			tip="Add a comment to this change."
			action={() => submitComment()}>Submit</Button
		>
	</Form>
{/if}
