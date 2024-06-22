<script lang="ts">
	export let options: { value: string | undefined; label: string }[] = [];
	export let tip: string;
	export let change: (value: string | undefined) => any;
	export let selection: string | undefined;
	export let fit: boolean = true;
	export let active: boolean = true;
</script>

<div class="select">
	{#if fit}▾ {/if}<select
		title={tip}
		aria-label={tip}
		bind:value={selection}
		on:change={change(selection)}
		class:fit
		disabled={active === false}
	>
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>

<style>
	.select {
		display: inline-block;
	}

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

	select[disabled] {
		background: var(--inactive);
		color: var(--inactive);
		cursor: default;
	}

	.fit {
		width: auto;
	}

	select:focus {
		outline: var(--thickness) solid var(--focus);
	}
</style>
