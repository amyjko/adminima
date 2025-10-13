<script module lang="ts">
	type ProcessesMode = 'table' | 'list' | 'timeline' | 'duplicates';
	const StopWords = [
		'i',
		'me',
		'my',
		'myself',
		'we',
		'our',
		'ours',
		'ourselves',
		'you',
		'your',
		'yours',
		'yourself',
		'yourselves',
		'he',
		'him',
		'his',
		'himself',
		'she',
		'her',
		'hers',
		'herself',
		'it',
		'its',
		'itself',
		'they',
		'them',
		'their',
		'theirs',
		'themselves',
		'what',
		'which',
		'who',
		'whom',
		'this',
		'that',
		'these',
		'those',
		'am',
		'is',
		'are',
		'was',
		'were',
		'be',
		'been',
		'being',
		'have',
		'has',
		'had',
		'having',
		'do',
		'does',
		'did',
		'doing',
		'a',
		'an',
		'the',
		'and',
		'but',
		'if',
		'or',
		'because',
		'as',
		'until',
		'while',
		'of',
		'at',
		'by',
		'for',
		'with',
		'about',
		'against',
		'between',
		'into',
		'through',
		'during',
		'before',
		'after',
		'above',
		'below',
		'to',
		'from',
		'up',
		'down',
		'in',
		'out',
		'on',
		'off',
		'over',
		'under',
		'again',
		'further',
		'then',
		'once',
		'here',
		'there',
		'when',
		'where',
		'why',
		'how',
		'all',
		'any',
		'both',
		'each',
		'few',
		'more',
		'most',
		'other',
		'some',
		'such',
		'no',
		'nor',
		'not',
		'only',
		'own',
		'same',
		'so',
		'than',
		'too',
		'very',
		's',
		't',
		'can',
		'will',
		'just',
		'don',
		'should',
		'now'
	];
</script>

<script lang="ts">
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Title from '$lib/Title.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';
	import type { ProcessRow, RoleRow } from '$database/Organization';
	import type { RoleID } from '$database/Organization.js';
	import FormDialog from '$lib/FormDialog.svelte';
	import Field from '$lib/Field.svelte';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';
	import Oops from '$lib/Oops.svelte';
	import Concern from '$lib/Concern.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';
	import Table from '$lib/Table.svelte';
	import Status from '$lib/Status.svelte';
	import { getNextProcessDate, sortProcessesByNextDate } from '$database/Period';
	import ProcessDate from '$lib/ProcessDate.svelte';
	import Visibility from '$lib/VisibilityChooser.svelte';
	import { page } from '$app/state';
	import ProfileLink from '$lib/ProfileLink.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();

	const processes = $derived(data.processes);
	const hows = $derived(data.hows);
	const assignments = $derived(data.assignments);
	const profiles = $derived(data.profiles);
	const roles = $derived(data.roles);

	const context = getOrg();
	let org = $derived(context.org);

	const user = getUser();
	const db = getDB();

	/** Which view to show */
	const initialView = page.url.searchParams.get('view');
	let view = $state<ProcessesMode>(
		initialView === 'table' ||
			initialView === 'list' ||
			initialView === 'timeline' ||
			initialView === 'duplicates'
			? initialView
			: 'list'
	);

	let isAdmin = $derived($user && context.admin);

	let visible = $derived(
		($user === null && org.visibility === 'public') || ($user !== null && context.member)
	);

	let filter = $state(getInitialTextFilter());
	let lowerFilter = $derived(filter.toLocaleLowerCase().trim());

	let personRoles = $derived(
		$user ? Organization.getPersonRoles(profiles, assignments, $user.id) : []
	);

	/** The filtered processes */
	let filteredProcesses = $derived(
		processes
			.filter(
				(p) =>
					lowerFilter.length === 0 ||
					p.title.toLowerCase().includes(lowerFilter) ||
					p.short.some((name) => name.toLowerCase().includes(lowerFilter)) ||
					(p.accountable &&
						Organization.getRoleProfiles(p.accountable, assignments, profiles).some((profile) =>
							profile.name.toLowerCase().includes(lowerFilter)
						)) ||
					(p.howid !== null &&
						Organization.getHow(hows, p.howid)?.responsible.some((role) =>
							Organization.getRoleProfiles(role, assignments, profiles).some((profile) =>
								profile.name.toLowerCase().includes(lowerFilter)
							)
						))
			)
			.sort((a, b) => {
				const howA = Organization.getHow(hows, a.id);
				const howB = Organization.getHow(hows, b.id);
				if (howA === undefined || howB === undefined) return 0;

				return (
					howB.responsible.length +
					howB.consulted.length +
					howB.informed.length -
					(howA.responsible.length + howA.consulted.length + howA.informed.length)
				);
			})
	);

	let concerns = $derived(Array.from(new Set(processes.map((process) => process.concern))));

	function getRolesByAccountability(processes: ProcessRow[]): RoleRow[] {
		const rolesByARCI: Map<RoleID, { a: number; r: number; c: number; i: number }> = new Map();

		for (const process of processes) {
			const processHows = Organization.getProcessHows(hows, process.id);

			if (process.accountable && !rolesByARCI.has(process.accountable))
				rolesByARCI.set(process.accountable, { a: 0, r: 0, c: 0, i: 0 });

			let tally = process.accountable
				? rolesByARCI.get(process.accountable)
				: { a: 0, r: 0, c: 0, i: 0 };
			if (tally) tally.a++;

			for (const how of processHows) {
				for (const role of how.responsible) {
					if (!rolesByARCI.has(role)) rolesByARCI.set(role, { a: 0, r: 0, c: 0, i: 0 });
					tally = rolesByARCI.get(role);
					if (tally) tally.r++;
				}

				for (const role of how.consulted) {
					if (!rolesByARCI.has(role)) {
						rolesByARCI.set(role, { a: 0, r: 0, c: 0, i: 0 });
					}
					tally = rolesByARCI.get(role);
					if (tally) tally.c++;
				}

				for (const role of how.informed) {
					if (!rolesByARCI.has(role)) {
						rolesByARCI.set(role, { a: 0, r: 0, c: 0, i: 0 });
					}
					tally = rolesByARCI.get(role);
					if (tally) tally.i++;
				}
			}
		}

		return Array.from(rolesByARCI.keys())
			.sort((a, b) => {
				const ao = rolesByARCI.get(a);
				const bo = rolesByARCI.get(b);
				if (ao === undefined || bo === undefined) return 0;
				return (
					bo.a * 1000 +
					bo.r * 100 +
					bo.c * 10 +
					bo.i -
					(ao.a * 1000 + ao.r * 100 + ao.c * 10 + ao.i)
				);
			})
			.map((id) => Organization.getRoleByID(roles, id))
			.filter((r): r is RoleRow => r !== undefined);
	}

	function getDuplicates(
		processes: ProcessRow[]
	): { words: string[]; processes: Set<ProcessRow> }[] {
		const processWords: { words: string[]; process: ProcessRow }[] = [];
		for (const process of processes) {
			// Split title by words, lowercase, filter out short words, sort alphabetically.
			const words = [
				...new Set(
					process.title
						.toLowerCase()
						.split(/\W+/)
						.slice(1) // Skip the first word, which is usually a verb, and not revealing of the topic
						.filter((w) => w.length > 3 && !StopWords.includes(w))
						.toSorted()
				)
			];
			processWords.push({ words, process });
		}

		const duplicates: { words: string[]; processes: Set<ProcessRow> }[] = [];

		for (let a = 0; a < processWords.length; a++) {
			for (let b = a + 1; b < processWords.length; b++) {
				const common = processWords[a].words.filter((word) => processWords[b].words.includes(word));
				// If >=75% of the words are in common, count as a duplicate.
				if (
					common.length / Math.min(processWords[a].words.length, processWords[b].words.length) >=
					0.75
				) {
					// See if we already have this combination of processes
					const existing = duplicates.find((d) => d.words.join(',') === common.join(','));
					if (existing) existing.processes.add(processWords[b].process);
					else
						duplicates.push({
							words: common,
							processes: new Set([processWords[a].process, processWords[b].process])
						});
				}
			}
		}

		return Array.from(duplicates);
	}

	let title = $state('');
	async function newProcess() {
		const { error, id } = await db.addProcess(org.id, title, org.visibility);
		if (error) {
			addError("Couldn't add new process", error);
			return false;
		} else {
			await goto(`/org/${Organization.getPath(org)}/process/${id}`);
			return true;
		}
	}

	function getInitialTextFilter() {
		return decodeURI(page.url.searchParams.get('words') || '');
	}

	// When the filters change, update the URL to match
	$effect(() => {
		const params = new URLSearchParams(page.url.searchParams.toString());
		const start = params.toString();

		if (filter === '') params.delete('words');
		else params.set('words', encodeURI(filter));

		params.set('view', view);

		// If the query string changed, change the URL.
		if (start !== params.toString())
			goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	});
</script>

<Title title="Processes" kind="process" label={false} />

<Tip member
	><p>
		These are all of the processes in this organization and which roles are involved in them. Select
		one to see how it works, who's responsible for it, or to suggest a change. Change process
		concerns in each process's page.
	</p>
	<p>
		<Level level="accountable" />ccountable roles are in charge of the process's outcomes.
		<br /><Level level="responsible" />esponsible roles complete a process.
		<br /><Level level="consulted" />onsulted roles provide input, information, and guidance on a
		process.
		<br /><Level level="informed" />nformed roles are notified a process is happening and of its
		outcomes.
	</p>
</Tip>

{#if !visible}
	<Oops text="Only showing public processes of this private organization." />
{/if}

{#if $user && context.member}
	<FormDialog
		button="Create process …"
		showTip="Create a new process."
		submitTip="Create this new process."
		header="New process"
		explanation="Let's give the process a name."
		submit="Create"
		inactive="Fill in a title."
		action={newProcess}
		valid={() => title.length > 0}
	>
		<Field active={true} label="title" bind:text={title} />
	</FormDialog>
{/if}

<Field fill label="Filter by title or accountable/responsible person" bind:text={filter} />

<fieldset>
	<div>
		<input type="radio" id="view-list" name="list" value="list" bind:group={view} />
		<label for="view-list">List</label>
	</div>
	<div>
		<input type="radio" id="view-table" name="table" value="table" bind:group={view} />
		<label for="view-table">Table</label>
	</div>
	<div>
		<input type="radio" id="view-timeline" name="timeline" value="timeline" bind:group={view} />
		<label for="view-timeline">Timeline</label>
	</div>
	<div>
		<input
			type="radio"
			id="view-duplicates"
			name="duplicates"
			value="duplicates"
			bind:group={view}
		/>
		<label for="view-duplicates">Duplicates</label>
	</div>
</fieldset>

{#snippet ConcernHeader(concern: string)}
	<Header
		><Concern
			{concern}
			edit={isAdmin ? (newConcern) => db.renameConcern(org.id, concern, newConcern) : undefined}
		/></Header
	>
{/snippet}

{#if processes.length === 0}
	<Notice>This organization has no processes.</Notice>
{:else if filteredProcesses.length === 0}
	<Notice>All processes filtered.</Notice>
{:else if view === 'table'}
	<Tip>Processes by concern, with status, visibility, and ARCI.</Tip>
	{#each concerns as concern}
		<!-- Find the matching for this concern and the filter -->
		{@const processes = sortProcessesByNextDate(
			filteredProcesses.filter((p) => p.concern === concern)
		)}

		{@const roles = getRolesByAccountability(processes)}

		{#if processes.length > 0}
			<div class="concern full">
				{@render ConcernHeader(concern)}
				<div class="processes">
					<Table>
						<thead>
							<tr>
								<th style:width="4em">status</th>
								<th style:width="4em">visibility</th>
								<th style:width="6em">repeats</th>
								<th style:width="20em">process</th>
								{#each roles as role}
									<th class="role" class:me={personRoles.includes(role.id)}
										><RoleLink {role} />
									</th>
								{:else}
									<th></th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each processes as process}
								{@const how =
									process.howid !== null ? Organization.getHow(hows, process.howid) : undefined}
								{@const processHows = Organization.getProcessHows(hows, process.id)}
								<tr>
									<td><Status status={process.state} /></td>
									<td width="4em"
										>{#if how}<Visibility
												tip="The visibility of tis process"
												level={how.visibility}
											/>{/if}</td
									>
									<td><ProcessDate {process} /></td>
									<td><ProcessLink wrap {process} /></td>
									{#each roles as role}
										<td class="level" class:me={personRoles.includes(role.id)}
											><Level
												level={process?.accountable === role.id
													? 'accountable'
													: processHows.some((how) => how.responsible.includes(role.id))
														? 'responsible'
														: processHows.some((how) => how.consulted.includes(role.id))
															? 'consulted'
															: processHows.some((how) => how.informed.includes(role.id))
																? 'informed'
																: ''}
											/></td
										>{:else}<td><em>no roles</em></td>{/each}
								</tr>
							{/each}
						</tbody>
					</Table>
				</div>
			</div>
		{/if}
	{/each}
{:else if view === 'list'}
	<Tip>Processes by concern, with those accountable and responsible.</Tip>
	<!-- The list view still groups by concerns -->
	{#each concerns as concern}
		{@const processes = filteredProcesses.filter((p) => p.concern === concern)}
		{#if processes.length > 0}
			<div class="concern">
				{@render ConcernHeader(concern)}
				<div class="processes">
					{#each processes as process}
						<div class="process">
							<ProcessLink wrap {process}></ProcessLink>
							{#if process.accountable}
								{@const accountable = Organization.getRoleProfiles(
									process.accountable,
									assignments,
									profiles
								)}
								{@const responsible =
									process.howid !== null
										? (Organization.getHow(hows, process.howid)
												?.responsible.map((r) =>
													Organization.getRoleProfiles(r, assignments, profiles)
												)
												.flat() ?? [])
										: []}
								<div class="process-people">
									<div class="arrow">↳</div>
									<div class="people">
										{#if accountable.length < 3}
											{#each accountable as profile}
												<ProfileLink short {profile} />
											{/each}
										{:else}
											<span><strong>{accountable.length}</strong> accountable</span>
										{/if}
										{#if responsible.length <= 3}
											{#each responsible as profile}
												<ProfileLink short {profile} />
											{/each}
										{:else}
											<span>and <strong>{responsible.length}</strong> responsible</span>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
{:else if view === 'timeline'}
	{@const timedProcesses = filteredProcesses
		.filter((p) => p.repeat.length > 0)
		.toSorted((p1, p2) => {
			const d1 = getNextProcessDate(p1);
			const d2 = getNextProcessDate(p2);
			if (d1 === undefined && d2 === undefined) return 0;
			if (d1 === undefined) return 1;
			if (d2 === undefined) return -1;
			return d1.getTime() - d2.getTime();
		})}
	<Tip>Timed processes, in order of when they are next due.</Tip>
	<table>
		<thead>
			<tr>
				<th>next date</th>
				<th>in</th>
				<th>process</th>
			</tr>
		</thead>
		<tbody>
			{#each timedProcesses as process (process.id)}
				<tr>
					<td><ProcessDate {process} /></td>
					<td><ProcessDate delta {process} /></td>
					<td><ProcessLink {process} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else if view === 'duplicates'}
	<Tip>Potentially duplicate processes with titles that overlap by two or more words.</Tip>

	<!-- Compute all of the processes for which there are two or more processes with two overlapping words -->
	{@const duplicates = getDuplicates(filteredProcesses)}
	{#if duplicates.length === 0}{:else}
		<ul>
			{#each duplicates as duplicate}
				<li><em>{duplicate.words.join(', ')}</em></li>
				<ul>
					{#each duplicate.processes as process}
						<li><ProcessLink {process} /></li>
					{/each}
				</ul>
			{:else}
				<Notice>No duplicate or overlapping process titles found.</Notice>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.concern.full {
		width: calc(100vw - 2em);
		margin-left: calc(-1 * (100vw - 2em - 100%) / 2);
	}

	td,
	th {
		vertical-align: baseline;
		font-size: var(--small-size);
	}

	th {
		vertical-align: bottom;
	}

	.level {
		text-align: center;
		vertical-align: middle;
	}

	.role {
		writing-mode: vertical-rl;
		text-align: end;
	}

	tr:nth-child(even) {
		background-color: var(--separator);
	}

	.me {
		background: var(--warning-light);
	}

	fieldset {
		display: flex;
		flex-direction: row;
		gap: var(--spacing);
	}

	.processes {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.process {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: calc(var(--spacing) / 2);
		align-items: baseline;
	}

	.process-people {
		display: flex;
		flex-direction: row;
		gap: calc(var(--spacing) / 2);
		font-size: var(--small-size);
		align-items: baseline;
		padding-inline-start: var(--spacing);
	}

	.arrow {
		display: flex;
		flex-direction: row;
		align-items: start;
		height: 1em;
	}

	.people {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: calc(var(--spacing) / 2);
		row-gap: calc(var(--spacing) / 2);
	}
</style>
