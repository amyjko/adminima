<script lang="ts">
	import type Process from '../types/Process';
	import Rows from './Rows.svelte';
	import Row from './Row.svelte';
	import PersonLink from './PersonLink.svelte';
	import MarkupView from './MarkupView.svelte';
	import Header from '$lib/Header.svelte';
	import TaskView from './TaskView.svelte';
	import Notice from './Notice.svelte';
	import { format } from 'date-fns';
	import { toDate } from '../types/Day';
	import database from '../database/Database';
	import Oops from './Oops.svelte';
	import ChangeForm from './ChangeForm.svelte';
	import Button from './Button.svelte';
	import Paragraph from './Paragraph.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Modifications from './Modifications.svelte';
	import RoleLink from './RoleLink.svelte';
	import Checkbox from './Checkbox.svelte';

	export let process: Process;

	let deleteError: string | undefined = undefined;
</script>

<Title title={process.what} kind={$locale?.term.process ?? ''} />

<MarkupView markup={process.why} />

<Header>Who</Header>

<Paragraph
	>The <RoleLink roleID={process.roles[0]} /> leads this process with support from {#each process.roles.slice(1) as role}
		<RoleLink roleID={role} />{/each}.
</Paragraph>

<Header>When</Header>

{#if process.template && process.start}
	This process started on {format(toDate(process.start), 'MM/dd/yyyy')}
{:else if process.repeat}
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

{#if process.template}
	<Notice>This is a template. Start this process to track your progress.</Notice>
{/if}

<ul>
	{#each process.how as how}
		<li><TaskView task={how} /></li>
	{/each}
</ul>

<ChangeForm organization={process.organization} process={process.id} />

<Admin>
	<Paragraph>Is this process obsolete? You can permanently delete it.</Paragraph>
	<Button
		action={async () => {
			try {
				const org = process.organization;
				await database.deleteProcess(process.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this process</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>

<Modifications mods={process.modifications} />
