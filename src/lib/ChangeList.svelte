<script lang="ts">
	import { type ChangeRow } from '$database/Organizations';
	import timestampToDate from '$database/timestampToDate';
	import ChangeLink from './ChangeLink.svelte';
	import PersonLink from './PersonLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';

	export let changes: ChangeRow[];

	const org = getOrg();
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
			{#each changes.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime()) as change}
				<tr>
					<td><Status status={change.status} /></td>
					<td><PersonLink profile={$org.getProfileWithID(change.who)} /></td>
					<td><ChangeLink changeID={change.id} /></td></tr
				>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No changes have been proposed for this organization.</p>
{/if}

<style>
	table {
		border-collapse: collapse;
		padding: var(--padding);
	}
</style>
