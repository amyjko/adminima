<script lang="ts">
	import type Activity from '../types/Activity';
	import Lead from './Lead.svelte';
	import Rows from './Rows.svelte';
	import Row from './Row.svelte';

	export let activity: Activity;
</script>

<Lead>{activity.why}</Lead>

<Rows>
	<Row name="draft">{activity.draft}</Row>
	<Row name="leader">{activity.role}</Row>
	<Row name="collaborators">
		{#each activity.collaborators as collaborator}
			{collaborator}
		{:else}
			&mdash;
		{/each}
	</Row>
	<Row name="role">
		{activity.role}
	</Row>
	<Row name="time">{activity.time}</Row>
	<Row name="how">
		{#each activity.how as how}
			{how}
		{:else}
			&mdash;
		{/each}
	</Row>
</Rows>
