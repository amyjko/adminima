<script lang="ts">
	import Months from '../database/Months';
	import Options from './Options.svelte';

	interface Props {
		/** 1-12 */
		month: number;
		change: (value: number) => Promise<boolean>;
	}

	let { month, change }: Props = $props();
</script>

<Options
	id="month-chooser"
	tip="Choose a month"
	selection={Months[month - 1]}
	options={Months}
	change={(value) => change(value === undefined ? 1 : Months.indexOf(value) + 1)}
/>
