<script lang="ts">
	import Labeled from './Labeled.svelte';

	export let label: string;
	export let text: string;
	export let active: boolean = true;
	export let placeholder: string | undefined = undefined;
	export let invalid: ((text: string) => string | undefined) | undefined = undefined;

	$: message = invalid ? invalid(text) : undefined;
</script>

<Labeled {label} {message}>
	<input type="text" disabled={!active} bind:value={text} {placeholder} />
</Labeled>

<style>
	input:focus {
		outline: var(--focus) solid var(--thickness);
	}

	input {
		outline: var(--border) solid var(--thickness);
		border: none;
	}
</style>
