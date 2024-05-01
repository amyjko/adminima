<script lang="ts">
	export let label: string;
	export let text: string;
	export let active: boolean = true;
	export let placeholder: string | undefined = undefined;
	export let invalid: ((text: string) => string | undefined) | undefined = undefined;

	$: message = invalid ? invalid(text) : undefined;
</script>

<label
	>{label}
	{#if message}<span class="invalid">{message}</span>{/if}
	<br /><input type="text" disabled={!active} bind:value={text} {placeholder} /></label
>

<style>
	label {
		font-size: var(--small-size);
		color: var(--inactive);
	}

	.invalid {
		color: var(--error);
	}

	input:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
