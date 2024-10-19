<script lang="ts">
	import Select from './Select.svelte';

	interface Props {
		num: number;
		max: number;
		change: (date: number) => void;
	}

	let { num, max, change }: Props = $props();
</script>

<Select
	tip="Choose a week"
	selection={`${num}`}
	options={Array.from({ length: max }, (_, i) => i + 1).map((date) => {
		return { value: `${date}`, label: `${date}` };
	})}
	change={(value) => change(parseInt(value ?? '1'))}
/>
