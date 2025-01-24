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
		/** Fill remaining space of container */
		fill?: boolean;
	}

	let {
		label = undefined,
		text = $bindable(),
		active = true,
		placeholder = undefined,
		autocomplete = false,
		invalid = undefined,
		done = undefined,
		fill = false
	}: Props = $props();

	let message = $derived(invalid ? invalid(text) : undefined);
</script>

<div class="field" class:fill>
	<Labeled label={label ?? ''} {message}>
		<input
			type="text"
			autocomplete={autocomplete ? 'on' : 'off'}
			disabled={!active}
			bind:value={text}
			style:width={fill ? 'auto' : text.length + 'ch'}
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
</div>

<style>
	.field {
		display: inline-block;
	}

	.field.fill {
		flex-grow: 1;
	}
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
