<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts';
	import Link from './Link.svelte';

	export let process: ProcessRow;
	export let left: number | undefined = undefined;

	const org = getOrg();
</script>

<div class="process" style:left="{left}px">
	<Link bland to="/org/{$org.getPath()}/process/{process.id}">{process.title}</Link>
</div>

<style>
	.process {
		position: relative;
		border-radius: var(--radius);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
