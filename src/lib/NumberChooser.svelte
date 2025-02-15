<script lang="ts">
	import Options from './Options.svelte';

	interface Props {
		num: number;
		max: number;
		change: (date: number) => Promise<boolean>;
	}

	let { num, max, change }: Props = $props();
</script>

<Options
	id="number-chooser"
	tip="Choose a count"
	selection={`${num}`}
	options={Array.from({ length: max }, (_, i) => i + 1).map((num) => `${num}`)}
	change={(value) => change(parseInt(value ?? '1'))}
/>
