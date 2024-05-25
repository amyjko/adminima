<script lang="ts">
	import { getOrg } from './contexts';

	export let status: string | null;

	const org = getOrg();
</script>

<span class="status" title={status}>{status}</span>

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
