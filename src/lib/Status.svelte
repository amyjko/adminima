<script lang="ts">
	import { getOrg } from './contexts';

	export let status: string;

	const org = getOrg();
</script>

<span class="status {status}" title={status}
	>{#if status.length === 0}<em>no status</em>{:else}{status}{/if}</span
>

<style>
	.status {
		text-transform: none;
		display: inline-block;
		align-self: flex-start;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		background: var(--warning);
		color: var(--background);
	}

	.triage {
		background: var(--warning);
		color: var(--background);
	}

	.done {
		background: var(--foreground);
		color: var(--background);
	}

	.active {
		background: var(--salient);
		color: var(--background);
	}

	.backlog {
		background: var(--person);
		color: var(--background);
	}
</style>
