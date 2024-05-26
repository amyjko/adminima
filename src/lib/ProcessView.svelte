<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import TaskView from './TaskView.svelte';
	import Organizations, { type ProcessRow } from '../database/Organizations';
	import Oops from './Oops.svelte';
	import ChangeForm from './ChangeForm.svelte';
	import Button from './Button.svelte';
	import Paragraph from './Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Modifications from './Revisions.svelte';
	import RoleContribution from './RoleContribution.svelte';
	import Level from './Level.svelte';
	import { getOrg } from './contexts';

	export let process: ProcessRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	$: how = $org.getHow(process.id);
</script>

<Title
	title={process.what}
	kind={$locale?.term.process ?? ''}
	status={process.status}
	visibility={how?.visibility ?? null}
/>

<MarkupView markup={process.what} unset="No description yet." />

<Paragraph><em>Area of concern</em>: <strong>{process.concern}</strong></Paragraph>

<Header>Who</Header>

{#if how}
	<Paragraph>
		<Level level="accountable" /><strong>ccountable</strong>{#if how?.responsible.length === 0}and <strong
				>responsible</strong
			>{/if} for this task's outcomes:
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
{/if}

<Header>When</Header>

<!-- {#if process.repeat}
	{#if process.repeat.type === 'monthly'}
		This happens on the {process.repeat.date}st day of each month.
	{:else if process.repeat.type === 'weekly'}
		This happens every {process.repeat.weekday} of each week.
	{:else if process.repeat.type === 'annually'}
		This happens on day {process.repeat.day} of month {process.repeat.month} each year.
	{/if}
{:else}
	This process doesn't happen at a particular time.
{/if} -->

<Header>How</Header>

{#if how === undefined}
	<p>This process doesn't have any tasks listed yet.</p>
{:else}
	<TaskView {how} />
{/if}

<ChangeForm process={process.id} />

<Admin>
	<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = process.orgid;
				await Organizations.deleteProcess(process.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<Modifications mods={process.comments} />
