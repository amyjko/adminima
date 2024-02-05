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
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import RequestList from './RequestList.svelte';
	import Oops from './Oops.svelte';
	import RequestForm from './RequestForm.svelte';
	import Button from './Button.svelte';
	import Paragraph from './Paragraph.svelte';
	import { goto } from '$app/navigation';

	export let activity: Activity;

	let deleteError: string | undefined = undefined;
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

<Header>Requests</Header>

<RequestForm organization={activity.organization} activity={activity.id} />

{#await database.getActivityRequests(activity.id)}
	<Loading />
{:then requests}
	<RequestList {requests} />
{:catch}
	<Oops text={(locale) => locale.error.noActivityRequests} />
{/await}

<Header>Delete</Header>

<Paragraph>Is this activity obsolete? You can delete it, but it is permanent.</Paragraph>
<Button
	action={async () => {
		try {
			const org = activity.organization;
			await database.deleteActivity(activity.id);
			goto(`/organization/${org}`);
		} catch (_) {
			deleteError = "We couldn't delete this";
		}
	}}
	warning>Delete this activity</Button
>
{#if deleteError}<Oops text={deleteError} />{/if}
