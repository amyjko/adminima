<script lang="ts">
	import type { ProcessRow } from '$database/Organization';
	import { formatNextDate, getNextProcessDate } from '$database/Period';
	import Note from './Note.svelte';

	interface Props {
		process: ProcessRow;
		delta?: boolean;
	}

	let { process, delta = false }: Props = $props();

	let nextDate = $derived(getNextProcessDate(process));
</script>

{#if nextDate}<Note
		><span
			>{#if delta}+{Math.floor((nextDate.getTime() - Date.now()) / 1000 / 60 / 60 / 24)} days{:else}⟳
				{formatNextDate(nextDate)}{/if}</span
		></Note
	>{/if}

<style>
	span {
		white-space: nowrap;
	}
</style>
