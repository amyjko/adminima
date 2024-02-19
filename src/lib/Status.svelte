<script lang="ts">
	import type Change from '$types/Change';

	export let change: Change;
</script>

<div class="status {change.status}">{change.status}</div>

<style>
	.status {
		padding: calc(var(--spacing) / 2);
		display: inline-block;
		align-self: flex-start;
	}

	.triage {
		background: var(--error);
		color: var(--background);
	}

	.backlog {
		background: var(--inactive);
		color: var(--foreground);
	}

	.active {
		background: var(--warning);
		color: var(--background);
	}

	.closed {
		background: var(--foreground);
		color: var(--background);
	}
</style>
