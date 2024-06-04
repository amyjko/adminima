<script lang="ts">
	import MarkupView from '$lib/MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import HowView from '$lib/HowView.svelte';
	import Organizations from '$database/Organizations';
	import Oops from '$lib/Oops.svelte';
	import ChangeForm from '$lib/ChangeForm.svelte';
	import Button from '$lib/Button.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Admin from '$lib/Admin.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import RoleContribution from '$lib/RoleContribution.svelte';
	import Level from '$lib/Level.svelte';
	import { getOrg, getUser } from '$lib/contexts';
	import CommentsView from '$lib/CommentsView.svelte';
	import { page } from '$app/stores';
	import Notice from '$lib/Notice.svelte';
	import Choice from '$lib/Choice.svelte';
	import Field from '$lib/Field.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import { setContext, tick } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { browser } from '$app/environment';

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	const user = getUser();
	$: process = $org.getProcess($page.params.processid);
	$: how = process && process.howid ? $org.getHow(process.howid) : undefined;

	$: editable = true;

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

{#if process === null}
	<Oops text={(locale) => locale.error.noProcess} />
{:else}
	<Title
		title={process.title}
		kind={$locale?.term.process ?? ''}
		edit={$user ? (text) => Organizations.updateProcessTitle(process, text, $user.id) : undefined}
	/>

	{#if how}
		<MarkupView
			text={how.what}
			unset="No description yet."
			edit={$user ? (text) => Organizations.updateHowText(how, text) : undefined}
		/>
	{/if}

	<Header>Who</Header>

	{#if how}
		<Paragraph>
			<Level level="accountable" /><strong>ccountable</strong>
			{#if how?.responsible.length === 0}
				and <strong>responsible</strong>{/if} for this task's outcomes:
			<RoleContribution roles={how.accountable ? [how.accountable] : []} />
		</Paragraph>
		{#if how.responsible.length > 0}
			<Paragraph>
				<Level level="responsible" /><strong>esponsible</strong> for completing this process: <RoleContribution
					roles={how.responsible}
				/>
			</Paragraph>
		{/if}
		{#if how.consulted.length > 0}
			<Paragraph>
				<Level level="consulted" /><strong>onsulted</strong> in this process: <RoleContribution
					roles={how.consulted}
				/>
			</Paragraph>
		{/if}
		{#if how.informed.length > 0}
			<Paragraph>
				<Level level="informed" /><strong>nformed</strong> that this process is happening and of its
				outcome: <RoleContribution roles={how.informed} />
			</Paragraph>
		{/if}
	{:else}
		<Notice>No one is involved in this process yet. Define how to do it.</Notice>
	{/if}

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

	{#if how === undefined}
		<Notice>No one is defined to do this process yet.</Notice>
	{:else}
		<ol>
			{#each how.how.map((h) => $org.getHow(h)) as subHow, index (subHow?.id ?? index)}
				{#if subHow}
					<li><HowView how={subHow} {process} /></li>
				{/if}
			{/each}
		</ol>
	{/if}

	<Header>Concern</Header>

	<Paragraph>Choose an area of concern to help group processes.</Paragraph>

	{#if editable && $user}
		{#if process.concern === ''}<em>no concern</em>{:else}
			<Choice
				edit={(text) => Organizations.updateProcessConcern(process, text, $user.id)}
				choice={process.concern}
				choices={Object.fromEntries($org.getConcerns().map((c) => [c, c]))}
				>{process.concern}</Choice
			>
		{/if}
		<FormDialog
			submit="Set concern"
			button="Set concern..."
			header="Set a new concern"
			explanation="Set a new concern to group processes."
			valid={() => newConcern.length > 0 && $org.getConcerns().indexOf(newConcern) === -1}
			error={undefined}
			action={() => {
				Organizations.updateProcessConcern(process, newConcern, $user.id);
				newConcern = '';
			}}
		>
			<Field label="new concern" bind:text={newConcern} />
		</FormDialog>
	{/if}

	<ChangeForm process={process.id} />

	<Admin>
		<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
		<Button
			action={async () => {
				try {
					const org = process.orgid;
					await Organizations.deleteProcess(process.id);
					goto(`/organization/${org}/processes`);
				} catch (_) {
					deleteError = "We couldn't delete this";
				}
			}}
			warning>Delete this process</Button
		>
		{#if deleteError}<Oops text={deleteError} />{/if}
	</Admin>

	<CommentsView comments={process.comments} />
{/if}
