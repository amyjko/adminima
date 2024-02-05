<script lang="ts">
	export let inline = false;
</script>

<div class="form" class:inline><slot /></div>

<style>
	.form {
		border-radius: var(--radius);
		border: var(--border) dotted 1px;
		padding: var(--spacing);
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
