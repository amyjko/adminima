<script lang="ts">
	import type { CommentRow, ProfileRow } from '$database/Organization';
	import timestampToDate from '$database/timestampToDate';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button, { Delete } from './Button.svelte';
	import MarkupView from './MarkupView.svelte';
	import PersonLink from './ProfileLink.svelte';
	import Quote from './Quote.svelte';
	import TimeView from './TimeView.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import Organization from '$database/Organization';
	import { type CommentID } from '$database/Organization';

	interface Props {
		comment: CommentRow;
		profiles: ProfileRow[];
		remove: ((id: CommentID) => Promise<PostgrestError | null>) | undefined;
	}

	let { comment, profiles, remove }: Props = $props();

	const context = getOrg();
	const db = getDB();
	const user = getUser();

	// Feedback on deletion.
	let deleting = $state(false);

	let admin = $derived($user && context.admin);
</script>

{#if !deleting}
	<tr class="comment">
		<td width="20%">
			<div class="meta">
				<PersonLink
					profile={Organization.getProfileWithPersonID(profiles, comment.who) ?? undefined}
				/>
				<TimeView date={timestampToDate(comment.when)} />
			</div>
		</td>
		<td
			><Quote>
				{#if admin || ($user && comment.who === $user.id)}
					<MarkupView
						markup={comment.what}
						placeholder="—"
						edit={async (text) =>
							queryOrError(db.updateComment(comment, text), 'Unable to save comment.')}
					/>
				{:else}
					{comment.what}
				{/if}
			</Quote>
		</td>
		{#if remove}
			<td width="10%">
				<Button
					tip="Delete this comment"
					warning
					action={() => {
						deleting = true;
						queryOrError(remove(comment.id), 'Unable to delete comment.');
						deleting = false;
					}}>{Delete}</Button
				>
			</td>{/if}
	</tr>
{/if}

<style>
	.meta {
		display: flex;
		flex-direction: column;
	}
</style>
