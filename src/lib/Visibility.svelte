<script lang="ts">
	let { state }: { state: string } = $props();
</script>

<span class="visibility {state}">{state}</span>

<style>
	.visibility {
		flex-grow: 1;
		text-transform: none;
		display: inline-block;
		font-size: var(--small-size);
		padding: var(--padding);
		background: var(--warning);
		color: var(--background);
		border: solid var(--border) 1px;
	}

	.public {
		background: var(--salient);
		color: var(--background);
	}

	.org {
		background: var(--error);
		color: var(--background);
	}

	.admin {
		background: var(--foreground);
		color: var(--background);
	}
</style>
