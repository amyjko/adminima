<script lang="ts">
	import { type ChangeRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import ChangeLink from './ChangeLink.svelte';
	import PersonLink from './ProfileLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import Table from './Table.svelte';
	import Field from './Field.svelte';
	import Visibility from './Visibility.svelte';
	import Oops from './Oops.svelte';

	interface Props {
		changes: ChangeRow[];
		children?: import('svelte').Snippet;
	}

	let { changes, children }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	const user = getUser();
	const Levels = { triage: 0, active: 1, blocked: 2, done: 4, backlog: 3, declined: 5 };

	let visible = $derived(
		($user === null && org.getVisibility() === 'public') ||
			($user !== null && org.hasPerson($user.id))
	);

	let filter = $state('');
	let lowerFilter = $derived(filter.toLocaleLowerCase().trim());
	let filteredChanges = $derived(
		lowerFilter.length > 0
			? changes.filter(
					(change) =>
						change.what.toLocaleLowerCase().includes(lowerFilter) ||
						change.description.toLocaleLowerCase().includes(lowerFilter) ||
						change.proposal.toLocaleLowerCase().includes(lowerFilter)
				)
			: changes
	);
</script>

{#if !visible}
	<Oops text="Only showing public changes of this private organization." />
{/if}

{#if changes.length > 0}
	<Field label="Filter" bind:text={filter} />
	<Table>
		<thead>
			<tr>
				<th>status</th>
				<th>visibility</th>
				<th>lead</th>
				<th>title</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredChanges
				.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime())
				.sort((a, b) => Levels[a.status] - Levels[b.status]) as change}
				<tr>
					<td><Status status={change.status} /></td>
					<td><Visibility level={change.visibility} tip="Visibility of the change" /></td>
					<td
						>{#if change.lead}<PersonLink
								profile={org.getProfileWithID(change.lead)}
							/>{:else}&mdash;{/if}</td
					>
					<td><ChangeLink id={change.id} /></td>
				</tr>
			{/each}
		</tbody>
	</Table>
{:else}
	{@render children?.()}
{/if}

<style>
	tr:nth-child(even) {
		background-color: var(--separator);
	}
</style>
