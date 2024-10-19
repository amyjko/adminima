<script lang="ts">
	interface Props {
		options?: { value: string | undefined; label: string }[];
		tip: string;
		change: (value: string | undefined) => any;
		selection: string | undefined;
		fit?: string | boolean;
		active?: boolean;
	}

	let {
		options = [],
		tip,
		change,
		selection = $bindable(),
		fit = true,
		active = true
	}: Props = $props();
</script>

<div class="select">
	<select
		title={tip}
		aria-label={tip}
		bind:value={selection}
		onchange={change(selection)}
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
