<script lang="ts">
	export let status: string;
</script>

<span class="status {status}" title={status}
	>{#if status.length === 0}<em>no status</em>{:else}{status}{/if}</span
>

<style>
	.status {
		text-transform: none;
		display: inline-block;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		background: var(--warning);
		color: var(--background);
	}

	.blocked,
	.triage,
	.draft {
		background: var(--warning);
		color: var(--background);
	}

	.declined,
	.done {
		background: var(--foreground);
		color: var(--background);
	}

	.active {
		background: var(--error);
		color: var(--background);
	}

	.backlog,
	.archived {
		background: var(--person);
		color: var(--background);
	}
</style>
