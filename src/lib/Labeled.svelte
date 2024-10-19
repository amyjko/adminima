<script lang="ts">
	interface Props {
		label: string;
		message?: string | undefined;
		children?: import('svelte').Snippet;
	}

	let { label, message = undefined, children }: Props = $props();
</script>

{#if label.length > 0}
	<label
		><span
			>{label}
			{#if message}<span class="invalid">{message}</span>{/if}</span
		>
		{@render children?.()}</label
	>{:else}{@render children?.()}{/if}

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
