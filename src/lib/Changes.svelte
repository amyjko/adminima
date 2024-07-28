<script lang="ts">
	import { type ChangeRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import ChangeLink from './ChangeLink.svelte';
	import PersonLink from './ProfileLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';
	import Table from './Table.svelte';

	export let changes: ChangeRow[];

	const org = getOrg();
	const Levels = { triage: 0, active: 1, done: 3, backlog: 2 };
</script>

{#if changes.length > 0}
	<Table>
		<thead>
			<tr>
				<th>lead</th>
				<th>title</th>
				<th>status</th>
			</tr>
		</thead>
		<tbody>
			{#each changes
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
