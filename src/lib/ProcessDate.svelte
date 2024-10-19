<script lang="ts">
	import type { ProcessRow } from '$database/OrganizationsDB';
	import { formatNextDate, getNextProcessDate } from '$database/Period';
	import Note from './Note.svelte';

	interface Props {
		process: ProcessRow;
	}

	let { process }: Props = $props();

	let nextDate = $derived(getNextProcessDate(process));
</script>

{#if nextDate}<Note><span>⟳ {formatNextDate(nextDate)}</span></Note>{/if}

<style>
	span {
		white-space: nowrap;
	}
</style>
