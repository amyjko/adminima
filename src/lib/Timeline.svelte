<script lang="ts">
	import type Activity from '../types/Activity';
	import { toDate } from '../types/Day';
	import { addWeeks, addYears, compareAsc, differenceInWeeks, format } from 'date-fns';
	import ActivityPill from './ActivityPill.svelte';

	export let activities: Activity[];

	// How many pixels a week should be.
	const PixelsPerWeek = 100;

	// Get the
	$: timed = activities.filter((a) => a.start !== null);

	$: sorted = timed.sort((a, b) =>
		a.start !== null && b.start !== null ? compareAsc(toDate(a.start), toDate(b.start)) : 0
	);

	// Start week is the earliest activity based on start day
	$: first = sorted[0];
	$: start = first?.start ? toDate(first.start) : new Date();

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

{#if activities.length === 0}
	No activities.
{:else}
	<div class="activities">
		<div class="time">
			{#each weeks as num}
				<div class="tick" style:left="{num * PixelsPerWeek}px">
					<div class="date">{format(addWeeks(start, num), 'MM/dd/yy')}</div>
				</div>
			{/each}
			<div class="timed">
				{#each timed as activity}{#if activity.start}<ActivityPill
							{activity}
							left={differenceInWeeks(toDate(activity.start), start) * PixelsPerWeek}
						/>{/if}{/each}
			</div>
		</div>
		<div class="untimed">
			{#each activities as activity}<ActivityPill {activity} />{:else}No untimed activities.{/each}
		</div>
	</div>
{/if}

<style>
	.activities {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	.time {
		flex-grow: 1;
		overflow: auto;
		position: relative;
		box-shadow: inset 3px 3px var(--border);
	}

	.tick {
		position: absolute;
		top: 3px;
		bottom: 0;
		width: 0;
		border: 1px solid var(--separator);
	}

	.timed {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
		align-items: flex-start;
		margin-block-start: var(--spacing);
	}

	.untimed {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
		width: 10em;
	}

	.date {
		font-size: small;
		color: var(--separator);
		margin-inline-start: var(--thickness);
		margin-block-start: var(--thickness);
	}
</style>
