<script lang="ts">
	export let on: boolean;
	export let tip: string;
	export let enabled: boolean = true;
	export let change: undefined | ((on: boolean) => void) = undefined;
</script>

<input
	type="checkbox"
	title={tip}
	aria-label={tip}
	disabled={!enabled}
	bind:checked={on}
	on:change={() => (change ? change(on) : undefined)}
/>
