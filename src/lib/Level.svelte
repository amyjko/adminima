<script lang="ts">
	export let level: 'accountable' | 'responsible' | 'consulted' | 'informed' | '';
</script>

<span class="level {level}">{level.charAt(0).toUpperCase()}</span>

<style>
	.level {
		display: inline-block;
		min-width: 2em;
		min-height: 2em;
		font-weight: bold;
		font-size: 200%;
		padding: var(--padding);
	}
	.accountable {
		color: var(--error);
	}

	.respnonsible {
		color: var(--salient);
	}

	.consulted {
		color: var(--warning);
	}

	.informed {
		color: var(--foreground);
	}
</style>
