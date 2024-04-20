<script lang="ts">
	import { type StatusID } from '$types/Status';
	import { getOrg } from './contexts';

	export let status: StatusID | null;

	const org = getOrg();
</script>

<div class="status" title={status ? $org.getStatus(status)?.description : null}>{status}</div>

<style>
	.status {
		text-transform: none;
		display: inline-block;
		align-self: flex-start;
		padding-left: var(--padding);
		padding-right: var(--padding);
		background: var(--warning);
		color: var(--background);
	}
</style>
