<script lang="ts">
	interface Props {
		name: string;
		children?: import('svelte').Snippet;
	}

	let { name, children }: Props = $props();
</script>

<div class="row">
	<div class="name">{name}</div>
	<div class="content">{@render children?.()}</div>
</div>

<style>
	.row {
		width: 100%;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	.name {
		color: var(--inactive);
		width: 30%;
		min-width: 8em;
		text-transform: lowercase;
		font-style: italic;
	}

	.content {
		flex-grow: 1;
	}
</style>
