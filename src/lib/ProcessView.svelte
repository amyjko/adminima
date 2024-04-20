<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import TaskView from './TaskView.svelte';
	import Database from '../database/Database';
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
	import type Process from '../types/Process';

	export let process: Process;

	let deleteError: string | undefined = undefined;
</script>

<Title title={process.title} kind={$locale?.term.process ?? ''} />

<MarkupView markup={process.what} />

<Header>Who</Header>

<ul>
	<li>
		<RoleContribution roles={[process.accountable]}
			><strong>accountable</strong>{#if process.responsible.length === 0}and <strong
					>responsible</strong
				>{/if} for this task's outcome.</RoleContribution
		>
	</li>
	{#if process.responsible.length > 0}
		<li>
			<RoleContribution roles={process.responsible}
				><strong>responsible</strong> for completing this task.</RoleContribution
			>
		</li>
	{/if}
	{#if process.consulted.length > 0}
		<li>
			<RoleContribution roles={process.consulted}
				><strong>consulted</strong> to ensure this task is done well.</RoleContribution
			>
		</li>
	{/if}
	{#if process.informed.length > 0}
		<li>
			<RoleContribution roles={process.informed}
				><strong>informed</strong> that this is happening and when it is complete.</RoleContribution
			>
		</li>
	{/if}
</ul>

<Header>When</Header>

{#if process.repeat}
	{#if process.repeat.type === 'monthly'}
		This happens on the {process.repeat.date}st day of each month.
	{:else if process.repeat.type === 'weekly'}
		This happens every {process.repeat.weekday} of each week.
	{:else if process.repeat.type === 'annually'}
		This happens on day {process.repeat.day} of month {process.repeat.month} each year.
	{/if}
{:else}
	This process doesn't happen at a particular time.
{/if}

<Header>How</Header>

{#if process.how.length === 0}
	<p>This process doesn't have any tasks listed yet.</p>
{:else}
	<ul>
		{#each process.how as how}
			<li><TaskView task={how} /></li>
		{/each}
	</ul>
{/if}

<ChangeForm process={process.id} />

<Admin>
	<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = process.organization;
				await Database.deleteProcess(process.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<Modifications mods={process.revisions} />
