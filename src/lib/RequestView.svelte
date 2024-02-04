<script lang="ts">
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import type Request from '../types/Request';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import ActivityLink from './ActivityLink.svelte';
	import TimeView from './TimeView.svelte';
	import Markup from '../markup/Markup';

	export let request: Request;
</script>

<div class="scope">
	<Header>Requestor</Header>
	<Paragraph><PersonLink personID={request.who} /></Paragraph>

	<Header>The Problem</Header>
	<MarkupView markup={request.problem} />

	<Header>Affected Roles</Header>
	<ul>
		{#each request.roles as role}
			<li><RoleLink roleID={role} /></li>
		{/each}
	</ul>

	<Header>Affected Activities</Header>
	<ul>
		{#each request.activities as activity}
			<li><ActivityLink activityID={activity} /></li>
		{/each}
	</ul>

	<Header>Comments</Header>

	{#each request.comments as comment}
		<div class="comment">
			<div class="meta">
				<TimeView time={comment.when} />
				<PersonLink personID={comment.who} />
			</div>
			<MarkupView markup={comment.what} />
		</div>
	{:else}
		No comments yet.
	{/each}
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
