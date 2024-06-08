<script lang="ts">
	export let action: () => void;
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
		background: var(--chrome);
		font-family: var(--font);
		font-size: var(--normal-size);
		border: none;
		cursor: pointer;
		white-space: nowrap;
		height: 1.25em;
	}

	.end {
		align-self: flex-end;
	}

	.warning {
		background: var(--error);
		color: var(--background);
	}

	button:not(:disabled):hover,
	button:not(:disabled):focus {
		transform: scale(1, 1.1);
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
