<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import { formatNextDate, getNextProcessDate } from '$database/Period';
	import Note from './Note.svelte';

	export let process: ProcessRow;

	$: nextDate = getNextProcessDate(process);
</script>

{#if nextDate}<Note><span>⟳ {formatNextDate(nextDate)}</span></Note>{/if}

<style>
	span {
		white-space: nowrap;
	}
</style>
