<script lang="ts">
	import { goto } from '$app/navigation';
	import Organizations from '../database/Organizations';
	import Form from './Form.svelte';
	import Oops from './Oops.svelte';
	import Paragraph from './Paragraph.svelte';
	import { getOrg, getUser } from './contexts';
	import type { ProcessID, RoleID } from '$types/Organization';
	import Field from './Field.svelte';
	import Button from './Button.svelte';
	import Select from './Select.svelte';
	import Labeled from './Labeled.svelte';
	import MarkupView from './MarkupView.svelte';

	export let process: ProcessID | undefined = undefined;
	export let role: RoleID | undefined = undefined;

	let newRequestTitle = '';
	let newRequestProblem = '';
	let newRequestError: string | undefined = undefined;

	const organization = getOrg();
	const user = getUser();

	async function createRequest() {
		if ($user === null) return;
		try {
			const change = await Organizations.createChange(
				$user.id,
				$organization.getID(),
				newRequestTitle,
				newRequestProblem,
				process ? [process] : [],
				role ? [role] : []
			);
			if (change) goto(`/organization/${$organization.getID()}/change/${change.id}`);
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}
</script>

<Form action={createRequest}>
	<Paragraph
		>What should change about this {role
			? 'role'
			: process
			? 'process'
			: 'organization'}?</Paragraph
	>
	<Field label="Title" bind:text={newRequestTitle} />
	<Labeled
		label="Describe the problem you're experiencing and any ideas you have for addressing it."
	>
		<MarkupView bind:text={newRequestProblem} editing unset="Detail your suggestion" />
	</Labeled>
	<Labeled label="Affected Roles">
		<Select
			options={[
				{ value: undefined, label: '—' },
				...$organization.getRoles().map((role) => {
					return { value: role.id, label: role.title };
				})
			]}
			selection={role}
			change={(r) => (role = r)}
		/>
	</Labeled>
	<Labeled label="Affected Processes">
		<Select
			options={[
				{ value: undefined, label: '—' },
				...$organization.getProcesses().map((process) => {
					return { value: process.id, label: process.title };
				})
			]}
			selection={process}
			change={(p) => (process = p)}
		/>
	</Labeled>
	<Button
		submit
		end
		active={newRequestTitle.length > 0 && newRequestProblem.length > 0}
		action={() => {}}>create</Button
	>

	{#if newRequestError}
		<Oops text={newRequestError} />
	{/if}
</Form>
