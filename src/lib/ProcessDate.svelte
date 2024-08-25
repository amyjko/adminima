<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import { formatNextDate, getNextProcessDate } from '$database/Period';
	import Note from './Note.svelte';

	export let process: ProcessRow;

	$: nextDate = getNextProcessDate(process);
</script>

{#if nextDate}<Note>⟳ {formatNextDate(nextDate)}</Note>{/if}
