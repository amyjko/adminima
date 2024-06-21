<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import Link from './Link.svelte';

	export let process: ProcessRow;
	export let left: number | undefined = undefined;
</script>

<div class="process" style:left="{left}px">
	<Link bland to="/organization/{process.orgid}/process/{process.id}">{process.title}</Link>
</div>

<style>
	.process {
		position: relative;
		border-radius: var(--radius);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
