<script lang="ts">
	import type Process from '../types/Process';
	import { toDate } from '../types/Repeat';
	import { addWeeks, addYears, compareAsc, differenceInWeeks, format } from 'date-fns';
	import ProcessPill from './ProcessPill.svelte';
	import Paragraph from './Paragraph.svelte';
	import type Role from '$types/Role';
	import RoleProcesses from './RoleProcesses.svelte';
	import Subheader from './Subheader.svelte';

	export let role: Role;
	export let processes: Process[];

	// How many pixels a week should be.
	const PixelsPerWeek = 100;

	// Get the timed processes
	$: timed = processes.filter((a) => a.start !== null);

	$: sorted = timed.sort((a, b) =>
		a.start !== null && b.start !== null ? compareAsc(toDate(a.start), toDate(b.start)) : 0
	);

	// Start week is the earliest process based on start day
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

{#if processes.length === 0}
	This role is not responsible for any processes.
{:else}
	<Paragraph>These are the processes that this role is responsible for.</Paragraph>
	<div class="processes">
		{#if timed.length > 0}
			<Subheader>Timeline</Subheader>
			<div class="time">
				{#each weeks as num}
					<div class="tick" style:left="{num * PixelsPerWeek}px">
						<div class="date">{format(addWeeks(start, num), 'MM/dd/yy')}</div>
					</div>
				{/each}
				<div class="timed">
					{#each timed as process}{#if process.start}<ProcessPill
								{process}
								left={differenceInWeeks(toDate(process.start), start) * PixelsPerWeek}
							/>{/if}{/each}
				</div>
			</div>
		{/if}

		<RoleProcesses {role} {processes} />
	</div>
{/if}

<style>
	.processes {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	.time {
		flex-grow: 1;
		overflow: auto;
		position: relative;
		border: var(--border) solid var(--thickness);
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

	.date {
		font-size: small;
		color: var(--separator);
		margin-inline-start: var(--thickness);
		margin-block-start: var(--thickness);
	}
</style>
