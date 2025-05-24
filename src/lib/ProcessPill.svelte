<script lang="ts">
	import type { ProcessRow } from '$database/Organization';
	import Organization from '$database/Organization';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
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
	<Link bland to="/org/{Organization.getPath(org)}/process/{process.id}">{process.title}</Link>
</div>

<style>
	.process {
		position: relative;
		border-radius: var(--radius);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
