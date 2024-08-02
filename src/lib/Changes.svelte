<script lang="ts">
	import { type ChangeRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import ChangeLink from './ChangeLink.svelte';
	import PersonLink from './ProfileLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';
	import Table from './Table.svelte';
	import Field from './Field.svelte';

	export let changes: ChangeRow[];

	const org = getOrg();
	const Levels = { triage: 0, active: 1, done: 3, backlog: 2 };

	let filter = '';
	$: lowerFilter = filter.toLocaleLowerCase().trim();
	$: filteredChanges =
		lowerFilter.length > 0
			? changes.filter(
					(change) =>
						change.what.toLocaleLowerCase().includes(lowerFilter) ||
						change.description.toLocaleLowerCase().includes(lowerFilter) ||
						change.proposal.toLocaleLowerCase().includes(lowerFilter)
			  )
			: changes;
</script>

{#if changes.length > 0}
	<Field label="Filter" bind:text={filter} />
	<Table>
		<thead>
			<tr>
				<th>lead</th>
				<th>title</th>
				<th>status</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredChanges
				.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime())
				.sort((a, b) => Levels[a.status] - Levels[b.status]) as change}
				<tr>
					<td
						>{#if change.lead}<PersonLink
								profile={$org.getProfileWithID(change.lead)}
							/>{:else}&mdash;{/if}</td
					>
					<td><ChangeLink id={change.id} /></td><td><Status status={change.status} /></td>
				</tr>
			{/each}
		</tbody>
	</Table>
{:else}
	<slot />
{/if}
