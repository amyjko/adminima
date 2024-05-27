<script lang="ts">
	import type { CommentRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import timestampToDate from '$database/timestampToDate';
	import Loading from './Loading.svelte';
	import MarkupView from './MarkupView.svelte';
	import Oops from './Oops.svelte';
	import PersonLink from './PersonLink.svelte';
	import Quote from './Quote.svelte';
	import TimeView from './TimeView.svelte';
	import { getOrg } from './contexts';

	export let comment: CommentRow;

	const org = getOrg();
</script>

<div class="comment">
	<div class="meta">
		<TimeView time={timestampToDate(comment.when).getTime()} />
		<PersonLink profile={$org.getProfile(comment.who)} />
	</div>
	<Quote>
		<MarkupView markup={comment.what} unset="No comment" />
	</Quote>
</div>

<style>
	.comment {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	.meta {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: var(--spacing);
	}
</style>
