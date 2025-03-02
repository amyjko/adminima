<script lang="ts">
	import Weekdays from '../database/Weekdays';
	import Options from './Options.svelte';

	interface Props {
		/** 1-7 */
		weekday: number;
		change: (value: number) => Promise<boolean>;
	}

	let { weekday, change }: Props = $props();
</script>

<Options
	id="weekday-chooser"
	tip="Choose a weekday"
	selection={Weekdays[weekday - 1]}
	options={Weekdays}
	change={(value) => change(value === undefined ? 1 : Weekdays.indexOf(value) + 1)}
/>
