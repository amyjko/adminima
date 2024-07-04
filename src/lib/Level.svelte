<script lang="ts">
	export let level: 'accountable' | 'responsible' | 'consulted' | 'informed' | '';
	export let verbose = false;
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
