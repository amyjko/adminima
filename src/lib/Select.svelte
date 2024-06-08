<script lang="ts">
	export let options: { value: string | undefined; label: string }[] = [];
	export let change: (value: string | undefined) => any;
	export let selection: string | undefined;
	export let fit: boolean = true;
</script>

{#if fit}▾ {/if}<select bind:value={selection} on:change={change(selection)} class:fit>
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
		width: 2em;
		max-width: 10em;
		height: 1.25rem;
	}

	.fit {
		width: auto;
	}

	select:focus {
		outline: var(--thickness) solid var(--focus);
	}
</style>
