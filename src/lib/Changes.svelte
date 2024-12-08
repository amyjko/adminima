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
	import Flow from './Flow.svelte';
	import StatusChooser from './StatusChooser.svelte';
	import Labeled from './Labeled.svelte';
	import { Statuses, type StatusType } from './status';
	import Notice from './Notice.svelte';
	import { page } from '$app/stores';
	import { goto, replaceState } from '$app/navigation';

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

	let filterText = $state(getInitialTextFilter());
	let filterStatus = $state<undefined | StatusType>(getInitialStatusFilter());

	let lowerFilter = $derived(filterText.toLocaleLowerCase().trim());
	let textFilteredChanges = $derived(
		lowerFilter.length > 0
			? changes.filter(
					(change) =>
						change.what.toLocaleLowerCase().includes(lowerFilter) ||
						change.description.toLocaleLowerCase().includes(lowerFilter) ||
						change.proposal.toLocaleLowerCase().includes(lowerFilter)
				)
			: changes
	);
	let statusFilteredChanges = $derived(
		filterStatus === undefined
			? textFilteredChanges
			: textFilteredChanges.filter((change) => change.status === filterStatus)
	);

	function getInitialTextFilter() {
		return decodeURI($page.url.searchParams.get('words') || '');
	}

	function getInitialStatusFilter() {
		const params = $page.url.searchParams;
		const status = params.get('status');
		return status !== null && status in Statuses ? (status as StatusType) : undefined;
	}

	// When the filters change, update the URL to match
	$effect(() => {
		const params = new URLSearchParams($page.url.searchParams.toString());
		if (filterText === '') params.delete('words');
		else params.set('words', encodeURI(filterText));
		if (filterStatus === undefined) params.delete('status');
		else params.set('status', filterStatus);
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	});
</script>

{#if !visible}
	<Oops text="Only showing public changes of this private organization." />
{/if}

{#if changes.length > 0}
	<Flow>
		<Field label="Filter by text" bind:text={filterText} />
		<Labeled label="Filter by status">
			<StatusChooser
				none={true}
				tip="Filter by status"
				change={(value) => (filterStatus = value)}
				value={filterStatus}
			/>
		</Labeled>
	</Flow>
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
			{#each statusFilteredChanges
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
			{:else}
				<tr>
					<td colspan="4"><Notice>All changes filtered.</Notice></td>
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
