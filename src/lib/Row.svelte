<script lang="ts">
	import Note from './Note.svelte';

	interface Props {
		name: string;
		children?: import('svelte').Snippet;
	}

	let { name, children }: Props = $props();
</script>

<div class="row">
	<Note>{name}</Note>
	<div class="content">{@render children?.()}</div>
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: baseline;
		gap: var(--spacing);
	}

	.content {
		flex-grow: 1;
	}
</style>
