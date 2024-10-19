<script lang="ts">
	import Select from './Select.svelte';
	import Weekdays from '../database/Weekdays';

	interface Props {
		weekday: number;
		change: (value: number) => void;
	}

	let { weekday, change }: Props = $props();
</script>

<Select
	tip="Choose a weekday"
	selection={`${weekday}`}
	options={Weekdays.map((day, index) => {
		return { value: `${index + 1}`, label: day };
	})}
	change={(value) => change(parseInt(value ?? '1'))}
/>
