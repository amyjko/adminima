<script lang="ts">
	import type Process from '../types/Process';
	import Link from './Link.svelte';

	export let process: Process;
	export let left: number | undefined = undefined;
</script>

<div class="process" style:left="{left}px" class:draft={process.draft}>
	<Link bland to="/process/{process.id}">{process.what}</Link>
</div>

<style>
	.process {
		position: relative;
		background: var(--salient);
		padding: var(--spacing);
		border-radius: var(--radius);
		color: var(--background);
		font-size: var(--small-size);
		width: fit-content;
	}

	.draft {
		background: var(--warning);
	}
</style>
