<script lang="ts">
	import Oops from './Oops.svelte';

	export let action: (() => void) | undefined = undefined;
	export let borders = false;
	export let inline = false;
	export let active: boolean;
	export let inactive: string;

	let form: HTMLFormElement;

	let showInactive = false;
	$: if (active) showInactive = false;
</script>

<form
	bind:this={form}
	on:submit|preventDefault={() => {
		if (action && active) action();
		else showInactive = true;
	}}
	class="form"
	class:borders
	class:inline
>
	<slot />
	{#if showInactive}
		<div class="row">
			<Oops text={inactive} />
		</div>{/if}
</form>

<style>
	.form {
		background: var(--background);
		gap: var(--spacing);
		display: flex;
		flex-direction: column;
		align-items: baseline;
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
