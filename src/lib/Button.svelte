<script lang="ts">
	export let action: () => void;
	export let active = true;
</script>

<button disabled={!active} on:click={action}><slot /></button>

<style>
	button {
		border-radius: var(--radius);
		font-family: var(--font);
		font-size: var(--small-size);
		border: 2px solid var(--border);
		cursor: pointer;
		align-self: flex-end;
	}

	button:not(:disabled):hover,
	button:not(:disabled):focus {
		transform: scale(1.1);
	}

	button:disabled {
		border-color: transparent;
	}

	button:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
