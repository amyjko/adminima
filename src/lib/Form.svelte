<script lang="ts">
	export let inline = false;
	export let action: (() => void) | undefined = undefined;
</script>

<form on:submit|preventDefault={action} class="form" class:inline><slot /></form>

<style>
	.form {
		border: var(--border) solid var(--thickness);
		background: var(--background);
		padding: var(--spacing);
		gap: var(--spacing);
		display: flex;
		flex-direction: column;
	}

	.form.inline {
		display: flex;
		flex-direction: row;
		gap: var(--spacing);
		justify-items: baseline;
	}
</style>
