<script lang="ts">
	import Button from './Button.svelte';

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
	<Button tip="Close this dialog" action={close}>✕</Button>
	<div class="content">
		<slot />
	</div>
</dialog>

<style>
	dialog {
		position: relative;
		border-radius: var(--radius);
		padding: 1em;
		margin-left: auto;
		margin-right: auto;
		max-width: 40em;
		height: max-content;
		background-color: var(--background);
		color: var(--foreground);
		border: var(--thickness) solid var(--border);
	}

	dialog::backdrop {
		transition: backdrop-filter;
		backdrop-filter: blur(10px);
	}

	.content {
		background: var(--background);
		max-width: 40em;
		min-height: 10em;
		padding: 1em;
		padding-top: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
