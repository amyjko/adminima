<script lang="ts">
	export let action: (() => void) | undefined = undefined;
	export let borders = false;
	export let inline = false;
</script>

<form on:submit|preventDefault={action} class="form" class:borders class:inline><slot /></form>

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
	}
</style>
