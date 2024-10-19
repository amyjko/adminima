<script lang="ts">
	import Months from '../database/Months';
	import Select from './Select.svelte';

	interface Props {
		month: number;
		change: (value: number) => void;
	}

	let { month, change }: Props = $props();
</script>

<Select
	tip="Choose a month"
	selection={`${month}`}
	options={Months.map((month, index) => {
		return { value: `${index + 1}`, label: month };
	})}
	change={(value) => change(parseInt(value ?? '1'))}
/>
