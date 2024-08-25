<script lang="ts">
	export let options: { value: string | undefined; label: string }[] = [];
	export let tip: string;
	export let change: (value: string | undefined) => any;
	export let selection: string | undefined;
	export let fit: string | boolean = true;
	export let active: boolean = true;
</script>

<div class="select">
	<select
		title={tip}
		aria-label={tip}
		bind:value={selection}
		on:change={change(selection)}
		class:fit={typeof fit === 'boolean' && fit === true ? 'fit' : ''}
		style:width={typeof fit === 'string' ? fit : ''}
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
		white-space: nowrap;
	}

	select,
	option {
		font-size: var(--small-size);
		font-family: var(--font);
	}

	select {
		appearance: none;
		background: var(--chrome);
		color: var(--foreground);
		padding: var(--padding);
		border-radius: var(--radius);
		border: none;
		width: 2em;
		max-width: 8em;
		height: 1.25rem;
	}

	select:hover {
		cursor: pointer;
	}

	select[disabled] {
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
