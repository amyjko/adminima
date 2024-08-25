<script lang="ts">
	import Months from '../database/Months';
	import Select from './Select.svelte';

	export let month: number;
	export let change: (value: number) => void;
</script>

<Select
	tip="Choose a month"
	selection={`${month}`}
	options={Months.map((month, index) => {
		return { value: `${index + 1}`, label: month };
	})}
	change={(value) => change(parseInt(value ?? '1'))}
/>
