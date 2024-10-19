<script lang="ts">
	interface Props {
		level: 'accountable' | 'responsible' | 'consulted' | 'informed' | '';
		verbose?: boolean;
	}

	let { level, verbose = false }: Props = $props();
</script>

<span class="level"
	><strong
		><span class="letter {level}">{level.charAt(0).toUpperCase()}</span
		>{#if verbose}{level.substring(1)}{/if}</strong
	></span
>

<style>
	.level {
		display: inline-block;
		font-weight: bold;
	}
	.accountable {
		color: var(--error);
	}

	.responsible {
		color: var(--salient);
	}

	.consulted {
		color: var(--warning);
	}

	.informed {
		color: var(--person);
	}
</style>
