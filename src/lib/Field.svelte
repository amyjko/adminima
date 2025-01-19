<script lang="ts">
	import Labeled from './Labeled.svelte';

	interface Props {
		label?: string | undefined;
		text: string;
		active?: boolean;
		placeholder?: string | undefined;
		autocomplete?: boolean;
		invalid?: ((text: string) => string | undefined) | undefined;
		done?: ((text: string) => void) | undefined;
	}

	let {
		label = undefined,
		text = $bindable(),
		active = true,
		placeholder = undefined,
		autocomplete = false,
		invalid = undefined,
		done = undefined
	}: Props = $props();

	let message = $derived(invalid ? invalid(text) : undefined);
</script>

<Labeled label={label ?? ''} {message}>
	<input
		type="text"
		autocomplete={autocomplete ? 'on' : 'off'}
		disabled={!active}
		bind:value={text}
		style:width={text.length + 'ch'}
		onblur={done
			? () => {
					if (invalid === undefined || invalid(text) === undefined) {
						done(text);
					}
				}
			: undefined}
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
		min-width: 5ch;
	}
</style>
