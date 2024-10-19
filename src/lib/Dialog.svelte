<script lang="ts">
	import { run } from 'svelte/legacy';

	import Button, { Delete } from './Button.svelte';

	interface Props {
		close: () => void;
		children?: import('svelte').Snippet;
	}

	let { close, children }: Props = $props();

	let view: HTMLDialogElement | undefined = $state(undefined);

	run(() => {
		if (view) view.showModal();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={view}
	tabindex="-1"
	onkeydown={(event) => (event.key === 'Escape' ? close() : undefined)}
>
	<div class="content">
		{@render children?.()}
	</div>
	<div class="close">
		<Button tip="Close this dialog" action={close}>{Delete}</Button>
	</div>
</dialog>

<style>
	dialog {
		position: fixed;
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

	.content {
		background: var(--background);
		max-width: 40em;
		min-height: 10em;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
