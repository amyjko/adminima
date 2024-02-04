<script lang="ts">
	import type Activity from '../types/Activity';
	import Rows from './Rows.svelte';
	import Row from './Row.svelte';
	import PersonLink from './PersonLink.svelte';
	import MarkupView from './MarkupView.svelte';
	import Header from './Header.svelte';
	import TaskView from './TaskView.svelte';
	import Notice from './Notice.svelte';
	import { format } from 'date-fns';
	import { toDate } from '../types/Day';

	export let activity: Activity;
</script>

<Notice>
	{#if activity.template}
		This activity is a based on a template
	{:else}
		This is a template. Start this activity to track your progress.
	{/if}
</Notice>

<Header>Purpose</Header>

<MarkupView markup={activity.why} />

<Header>Who</Header>
<ul>
	<li><PersonLink personID={activity.leader} /> (lead)</li>

	{#each activity.collaborators as collaborator}
		<li><PersonLink personID={collaborator} /></li>
	{/each}
</ul>

<Header>When</Header>

{#if activity.template && activity.start}
	This activity started on {format(toDate(activity.start), 'MM/dd/yyyy')}
{:else if activity.repeat}
	{#if activity.repeat.type === 'monthly'}
		This happens on the {activity.repeat.date}st day of each month.
	{:else if activity.repeat.type === 'weekly'}
		This happens every {activity.repeat.weekday} of each week.
	{:else if activity.repeat.type === 'annually'}
		This happens on day {activity.repeat.day} of month {activity.repeat.month} each year.
	{/if}
{:else}
	This activity doesn't happen at a particular time.
{/if}

<Header>Details</Header>
<Rows>
	<Row name="draft">{activity.draft}</Row>
	<Row name="how">
		<ul>
			{#each activity.how as how}
				<li><TaskView task={how} /></li>
			{/each}
		</ul>
	</Row>
</Rows>
