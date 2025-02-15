<script lang="ts">
	import Months from '../database/Months';
	import Options from './Options.svelte';

	interface Props {
		month: number;
		change: (value: number) => Promise<boolean>;
	}

	let { month, change }: Props = $props();
</script>

<Options
	id="month-chooser"
	tip="Choose a month"
	selection={Months[month]}
	options={Months}
	change={(value) => change(value === undefined ? 0 : Months.indexOf(value))}
/>
