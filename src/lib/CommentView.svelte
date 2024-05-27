<script lang="ts">
	import type { CommentRow } from '$database/Organizations';
	import timestampToDate from '$database/timestampToDate';
	import MarkupView from './MarkupView.svelte';
	import PersonLink from './PersonLink.svelte';
	import Quote from './Quote.svelte';
	import TimeView from './TimeView.svelte';
	import { getOrg } from './contexts';

	export let comment: CommentRow;

	const org = getOrg();
</script>

<div class="comment">
	<div class="meta">
		<PersonLink profile={$org.getProfile(comment.who)} />
		<TimeView time={timestampToDate(comment.when).getTime()} />
	</div>
	<Quote>
		{comment.what}
	</Quote>
</div>

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
