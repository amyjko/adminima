<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import { getOrg } from '$routes/+layout.svelte';
	import Link from './Link.svelte';

	interface Props {
		process: ProcessRow;
		left?: number | undefined;
	}

	let { process, left = undefined }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);
</script>

<div class="process" style:left="{left}px">
	<Link bland to="/org/{org.getPath()}/process/{process.id}">{process.title}</Link>
</div>

<style>
	.process {
		position: relative;
		border-radius: var(--radius);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
