<script lang="ts">
	import MarkupView from '$lib/MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import HowView from '$lib/HowView.svelte';
	import Oops from '$lib/Oops.svelte';
	import Button from '$lib/Button.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Title from '$lib/Title.svelte';
	import Level from '$lib/Level.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from '$lib/contexts';
	import CommentsView from '$lib/CommentsView.svelte';
	import Concern from '$lib/Concern.svelte';
	import { page } from '$app/stores';
	import Notice from '$lib/Notice.svelte';
	import Field from '$lib/Field.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import { setContext, tick } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import Select from '$lib/Select.svelte';
	import Suggestions from '$lib/Suggestions.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Tip from '$lib/Tip.svelte';
	import SuggestionLink from '$lib/SuggestionLink.svelte';
	import Visibility from '$lib/Visibility.svelte';
	import Note from '$lib/Note.svelte';

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: process = $org.getProcess($page.params.processid);
	$: how = process && process.howid ? $org.getHow(process.howid) : undefined;

	// This mirrors the row-level security policy: only admins and people with an accountable or responsible role can edit this policy.
	$: personRoles = $user ? $org.getPersonRoles($user.id) : [];
	$: admin = $user !== null && $org.hasAdminPerson($user.id);
	$: accountable =
		$user !== null &&
		process !== null &&
		(process.accountable === null || personRoles.includes(process.accountable));
	$: responsible =
		$user !== null &&
		process !== null &&
		(admin ||
			accountable ||
			$org
				.getProcessHows(process.id)
				.some((how) => how.responsible.filter((r) => personRoles.includes(r)).length > 0));
	$: editable = process !== null && $user !== null && responsible;

	let newConcern = '';

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
	/>

	<Tip
		>Admins and anyone <Level level="accountable" />ccountable or <Level
			level="responsible"
		/>esponsible can edit a process. If no one is accountable, anyone in the organization can edit.</Tip
	>

	<MarkupView
		markup={how.what}
		placeholder="No description yet."
		edit={editable ? (text) => $db.updateHowText(how, text) : undefined}
	/>

	<Header>Visibility</Header>

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

	<Header>Who</Header>

	<Paragraph>
		{#if editable}
			<Select
				tip="Choose a role to be accountable for the processes outcomes."
				options={[
					{ value: undefined, label: '—' },
					...$org.getRoles().map((role) => {
						return { value: role.id, label: role.title };
					})
				]}
				selection={process.accountable ?? undefined}
				change={(value) => $db.updateProcessAccountable(process, value ?? null)}
			/>{:else if process.accountable}<RoleLink roleID={process.accountable} />{:else}No one{/if} is
		<Level level="accountable" /><strong>ccountable</strong> for this processes outcomes.
	</Paragraph>

	<Header>When</Header>

	{#if process.repeat}
		Haven't built repeation renderer yet.
		<!-- {#if process.repeat.type === 'monthly'}
			This happens on the {process.repeat.date}st day of each month.
		{:else if process.repeat.type === 'weekly'}
			This happens every {process.repeat.weekday} of each week.
		{:else if process.repeat.type === 'annually'}
			This happens on day {process.repeat.day} of month {process.repeat.month} each year.
		{/if} -->
	{:else}
		This process doesn't happen at a particular time.
	{/if}

	<Header>How</Header>

	<Tip
		>This is how to do this process, who is <Level level="responsible" />esponsible for doing it,
		and who is <Level level="consulted" />onsulted and <Level level="informed" />nformed about it.
	</Tip>

	{#if how === undefined}
		<Notice>No one has defined to do this process yet.</Notice>
	{:else}
		<ol style:width="100%">
			{#each how.how.map((h) => $org.getHow(h)) as subHow, index (subHow?.id ?? index)}
				<li>
					{#if subHow}<HowView how={subHow} {process} {editable} />{:else}<Note
							>This step is not visible to you. {how.how[index]}</Note
						>{/if}
				</li>
			{/each}
		</ol>
	{/if}

	<Header>Concern</Header>

	<Paragraph>Choose an area of concern to help group processes.</Paragraph>

	<div class="row">
		<Concern concern={process.concern} />
		{#if editable && $user}
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
			/>{/if}
	</div>
	{#if editable && $user}
		<FormDialog
			submit="New concern"
			showTip="Create a new concern."
			submitTip="Create and select this new concern."
			button="Set concern..."
			header="Set a new concern"
			explanation="Set a new concern to group processes."
			valid={() => newConcern.length > 0 && $org.getConcerns().indexOf(newConcern) === -1}
			error={undefined}
			action={() => {
				queryOrError(
					errors,
					$db.updateProcessConcern(process, newConcern, $user.id),
					"Couldn't update concern."
				);
				newConcern = '';
			}}
		>
			<Field label="new concern" bind:text={newConcern} />
		</FormDialog>
	{/if}

	<Header>Suggestions</Header>

	<SuggestionLink id={null} process={process.id} />

	<Tip>These are suggestions people have made that might affect this process.</Tip>
	<Suggestions
		suggestions={$org
			.getSuggestions()
			.filter((change) => change.status === 'active' && change.processes.includes(process.id))}
		><Paragraph>There are no active changes suggested for this process.</Paragraph></Suggestions
	>

	{#if admin || accountable}
		<Header>Delete</Header>
		<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
		<Tip>Only admins and those role <Level level="accountable" />ccountable roles can delete.</Tip>
		<Button
			tip="Permantently delete this process and all of it's steps."
			action={async () => {
				try {
					const org = process.orgid;
					const { error } = await $db.deleteProcess(process.id);
					if (error) addError(errors, "Couldn't delete this", error);
					else goto(`/organization/${org}/processes`);
				} catch (_) {
					deleteError = "We couldn't delete this";
				}
			}}
			warning>Delete this process</Button
		>
		{#if deleteError}<Oops text={deleteError} />{/if}
	{/if}

	<Header>History</Header>

	<CommentsView
		comments={process.comments}
		remove={(comment) => $db.deleteComment(process, 'processes', comment)}
	/>
{/if}

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing);
	}
</style>
