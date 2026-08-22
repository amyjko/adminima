<script lang="ts">
	interface Props {
		label: string;
		message?: string | undefined;
		children?: import('svelte').Snippet;
		/**
		 * The id of what is being labeled, when that is not something a label can point at.
		 * Wrapping in a <label> only names labelable elements, so a rich text editor -- a
		 * contenteditable div -- ends up with no accessible name at all. Given an id, this renders
		 * a plain span for the element to name itself with aria-labelledby.
		 */
		id?: string | undefined;
	}

	let { label, message = undefined, children, id = undefined }: Props = $props();
</script>

{#if label.length > 0 && id !== undefined}
	<div class="labeled">
		<span id="{id}-label"
			>{label}
			{#if message}<span class="invalid">{message}</span>{/if}</span
		>
		{@render children?.()}
	</div>{:else if label.length > 0}
	<label
		><span
			>{label}
			{#if message}<span class="invalid">{message}</span>{/if}</span
		>
		{@render children?.()}</label
	>{:else}{@render children?.()} <span class="invalid">{message}</span>{/if}

<style>
	label,
	.labeled {
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
