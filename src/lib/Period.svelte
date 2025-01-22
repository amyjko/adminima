<script lang="ts">
	import { getNextPeriodDate, formatNextDate, type default as Period } from '$database/Period';
	import Button, { Delete } from './Button.svelte';
	import MonthChooser from './MonthChooser.svelte';
	import Weekdays from '../database/Weekdays';
	import WeekdayChooser from './WeekdayChooser.svelte';
	import NumberChooser from './NumberChooser.svelte';
	import Months from '../database/Months';
	import Note from './Note.svelte';

	interface Props {
		period: Period;
		edit?: ((period: Period) => void) | undefined;
		remove?: (() => void) | undefined;
	}

	let { period, edit = undefined, remove = undefined }: Props = $props();

	function suffix(n: number) {
		return n === 1 ? 'st' : n === 2 ? 'nd' : 'th';
	}
</script>

<div class="period">
	{#if remove}
		<Button tip="Remove this period from the process" action={remove}>{Delete}</Button>
	{/if}
	<div class="dates">
		{#if period.type === 'annually-date'}
			Annually on <strong
				>{#if edit}<MonthChooser
						month={period.month}
						change={(value) => edit({ ...period, month: value })}
					/>{:else}{Months[period.month - 1]}{/if}
				{#if edit}<NumberChooser
						num={period.date}
						max={31}
						change={(value) => edit({ ...period, date: value })}
					/>{:else}{period.date}{suffix(period.date)}{/if}</strong
			>.
		{:else if period.type === 'annually-week'}
			Annually on <strong
				>{#if edit}<WeekdayChooser
						weekday={period.day}
						change={(value) => {
							return edit({ ...period, day: value });
						}}
					/>{:else}{Weekdays[period.day - 1]}{/if}</strong
			>
			of week
			<strong
				>{#if edit}<NumberChooser
						num={period.week}
						max={52}
						change={(value) => {
							return edit({ ...period, week: value });
						}}
					/>{:else}{period.week}{/if}</strong
			>.
		{:else if period.type === 'monthly-date'}
			Monthly on the <strong
				>{#if edit}<NumberChooser
						num={period.day}
						max={31}
						change={(value) => edit({ ...period, day: value })}
					/>{:else}{period.day}{/if}{suffix(period.day)}</strong
			>.
		{:else if period.type === 'monthly-weekday'}
			The <strong
				>{#if edit}<NumberChooser
						num={period.week}
						max={5}
						change={(value) => edit({ ...period, week: value })}
					/>{:else}{period.week}{/if}{suffix(period.week)}</strong
			>
			<strong
				>{#if edit}<WeekdayChooser
						weekday={period.day}
						change={(value) => {
							return edit({ ...period, day: value });
						}}
					/>{:else}{Weekdays[period.day - 1]}{/if}</strong
			> of each month.
		{:else if period.type === 'weekly'}
			Every <strong
				>{#if edit}<NumberChooser
						num={period.weeks}
						max={12}
						change={(value) => edit({ ...period, weeks: value })}
					/>{:else}{period.weeks}{/if}</strong
			>
			week{period.weeks > 1 ? 's' : ''} on
			<strong
				>{#if edit}<WeekdayChooser
						weekday={period.day}
						change={(value) => {
							return edit({ ...period, day: value });
						}}
					/>{:else}{Weekdays[period.day - 1]}{/if}</strong
			>.
		{/if}
		<Note>Next date: {formatNextDate(getNextPeriodDate(Date.now(), period))}</Note>
	</div>
</div>

<style>
	.period {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: var(--spacing);
		align-items: baseline;
	}
</style>
