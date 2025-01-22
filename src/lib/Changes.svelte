<script lang="ts">
	import { type ChangeRow, type CommentRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import ChangeLink from './ChangeLink.svelte';
	import ProfileLink, { ProfileItem } from './ProfileLink.svelte';
	import Status from './Status.svelte';
	import { getDB, getOrg } from '$routes/+layout.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import Table from './Table.svelte';
	import Field from './Field.svelte';
	import Oops from './Oops.svelte';
	import Flow from './Flow.svelte';
	import StatusChooser from './StatusChooser.svelte';
	import Labeled from './Labeled.svelte';
	import { Statuses, type StatusType } from './status';
	import Notice from './Notice.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import MarkupView from './MarkupView.svelte';
	import TimeView from './TimeView.svelte';
	import Dialog from './Dialog.svelte';
	import NewComment from './NewComment.svelte';
	import Button from './Button.svelte';
	import Options from './Options.svelte';

	interface Props {
		changes: ChangeRow[];
		children?: import('svelte').Snippet;
	}

	let { changes, children }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();

	const user = getUser();
	const Levels = { triage: 0, active: 1, blocked: 2, done: 4, backlog: 3, declined: 5 };

	let visible = $derived(
		($user === null && org.getVisibility() === 'public') ||
			($user !== null && org.hasPerson($user.id))
	);

	let filterText = $state(getInitialTextFilter());
	let filterStatus = $state<undefined | StatusType>(getInitialStatusFilter());
	let filterLead = $state<undefined | string>(getInitialLeadFilter());

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

	let leadFilteredChanges = $derived(
		filterLead === undefined
			? statusFilteredChanges
			: statusFilteredChanges.filter((change) => change.lead === filterLead)
	);

	let filteredChanges = $derived(leadFilteredChanges);

	/** The change for which a comment is being submitted */
	let submittingComment: ChangeRow | undefined = $state(undefined);
	function hideNewComment() {
		submittingComment = undefined;
	}

	function getInitialTextFilter() {
		return decodeURI($page.url.searchParams.get('words') || '');
	}

	function getInitialStatusFilter() {
		const params = $page.url.searchParams;
		const status = params.get('status');
		return status !== null && status in Statuses ? (status as StatusType) : undefined;
	}

	function getInitialLeadFilter() {
		const params = $page.url.searchParams;
		const lead = params.get('lead');
		return lead !== null ? lead : undefined;
	}

	// When the filters change, update the URL to match
	$effect(() => {
		const params = new URLSearchParams($page.url.searchParams.toString());
		const start = params.toString();
		if (filterText === '') params.delete('words');
		else params.set('words', encodeURI(filterText));
		if (filterStatus === undefined) params.delete('status');
		else params.set('status', filterStatus);
		if (filterLead === undefined) params.delete('lead');
		else params.set('lead', filterLead);
		// Did the params change? Navigate.
		if (start !== params.toString())
			goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	});

	// The filtered list of comment IDs that we need to asynchronously load.
	let latestCommentIDs = $derived(
		filteredChanges.map((change) => change.comments.at(-1))?.filter((c) => c !== undefined)
	);
	let latestComments = $state<CommentRow[]>([]);

	// Whenever the changes update, retrieve the latest comments.
	$effect(() => {
		db.getComments(latestCommentIDs).then((comments) => {
			latestComments = comments.data ?? [];
		});
	});
</script>

{#if !visible}
	<Oops text="Only showing public changes of this private organization." />
{/if}

{#if changes.length > 0}
	<Flow>
		<Field label="Filter by title" bind:text={filterText} />
		<Labeled label="Filter by status">
			<StatusChooser
				none={true}
				tip="Filter by status"
				change={(value) => (filterStatus = value)}
				value={filterStatus}
			/>
		</Labeled>
		<Labeled label="Filter by lead">
			<!-- An option of all leads specified in the changes -->
			<Options
				id="lead-chooser"
				tip="Filter by lead"
				selection={filterLead}
				options={[
					undefined,
					...[...new Set(changes.map((change) => change.lead))]
						.filter((lead) => lead !== null)
						.sort((a, b) =>
							(org.getProfileNameOrEmail(a) ?? '').localeCompare(org.getProfileNameOrEmail(b) ?? '')
						)
				]}
				view={ProfileItem}
				change={(value) => (filterLead = value)}
			/>
		</Labeled>
	</Flow>
	<Table fixed>
		<thead>
			<tr>
				<th style="width: 3em">status</th>
				<!-- <th>visibility</th> -->
				<th style="width: 10%; min-width: 5em;">lead</th>
				<td style="width: 5em">review</td>
				<th>title</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredChanges
				.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime())
				.sort( (a, b) => (a.review === null ? (b.review === null ? 0 : -1) : b.review === null ? 1 : timestampToDate(a.review).getTime() - timestampToDate(b.review).getTime()) )
				.sort((a, b) => Levels[a.status] - Levels[b.status]) as change}
				<!-- Get the most recent comment -->
				{@const comment = latestComments.find((c) => c.id === change.comments.at(-1))}
				<tr>
					<td><Status status={change.status} /></td>
					<!-- <td><Visibility level={change.visibility} tip="Visibility of the change" /></td> -->
					<td
						>{#if change.lead}<ProfileLink
								short
								profile={org.getProfileWithID(change.lead)}
							/>{:else}&mdash;{/if}</td
					>
					<td
						>{#if change.review}<TimeView
								time={false}
								date={new Date(Date.parse(change.review))}
								warning={change.review !== null &&
									new Date(Date.parse(change.review)).getTime() < Date.now()}
							/>{/if}</td
					>
					<td class="info">
						<ChangeLink id={change.id} />
						<div class="update">
							<Button tip="Add comment to change" action={() => (submittingComment = change)}
								>+</Button
							>
							{#if comment}
								<em>{(org.getPersonNameOrEmail(comment.who) ?? '—').split(' ')[0]}</em>
								<TimeView time={false} date={timestampToDate(comment.when)} />
								<MarkupView small markup={comment.what.split('\n')[0]} placeholder="status"
								></MarkupView>
							{/if}
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4"><Notice>All changes filtered.</Notice></td>
				</tr>
			{/each}
		</tbody>
	</Table>

	{#if submittingComment}
		<Dialog close={hideNewComment}>
			<NewComment change={submittingComment} submitted={hideNewComment} />
		</Dialog>
	{/if}
{:else}
	{@render children?.()}
{/if}

<style>
	tr:nth-child(even) {
		background-color: var(--separator);
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing) / 2);
		align-items: flex-start;
	}

	.update {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		font-size: var(--small-size);
		gap: 1em;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
</style>
