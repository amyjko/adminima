<script lang="ts">
	import { run } from 'svelte/legacy';

	import MarkupView from '$lib/MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import HowView from '$lib/HowView.svelte';
	import Oops from '$lib/Oops.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Title from '$lib/Title.svelte';
	import Level from '$lib/Level.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import CommentsView from '$lib/CommentsView.svelte';
	import Concern from '$lib/Concern.svelte';
	import Field from '$lib/Field.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import { setContext, tick } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import Changes from '$lib/Changes.svelte';
	import RoleLink, { RoleItem } from '$lib/RoleLink.svelte';
	import Tip from '$lib/Tip.svelte';
	import ChangeLink from '$lib/ChangeLink.svelte';
	import Visibility from '$lib/VisibilityChooser.svelte';
	import Note from '$lib/Note.svelte';
	import ARCI from '$lib/ARCI.svelte';
	import type { HowRow } from '$database/Organization';
	import type { HowID } from '$database/Organization.js';
	import Flow from '$lib/Flow.svelte';
	import PathEditor from '$lib/PathEditor.svelte';
	import Status from '$lib/Status.svelte';
	import Period from '$lib/Period.svelte';
	import type { default as PeriodType } from '$database/Period';
	import Options from '$lib/Options.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();

	const process = $derived(data.process);
	const hows = $derived(data.hows);
	const roles = $derived(data.roles);
	const changes = $derived(data.changes);
	const concerns = $derived(data.concerns);
	const personRoles = $derived(data.personRoles);
	const profiles = $derived(data.profiles);

	let deleteError: string | undefined = $state(undefined);

	const context = getOrg();
	let org = $derived(context.org);

	const user = getUser();
	const db = getDB();

	const States = { draft: 'Draft', active: 'Active', archived: 'Archived' };

	let how = $derived(
		process && process.howid ? Organization.getHow(hows, process.howid) : undefined
	);
	let repeat = $derived(process !== null ? process.repeat : undefined) as PeriodType[];

	// This mirrors the row-level security policy: only admins and people with an accountable or responsible role can edit this policy.
	let isAdmin = $derived(context.admin);
	let accountable = $derived(
		$user !== null &&
			process !== null &&
			(process.accountable === null || personRoles.includes(process.accountable))
	);
	let responsible = $derived(
		$user !== null &&
			process !== null &&
			(isAdmin ||
				accountable ||
				Organization.getProcessHows(hows, process.id).some(
					(how) => how.responsible.filter((r) => personRoles.includes(r)).length > 0
				))
	);
	let editable = $derived(process !== null && $user !== null && responsible);

	let newConcern = $state('');

	let newPeriod: string | undefined = $state(undefined);

	const focusID = writable<string | undefined>(undefined);
	setContext<Writable<string | undefined>>('focusID', focusID);

	// When the org changes, and there's a focus ID to focus on, focus on it.
	run(() => {
		if (org && browser && $focusID) {
			tick().then(() => {
				const element = document.getElementById(`how-${$focusID}`);
				if (element) {
					element.focus();
					focusID.set(undefined);
				}
			});
		}
	});

	async function createFirstSubtask(how: HowRow) {
		if (process === null) return;
		const { error, id } = await db.insertHow(process, how.visibility, how, 0);
		if (error) addError('Unable to insert how.', error);
		else if (id) focusID.set(id);
	}

	async function uncheckAll(uncheck: boolean) {
		function enumerate(how: HowRow, list: HowID[] = []) {
			list.push(how.id);
			for (const subhow of how.how
				.map((id) => Organization.getHow(hows, id))
				.filter((h): h is HowRow => h !== undefined)) {
				enumerate(subhow, list);
			}
			return list;
		}
		if (how === undefined) return;
		const subhows = enumerate(how);
		await Promise.all(
			subhows.map((h) => {
				const sub = Organization.getHow(hows, h);
				if (sub) db.updateHowDone(sub, uncheck ? 'no' : 'yes');
			})
		);
	}

	async function addPeriod(kind: string | undefined) {
		// Reset the selection
		newPeriod = undefined;

		if (process === null) return true;
		// Create an initial period based on the type chosen.
		const periodToAdd: PeriodType | undefined =
			kind === 'annually-date'
				? { type: kind, month: 1, date: 1 }
				: kind === 'annually-week'
					? { type: kind, week: 1, day: 1 }
					: kind === 'monthly-date'
						? { type: kind, day: 1 }
						: kind === 'monthly-weekday'
							? { type: kind, week: 1, day: 1 }
							: kind === 'weekly'
								? { type: kind, weeks: 1, day: 1 }
								: undefined;
		if (periodToAdd) {
			const error = await db.addProcessPeriod(process, periodToAdd);
			if (error) addError('Unable to add period.', error);
			return error === null;
		}
		return true;
	}
</script>

{#snippet concernView(value: string | undefined)}
	{#if value}
		<Concern concern={value} />
	{:else}
		&mdash;
	{/if}
{/snippet}

{#if how === undefined}
	<Title title={process.title} kind="process" />
	<Oops text="This process could not be fully loaded." />
{:else if how.visibility !== 'public' && ($user === null || !context.member)}
	<Title title={org.name} />
	<Oops
		text="This process is only visible to people in the organization. If you believe you have access, ensure you're logged in."
	/>
{:else}
	<Title
		title={process.title}
		kind="process"
		edit={$user && editable
			? (text) =>
					queryOrError(
						db.updateProcessTitle(process, text, $user.id),
						"Couldn't update process title."
					)
			: undefined}
	>
		<Flow>
			<Note>Visibility</Note>
			<Visibility
				tip="Change visibility of this process"
				level={how.visibility}
				edit={editable
					? (vis) =>
							vis === 'public' || vis === 'org' || vis === 'admin'
								? db.updateHowVisibility(how, vis)
								: undefined
					: undefined}
			/>
			<Note inline
				>{#if how.visibility === 'public'}Everyone on the internet can see this process{:else if how.visibility === 'org'}Only
					members can see this process.{:else if how.visibility === 'admin'}Only admins can see this
					process.{/if}</Note
			>
		</Flow>
		<Flow>
			<Note>Status</Note>
			{#if editable}
				{#snippet status(status: string | undefined)}
					{#if status}
						<Status {status} />
					{/if}
				{/snippet}
				<Options
					tip="Change the state of this process"
					selection={process.state}
					options={Object.entries(States).map(([key, value]) => key)}
					change={async (status) => {
						if ($user && (status === 'draft' || status === 'active' || status === 'archived'))
							return (
								(await queryOrError(
									db.updateProcessState(process, status, $user.id),
									"Couldn't update the process's state"
								)) === null
							);
						else return true;
					}}
					id="process-state"
					view={{ snippet: status, data: [] }}
				/>
			{:else}
				<Status status={process.state} />
			{/if}

			<Note>Concern</Note>
			{#if editable && $user && concerns.length > 0}
				<Options
					tip="Change this process's concern"
					selection={process.concern}
					options={concerns.toSorted()}
					change={async (concern) =>
						(await queryOrError(
							db.updateProcessConcern(process, concern ?? '', $user.id),
							"Couldn't update process's concern"
						)) === null}
					id="concer-chooser"
					view={{ snippet: concernView, data: [] }}
				/>{:else}
				<Concern concern={process.concern} />
			{/if}
			{#if editable && $user}
				<FormDialog
					submit="Create new concern"
					showTip="Create a new concern."
					submitTip="Create and select this new concern."
					button="+ concern"
					header="Set a new concern"
					explanation="Set a new concern to group processes."
					inactive="Fill in a concern that doesn't exist yet."
					valid={() => newConcern.length > 0 && concerns.indexOf(newConcern) === -1}
					action={async () => {
						const error = await queryOrError(
							db.updateProcessConcern(process, newConcern, $user.id),
							"Couldn't update concern."
						);
						if (error) return false;
						newConcern = '';
						return true;
					}}
				>
					<Field label="new concern" bind:text={newConcern} />
				</FormDialog>
			{/if}
			{#if isAdmin}<Note>Link</Note><PathEditor
					short={process.short[0] ?? ''}
					path={'...process/'}
					update={async (text) => {
						await queryOrError(
							db.updateProcessShortName(process, text),
							"Couldn't update process's short name"
						);
						await goto(
							`/org/${Organization.getPath(org)}/process/${text.length > 0 ? text : process.id}`,
							{
								replaceState: true
							}
						);
						return null;
					}}
				/>{/if}
		</Flow>
	</Title>

	<Tip member
		>Admins and anyone <Level level="accountable" verbose /> or <Level
			level="responsible"
			verbose
		/> can edit a process. If no one is accountable, anyone in the organization can edit.</Tip
	>

	<MarkupView
		markup={how.what}
		placeholder="No description yet."
		edit={editable ? (text) => db.updateHowText(how, text) : undefined}
	/>

	<Header>Who</Header>

	<div>
		{#if editable}
			{@const sortedRoles = roles.toSorted((a, b) => a.title.localeCompare(b.title))}
			<Options
				id="choose-accountable"
				tip="Choose a role to be accountable for the processes outcomes."
				options={[
					undefined,
					...sortedRoles.toSorted((a, b) => a.title.localeCompare(b.title)).map((role) => role.id)
				]}
				searchable={{
					placeholder: 'role',
					include: (item: string, query: string) =>
						sortedRoles
							.find((r) => r.id === item)
							?.title.toLowerCase()
							.includes(query.toLowerCase()) === true
				}}
				view={{ snippet: RoleItem, data: roles }}
				selection={process.accountable ?? undefined}
				change={async (value) =>
					(await db.updateProcessAccountable(process, value ?? null)) === null}
			/>
		{:else if process.accountable}
			<RoleLink role={roles.find((r) => r.id === process.accountable)} />
		{:else}
			No one
		{/if}
		is
		<Level level="accountable" verbose /> for this processes outcomes
		{#if how.responsible.length === 0}
			&nbsp;(and <Level level="responsible" verbose /> for completing it, as no one else is responsible)
		{/if}
	</div>
	<ARCI {how} {roles} verbose {editable} />

	<Header>When</Header>

	{#if editable}
		<Tip
			>Setting one or more periods for when a process starts helps communicate when it should
			happen.</Tip
		>
		{#snippet period(period: string | undefined)}
			<div style:padding="var(--padding)">
				{#if period === undefined}
					add a period
				{:else if period === 'annually-date'}
					Annually on a specific date (e.g., every March 1st)
				{:else if period === 'annually-week'}
					Annually on a specific week and weekday (e.g., every 13th week on Monday)
				{:else if period === 'monthly-date'}
					Monthly on a specific day (e.g., every 1st of the month)
				{:else if period === 'monthly-weekday'}
					Monthly on a specific weekday (e.g., 2nd Monday of each month)
				{:else if period === 'weekly'}
					Every N weeks on a specific day (e.g., every 2 weeks on Monday)
				{/if}
			</div>
		{/snippet}
		<Options
			id="choose-period"
			tip="Add a frequency on which this process occurs"
			view={{ snippet: period, data: [] }}
			options={['annually-date', 'annually-week', 'monthly-date', 'monthly-weekday', 'weekly']}
			bind:selection={newPeriod}
			change={addPeriod}
		/>
	{/if}
	{#if repeat && repeat.length > 0}
		{#each repeat as period, index}
			<Period
				{period}
				edit={editable
					? async (period) => {
							const error = await db.updateProcessPeriod(process, period, index);
							if (error) addError("Couldn't update period.", error);
							return error === null;
						}
					: undefined}
				remove={editable
					? async () => {
							const error = await db.removeProcessPeriod(process, index);
							if (error) addError("Coudln't remove period");
							return error === null;
						}
					: undefined}
			/>
		{/each}
	{:else}
		This process doesn't happen at a particular time.
	{/if}

	<Header>How</Header>

	<Tip member
		>If you want to provide more detail about how to do this process, you can add a list of tasks
		and subtasks, and specify for each, who is <Level level="responsible" verbose /> for doing it, and
		who is <Level level="consulted" verbose /> and <Level level="informed" verbose /> about it. Adding
		this level of detail will let you track progress and make sure everyone knows who is responsible
		for what.
	</Tip>

	{#if how.how.length === 0}
		<Button tip="Create a subtask for this process." action={() => createFirstSubtask(how)}
			>Create a subtask...</Button
		>
	{:else}
		<Flow
			><Button tip="Uncheck all steps" action={() => uncheckAll(true)}>Uncheck all</Button><Button
				tip="Check all steps"
				action={() => uncheckAll(false)}>Check all</Button
			></Flow
		>
		<div class="steps">
			{#each how.how.map( (h) => Organization.getHow(hows, h) ) as subHow, index (subHow?.id ?? index)}
				{#if subHow}<HowView how={subHow} {hows} {roles} {process} {editable} />{:else}<Note
						>This step is not visible to you.</Note
					>{/if}
			{/each}
		</div>
	{/if}

	<Header>Changes</Header>

	<ChangeLink change={null} process={process.id} />

	<Tip member
		>These are changes people have suggested that might affect this process that aren't yet done.</Tip
	>
	<Changes changes={changes.filter((change) => change.status !== 'done')} {profiles}
		><Paragraph>There are no active changes suggested for this process.</Paragraph></Changes
	>

	<Header>History</Header>

	<CommentsView
		comments={process.comments}
		{profiles}
		remove={isAdmin ? (comment) => db.deleteComment(process, 'processes', comment) : undefined}
	/>
{/if}
{#if isAdmin || accountable}
	<Header>Delete</Header>
	<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
	<Tip admin>Only admins and those role <Level level="accountable" verbose /> roles can delete.</Tip
	>
	<Button
		tip="Permantently delete this process and all of it's steps."
		action={async () => {
			try {
				const { error } = await db.deleteProcess(process.id);
				if (error) addError("Couldn't delete this", error);
				else await goto(`/org/${Organization.getPath(org)}/processes`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>{Delete} Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
{/if}

<style>
	.steps {
		width: 100%;
		margin-block-start: calc(2 * var(--padding));
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
</style>
