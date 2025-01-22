<script module lang="ts">
	export const Delete = '×';
	export const Confirm = '✓';
</script>

<script lang="ts">
	interface Props {
		action: () => void;
		tip: string;
		active?: boolean;
		submit?: boolean;
		warning?: boolean;
		end?: boolean;
		chromeless?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		action,
		tip,
		active = true,
		submit = false,
		warning = false,
		end = false,
		chromeless = false,
		children
	}: Props = $props();

	let confirm = $state(false);
</script>

{#if confirm}
	<div class="row">
		<button onclick={() => (confirm = false)}>{Delete}</button><button
			type={submit ? 'submit' : null}
			class:warning
			onclick={action}>{Confirm}</button
		>
	</div>
{:else}
	<button
		class:warning
		class:end
		class:chromeless
		type={submit ? 'submit' : 'button'}
		aria-disabled={!active}
		title={tip}
		aria-label={tip}
		onclick={(event) => {
			if (warning) confirm = true;
			else if (active) {
				action();
				event.stopPropagation();
				event.preventDefault();
			}
		}}>{@render children?.()}</button
	>
{/if}

<style>
	button {
		border-radius: var(--radius);
		background: var(--chrome);
		font-family: var(--font);
		font-weight: normal;
		font-size: var(--small-size);
		color: var(--foreground);
		border: var(--chrome) var(--thickness) solid;
		cursor: pointer;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
	}

	button.chromeless {
		background: transparent;
		border: none;
		color: currentColor;
		padding: 0;
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
		border: var(--chrome) var(--thickness) dotted;
		cursor: default;
	}

	button:focus {
		outline: var(--focus) solid var(--thickness);
	}

	.row {
		display: flex;
		flex-direction: row;
		align-items: baseline;
	}
</style>
