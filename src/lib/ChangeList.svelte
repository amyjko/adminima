<script lang="ts">
	import type Change from '../types/Change';
	import ChangeLink from './ChangeLink.svelte';
	import PersonLink from './PersonLink.svelte';
	import Status from './Status.svelte';

	export let changes: Change[];
</script>

{#if changes.length > 0}
	<table>
		<thead>
			<tr>
				<th>status</th>
				<th>reporter</th>
				<th>title</th>
			</tr>
		</thead>
		<tbody>
			{#each changes.sort((a, b) => a.modifications[0]?.when ?? 0 - b.modifications[0]?.when ?? 0) as change}
				<tr>
					<td><Status {change} /></td>
					<td><PersonLink personID={change.who} /></td>
					<td><ChangeLink requestID={change.id} /></td></tr
				>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	table {
		border-collapse: collapse;
		padding: var(--padding);
	}
</style>
