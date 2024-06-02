<script lang="ts">
	import type { CommentRow } from '$database/Organizations';
	import timestampToDate from '$database/timestampToDate';
	import PersonLink from './PersonLink.svelte';
	import Quote from './Quote.svelte';
	import TimeView from './TimeView.svelte';
	import { getOrg } from './contexts';

	export let comment: CommentRow;

	const org = getOrg();
</script>

<tr class="comment">
	<td>
		<div class="meta">
			<PersonLink profile={$org.getProfileWithPersonID(comment.who)} />
			<TimeView time={timestampToDate(comment.when).getTime()} />
		</div>
	</td>
	<td
		><Quote>
			{comment.what}
		</Quote>
	</td>
</tr>

<style>
	.comment {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: var(--spacing);
	}

	.meta {
		display: flex;
		flex-direction: column;
	}
</style>
