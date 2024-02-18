<script lang="ts">
	export let action: () => void;
	export let active = true;
	export let submit = false;
	export let warning = false;

	let confirm = false;
</script>

{#if confirm}
	<div class="row">Are you sure? <button class:warning on:click={action}><slot /></button></div>
{:else}
	<button
		class:warning
		type={submit ? 'submit' : null}
		disabled={!active}
		on:click={() => {
			if (warning) confirm = true;
			else action();
		}}><slot /></button
	>
{/if}

<style>
	button {
		border-radius: var(--radius);
		font-family: var(--font);
		font-size: var(--normal-size);
		border: 2px solid var(--border);
		cursor: pointer;
		align-self: flex-end;
	}

	.warning {
		background: var(--error);
		color: var(--background);
	}

	button:not(:disabled):hover,
	button:not(:disabled):focus {
		transform: scale(1.1);
	}

	button:disabled {
		border-color: transparent;
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
