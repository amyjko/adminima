<script lang="ts">
	interface Props {
		full?: boolean;
		fixed?: boolean;
		children?: import('svelte').Snippet;
	}

	let { full = true, fixed = true, children }: Props = $props();
</script>

<div class="table" class:full class:fixed>
	<table>{@render children?.()}</table>
</div>

<style>
	.table {
		overflow-x: auto;
		width: 100%;
	}

	.fixed {
		table-layout: fixed;
	}

	.full {
		width: calc(100vw - 2em);
		margin-left: calc(-1 * (100vw - 2em - 100%) / 2);
	}
</style>
