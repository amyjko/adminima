<script lang="ts">
	import Weekdays from '../database/Weekdays';
	import Options from './Options.svelte';

	interface Props {
		weekday: number;
		change: (value: number) => Promise<boolean>;
	}

	let { weekday, change }: Props = $props();
</script>

<Options
	id="weekday-chooser"
	tip="Choose a weekday"
	selection={Weekdays[weekday]}
	options={Weekdays}
	change={(value) => change(value === undefined ? 0 : Weekdays.indexOf(value))}
/>
