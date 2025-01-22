<script lang="ts">
	import { run } from 'svelte/legacy';

	import Oops from './Oops.svelte';

	interface Props {
		action?: (() => void) | undefined;
		borders?: boolean;
		inline?: boolean;
		active: boolean;
		inactiveMessage: string | undefined;
		children?: import('svelte').Snippet;
	}

	let {
		action = undefined,
		borders = false,
		inline = false,
		active,
		inactiveMessage,
		children
	}: Props = $props();

	let showInactive = $state(false);
	run(() => {
		if (active) showInactive = false;
	});
</script>

<form
	onsubmit={(event) => {
		if (action && active) {
			event.preventDefault();
			action();
		} else showInactive = true;
	}}
	class="form"
	class:borders
	class:inline
>
	{@render children?.()}
	{#if showInactive && inactiveMessage}
		<div class="row">
			<Oops text={inactiveMessage} />
		</div>{/if}
</form>

<style>
	.form {
		background: var(--background);
		gap: var(--spacing);
		display: flex;
		flex-direction: column;
	}

	form.borders {
		border-top: var(--border) solid var(--thickness);
		border-bottom: var(--border) solid var(--thickness);
		padding-top: var(--spacing);
		padding-bottom: var(--spacing);
	}

	.form.inline {
		display: flex;
		flex-direction: row;
		gap: var(--spacing);
		justify-items: baseline;
		align-items: bottom;
	}

	.row {
		width: 100%;
		flex: 1;
	}
</style>
