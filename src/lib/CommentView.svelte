<script lang="ts">
	import type { CommentRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Button, { Delete } from './Button.svelte';
	import MarkupView from './MarkupView.svelte';
	import PersonLink from './ProfileLink.svelte';
	import Quote from './Quote.svelte';
	import TimeView from './TimeView.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import { type CommentID } from '$types/Organization';

	interface Props {
		comment: CommentRow;
		remove: ((id: CommentID) => Promise<PostgrestError | null>) | undefined;
	}

	let { comment, remove }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();
	const user = getUser();

	let admin = $derived($user && org.hasAdminPerson($user.id));
</script>

<tr class="comment">
	<td width="20%">
		<div class="meta">
			<PersonLink profile={org.getProfileWithPersonID(comment.who)} />
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
				action={() => queryOrError(remove(comment.id), 'Unable to delete comment.')}
				>{Delete}</Button
			>
		</td>{/if}
</tr>

<style>
	.meta {
		display: flex;
		flex-direction: column;
	}
</style>
