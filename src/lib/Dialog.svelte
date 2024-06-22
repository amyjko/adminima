<script lang="ts">
	import Button, { Delete } from './Button.svelte';

	export let close: () => void;

	let view: HTMLDialogElement | undefined = undefined;

	$: if (view) view.showModal();
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={view}
	tabindex="-1"
	on:keydown={(event) => (event.key === 'Escape' ? close() : undefined)}
>
	<div class="content">
		<slot />
	</div>
	<div class="close">
		<Button tip="Close this dialog" action={close}>{Delete}</Button>
	</div>
</dialog>

<style>
	dialog {
		position: relative;
		border-radius: var(--radius);
		padding: 1em;
		margin-left: auto;
		margin-right: auto;
		width: 80vw;
		max-width: 40em;
		height: max-content;
		background-color: var(--background);
		color: var(--foreground);
		border: var(--thickness) solid var(--border);
	}

	.close {
		position: absolute;
		top: var(--spacing);
		right: var(--spacing);
	}

	dialog::backdrop {
		transition: backdrop-filter;
		backdrop-filter: blur(10px);
	}

	.content {
		background: var(--background);
		max-width: 40em;
		min-height: 10em;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
