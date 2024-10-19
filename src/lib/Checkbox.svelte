<script lang="ts">
	interface Props {
		on: boolean;
		tip: string;
		enabled?: boolean;
		change?: undefined | ((on: boolean) => void);
	}

	let {
		on = $bindable(),
		tip,
		enabled = true,
		change = undefined
	}: Props = $props();
</script>

<input
	type="checkbox"
	title={tip}
	aria-label={tip}
	disabled={!enabled}
	bind:checked={on}
	onchange={() => (change ? change(on) : undefined)}
/>
