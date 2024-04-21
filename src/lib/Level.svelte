<script lang="ts">
	export let level: 'accountable' | 'responsible' | 'consulted' | 'informed' | '';
</script>

<span class="level {level}">{level.charAt(0).toUpperCase()}</span>

<style>
	.level {
		display: inline-block;
		font-weight: bold;
		font-size: 200%;
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
		color: var(--foreground);
	}
</style>
