<script lang="ts">
	interface Props {
		text?: string | undefined;
		inline?: boolean;
		children?: import('svelte').Snippet;
	}

	let { text = undefined, inline = false, children }: Props = $props();
</script>

<div class:inline>
	{#if text}<span>{typeof text === 'string' ? text : 'Error'}</span>{/if}
	<span class="sub">{@render children?.()}</span>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		background: var(--error);
		text-transform: none;
		font-size: var(--normal-size);
		color: var(--background);
		padding: calc(2 * var(--padding));
		border-spacing: var(--radius);
		max-width: 30em;
		text-align: left;
		border-radius: var(--radius);
	}

	.inline {
		display: inline;
		margin: 0;
		padding-inline-start: calc(var(--spacing) / 2);
		padding-inline-end: calc(var(--spacing) / 2);
	}

	.sub {
		font-size: var(--small-size);
	}
</style>
