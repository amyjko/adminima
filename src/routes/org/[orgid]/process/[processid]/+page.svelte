<script lang="ts">
	import MarkupView from '$lib/MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import HowView from '$lib/HowView.svelte';
	import Oops from '$lib/Oops.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Title from '$lib/Title.svelte';
	import Level from '$lib/Level.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from '$lib/contexts';
	import CommentsView from '$lib/CommentsView.svelte';
	import Concern from '$lib/Concern.svelte';
	import { page } from '$app/stores';
	import Field from '$lib/Field.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import { setContext, tick } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import Select from '$lib/Select.svelte';
	import Changes from '$lib/Changes.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Tip from '$lib/Tip.svelte';
	import ChangeLink from '$lib/ChangeLink.svelte';
	import Visibility from '$lib/Visibility.svelte';
	import Note from '$lib/Note.svelte';
	import ARCI from '$lib/ARCI.svelte';
	import type { HowRow } from '$database/OrganizationsDB';
	import type { HowID } from '$types/Organization';
	import Flow from '$lib/Flow.svelte';
	import PathEditor from '$lib/PathEditor.svelte';
	import Status from '$lib/Status.svelte';
	import Period from '$lib/Period.svelte';
	import type { default as PeriodType } from '$database/Period';

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	const States = { draft: 'Draft', active: 'Active', archived: 'Archived' };

	$: process =
		$org.getProcess($page.params.processid) ?? $org.getProcessByShortName($page.params.processid);
	$: how = process && process.howid ? $org.getHow(process.howid) : undefined;

	// This mirrors the row-level security policy: only admins and people with an accountable or responsible role can edit this policy.
	$: personRoles = $user ? $org.getPersonRoles($user.id) : [];
	$: isAdmin = $user !== null && $org.hasAdminPerson($user.id);
	$: accountable =
		$user !== null &&
		process !== null &&
		(process.accountable === null || personRoles.includes(process.accountable));
	$: responsible =
		$user !== null &&
		process !== null &&
		(isAdmin ||
			accountable ||
			$org
				.getProcessHows(process.id)
				.some((how) => how.responsible.filter((r) => personRoles.includes(r)).length > 0));
	$: editable = process !== null && $user !== null && responsible;

	let newConcern = '';

	let newPeriod: string | undefined = undefined;

	const focusID = writable<string | undefined>(undefined);
	setContext<Writable<string | undefined>>('focusID', focusID);

	// When the org changes, and there's a focus ID to focus on, focus on it.
	$: if ($org && browser && $focusID) {
		tick().then(() => {
			const element = document.getElementById(`how-${$focusID}`);
			if (element) {
				element.focus();
				focusID.set(undefined);
			}
		});
	}

	async function createFirstSubtask(how: HowRow) {
		if (process === null) return;
		const { error, id } = await $db.insertHow(process, how.visibility, how, 0);
		if (error) addError(errors, 'Unable to insert how.', error);
		else if (id) focusID.set(id);
	}

	async function uncheckAll(uncheck: boolean) {
		function enumerate(how: HowRow, list: HowID[] = []) {
			list.push(how.id);
			for (const subhow of how.how
				.map((id) => $org.getHow(id))
				.filter((h): h is HowRow => h !== undefined)) {
				enumerate(subhow, list);
			}
			return list;
		}
		if (how === undefined) return;
		const hows = enumerate(how);
		await Promise.all(
			hows.map((h) => {
				const sub = $org.getHow(h);
				if (sub) $db.updateHowDone(sub, uncheck ? 'no' : 'yes');
			})
		);
	}

	async function addPeriod(kind: string | undefined) {
		// Reset the selection
		newPeriod = undefined;

		if (process === null) return;
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
			const error = await $db.addProcessPeriod(process, periodToAdd);
			if (error) addError(errors, 'Unable to add period.', error);
		}
	}
</script>

{#if $user === null && $org.getVisibility() !== 'public'}
	<Title title={$org.getName()} />
	<Oops text="This process is private. If you believe you have access, log in to view it." />
{:else if $user !== null && !$org.hasPerson($user.id) && $org.getVisibility() !== 'public'}
	<Title title={$org.getName()} />
	<Oops
		text="This process is only visible to people in the organization. If you want access, write the organization's administrators."
	/>
{:else if process === null}
	<Title title={$org.getName()} />
	<Oops text={(locale) => locale.error.noProcess} />
{:else if how === undefined}
	<Title title="Oops" kind="process" />
	<Oops text="This process isn't visible to you." />
{:else}
	<Title
		title={process.title}
		kind="process"
		edit={$user && editable
			? (text) =>
					queryOrError(
						errors,
						$db.updateProcessTitle(process, text, $user.id),
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
								? $db.updateHowVisibility(how, vis)
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
				<Select
					tip="Change the state of this process"
					selection={process.state}
					options={Object.entries(States).map(([key, value]) => ({ value: key, label: value }))}
					change={async (status) => {
						if ($user && (status === 'draft' || status === 'active' || status === 'archived'))
							return await queryOrError(
								errors,
								$db.updateProcessState(process, status, $user.id),
								"Couldn't update the process's state"
							);
						else return null;
					}}
				/>
			{:else}
				<Status status={process.state} />
			{/if}

			<Note>Concern</Note>
			{#if editable && $user && $org.getConcerns().length > 0}
				<Select
					tip="Change this process's concern"
					selection={process.concern}
					options={$org.getConcerns().map((c) => {
						return { value: c, label: c };
					})}
					change={(concern) =>
						queryOrError(
							errors,
							$db.updateProcessConcern(process, concern ?? '', $user.id),
							"Couldn't update process's concern"
						)}
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
					valid={() => newConcern.length > 0 && $org.getConcerns().indexOf(newConcern) === -1}
					action={async () => {
						const error = await queryOrError(
							errors,
							$db.updateProcessConcern(process, newConcern, $user.id),
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
					short={process.short}
					path={'...process/'}
					update={async (text) => {
						await queryOrError(
							errors,
							$db.updateProcessShortName(process, text),
							"Couldn't update process's short name"
						);
						goto(`/org/${$org.getPath()}/process/${text.length > 0 ? text : process.id}`, {
							replaceState: true
						});
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
		edit={editable ? (text) => $db.updateHowText(how, text) : undefined}
	/>

	<Header>Who</Header>

	<Paragraph>
		{#if editable}
			<Select
				tip="Choose a role to be accountable for the processes outcomes."
				fit
				options={[
					{ value: undefined, label: '—' },
					...$org
						.getRoles()
						.toSorted((a, b) => a.title.localeCompare(b.title))
						.map((role) => {
							return { value: role.id, label: role.title };
						})
				]}
				selection={process.accountable ?? undefined}
				change={(value) => $db.updateProcessAccountable(process, value ?? null)}
			/>{:else if process.accountable}<RoleLink roleID={process.accountable} />{:else}No one{/if} is
		<Level level="accountable" verbose /> for this processes outcomes{#if how.responsible.length === 0}
			&nbsp;(and <Level level="responsible" verbose /> for completing it, as no one else is responsible){/if}.
	</Paragraph>

	<ARCI {how} verbose {editable} />

	<Header>When</Header>

	{#if editable}
		<Tip
			>Setting one or more periods for when a process starts helps communicate when it should
			happen.</Tip
		>
		<Select
			tip="Add a frequency on which this process occurs"
			options={[
				{ value: undefined, label: 'Add a period …' },
				{ value: 'annually-date', label: 'Annually on a specific date (e.g., every March 1st)' },
				{
					value: 'annually-week',
					label: 'Annually on a specific week and weekday (e.g., every 13th week on Monday)'
				},
				{
					value: 'monthly-date',
					label: 'Monthly on a specific day (e.g., every 1st of the month)'
				},
				{
					value: 'monthly-weekday',
					label: 'Monthly on a specific weekday (e.g., 2nd Monday of each month'
				},
				{
					value: 'weekly',
					label:
						'Every week or number of weeks on a specific weekday (e.g., every 2 weeks on Monday)'
				}
			]}
			bind:selection={newPeriod}
			change={addPeriod}
		/>
	{/if}
	{#if process.repeat && process.repeat.length > 0}
		{#each process.repeat as period, index}
			<Period
				{period}
				edit={editable
					? async (period) => {
							const error = await $db.updateProcessPeriod(process, period, index);
							if (error) addError(errors, "Couldn't update period.", error);
					  }
					: undefined}
				remove={editable
					? async () => {
							const error = await $db.removeProcessPeriod(process, index);
							if (error) addError(errors, "Coudln't remove period");
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
			{#each how.how.map((h) => $org.getHow(h)) as subHow, index (subHow?.id ?? index)}
				{#if subHow}<HowView how={subHow} {process} {editable} />{:else}<Note
						>This step is not visible to you.</Note
					>{/if}
			{/each}
		</div>
	{/if}

	<Header>Changes</Header>

	<ChangeLink id={null} process={process.id} />

	<Tip member>These are changes people have suggested that might affect this process.</Tip>
	<Changes
		changes={$org
			.getChanges()
			.filter((change) => change.status === 'active' && change.processes.includes(process.id))}
		><Paragraph>There are no active changes suggested for this process.</Paragraph></Changes
	>

	<Header>History</Header>

	<CommentsView
		comments={process.comments}
		remove={isAdmin ? (comment) => $db.deleteComment(process, 'processes', comment) : undefined}
	/>

	{#if isAdmin || accountable}
		<Header>Delete</Header>
		<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
		<Tip admin
			>Only admins and those role <Level level="accountable" verbose /> roles can delete.</Tip
		>
		<Button
			tip="Permantently delete this process and all of it's steps."
			action={async () => {
				try {
					const { error } = await $db.deleteProcess(process.id);
					if (error) addError(errors, "Couldn't delete this", error);
					else goto(`/org/${$org.getPath()}/processes`);
				} catch (_) {
					deleteError = "We couldn't delete this";
				}
			}}
			warning>{Delete} Delete this process</Button
		>
		{#if deleteError}<Oops text={deleteError} />{/if}
	{/if}
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
