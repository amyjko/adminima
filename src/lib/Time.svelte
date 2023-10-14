<script lang="ts">
	import type Activity from '../types/Activity';
	import { toDate } from '../types/Day';
	import { addYears, compareAsc, differenceInWeeks } from 'date-fns';
	import ActivityPill from './ActivityPill.svelte';

	let activities: Activity[] = [
		{
			id: 'hi',
			previous: null,
			start: { date: 13, month: 10, year: 2023 },
			repeat: null,
			icon: '🧑🏻‍🏫',
			what: 'Make sure faculty are doing their peer reviews',
			why: 'Required by faculty code',
			leader: 'Amy',
			collaborators: ['Victor'],
			how: []
		},
		{
			id: 'hi',
			previous: null,
			start: { date: 1, month: 1, year: 2023 },
			repeat: null,
			icon: '🧑🏻‍🏫',
			what: 'CAP',
			why: 'Required by faculty code',
			leader: 'Amy',
			collaborators: ['Victor'],
			how: []
		}
	];

	// How many pixels a week should be.
	const PixelsPerWeek = 100;

	$: sorted = activities.sort((a, b) => compareAsc(toDate(a.start), toDate(b.start)));

	// Start week is the earliest activity based on start day
	$: start = toDate(sorted[0].start);

	// End week is now plus 3 years
	const end = addYears(new Date(), 3);

	// How many weeks between the start and end?
	$: count = differenceInWeeks(end, start);

	// Create a list of weeks
	let weeks: number[] = [];
	$: for (let week = 1; week <= count; week++) {
		weeks.push(week);
	}
</script>

<div class="time">
	{#each weeks as num}
		<div class="tick" style:left="{num * PixelsPerWeek}px" />
	{/each}
	{#each activities as activity}<ActivityPill {activity} />{/each}
</div>

<style>
	.time {
		flex-grow: 1;
		overflow: auto;
		position: relative;
		box-shadow: inset 0px 3px var(--border);
	}

	.tick {
		position: absolute;
		top: 3px;
		bottom: 0;
		border: 1px solid var(--separator);
	}
</style>
