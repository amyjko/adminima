<script lang="ts">
	import type Process from '../types/Process';
	import Link from './Link.svelte';

	export let process: Process;
	export let left: number | undefined = undefined;
</script>

<div class="process" style:left="{left}px">
	<Link bland to="/organization/{process.organization}/process/{process.id}">{process.what}</Link>
</div>

<style>
	.process {
		position: relative;
		border-radius: var(--radius);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
