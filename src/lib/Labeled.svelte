<script lang="ts">
	export let label: string;
	export let message: string | undefined = undefined;
</script>

<label
	><span
		>{label}
		{#if message}<span class="invalid">{message}</span>{/if}</span
	>
	<slot /></label
>

<style>
	label {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
		font-size: var(--small-size);
		color: var(--inactive);
	}

	.invalid {
		color: var(--error);
	}
</style>
