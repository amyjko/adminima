<script lang="ts">
	import Select from './Select.svelte';

	export let num: number;
	export let max: number;
	export let change: (date: number) => void;
</script>

<Select
	tip="Choose a week"
	selection={`${num}`}
	options={Array.from({ length: max }, (_, i) => i + 1).map((date) => {
		return { value: `${date}`, label: `${date}` };
	})}
	change={(value) => change(parseInt(value ?? '1'))}
/>
