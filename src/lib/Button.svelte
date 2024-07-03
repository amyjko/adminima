<script context="module" lang="ts">
	export const Delete = '×';
</script>

<script lang="ts">
	export let action: () => void;
	export let tip: string;
	export let active = true;
	export let submit = false;
	export let warning = false;
	export let end = false;

	let confirm = false;
</script>

{#if confirm}
	<div class="row">
		Are you sure? <button type={submit ? 'submit' : null} class:warning on:click={action}
			><slot /></button
		>
	</div>
{:else}
	<button
		class:warning
		class:end
		type={submit ? 'submit' : 'button'}
		aria-disabled={!active}
		title={tip}
		aria-label={tip}
		on:click={() => {
			if (warning) confirm = true;
			else if (active) action();
		}}><slot /></button
	>
{/if}

<style>
	button {
		border-radius: var(--radius);
		background: var(--chrome);
		font-family: var(--font);
		font-weight: normal;
		font-size: var(--normal-size);
		color: var(--foreground);
		border: var(--chrome) var(--thickness) solid;
		cursor: pointer;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		min-width: 1em;
	}

	button:active {
		transform: scale(0.95, 0.95);
		color: var(--foreground);
	}

	.end {
		align-self: flex-end;
	}

	.warning {
		background: var(--error);
		color: var(--background);
	}

	button:not([aria-disabled='true']):hover,
	button:not([aria-disabled='true']):focus {
		transform: scale(1, 1.1);
	}

	button[aria-disabled='true'] {
		background: transparent;
		border: var(--chrome) var(--thickness) solid;
		cursor: default;
	}

	button:focus {
		outline: var(--focus) solid var(--thickness);
	}

	.row {
		display: flex;
		flex-direction: row;
		gap: var(--spacing);
		align-items: baseline;
	}
</style>
