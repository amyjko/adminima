<script lang="ts">
	export let on: boolean;
	export let enabled: boolean = true;
	export let change: undefined | ((on: boolean) => void) = undefined;
</script>

<input
	type="checkbox"
	disabled={!enabled}
	bind:checked={on}
	on:change={() => (change ? change(on) : undefined)}
/>
