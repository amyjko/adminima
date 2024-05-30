<script lang="ts">
	export let options: { value: string | undefined; label: string }[] = [];
	export let change: (value: string | undefined) => undefined;

	export let selection: string | undefined;
</script>

▾ <select bind:value={selection} on:change={change(selection)}>
	{#each options as option}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>

<style>
	select {
		appearance: none;
		background: var(--chrome);
		color: var(--foreground);
		padding: var(--padding);
		border-radius: var(--radius);
		border: none;
	}

	select:focus {
		outline: var(--thickness) solid var(--focus);
	}
</style>
