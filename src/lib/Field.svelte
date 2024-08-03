<script lang="ts">
	import Labeled from './Labeled.svelte';

	export let label: string | undefined = undefined;
	export let text: string;
	export let active: boolean = true;
	export let placeholder: string | undefined = undefined;
	export let autocomplete: boolean = false;
	export let invalid: ((text: string) => string | undefined) | undefined = undefined;
	export let done: ((text: string) => void) | undefined = undefined;

	$: message = invalid ? invalid(text) : undefined;
</script>

<Labeled label={label ?? ''} {message}>
	<input
		type="text"
		autocomplete={autocomplete ? 'on' : 'off'}
		disabled={!active}
		bind:value={text}
		on:blur={done ? () => done(text) : undefined}
		{placeholder}
	/>
</Labeled>

<style>
	input:focus {
		outline: var(--focus) solid var(--thickness);
	}

	input {
		outline: var(--border) solid var(--thickness);
		border: none;
		font-family: var(--font);
		font-size: var(--normal-size);
	}
</style>
