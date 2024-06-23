<script lang="ts">
	import { goto } from '$app/navigation';
	import Form from './Form.svelte';
	import Oops from './Oops.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
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
	const db = getDB();
	const errors = getErrors();

	async function createSuggestion() {
		if ($user === null) return;
		try {
			const { data: suggestion, error } = await $db.createSuggestion(
				$user.id,
				$organization.getID(),
				newRequestTitle,
				newRequestProblem,
				$organization.getVisibility(),
				process ? [process] : [],
				role ? [role] : []
			);
			if (error) addError(errors, "Couldn't create the suggestion.", error);
			else if (suggestion) goto(`/org/${$organization.getID()}/suggestion/${suggestion.id}`);
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}
</script>

<Form action={createSuggestion}>
	<MarkupView
		markup={$organization.getPrompt()}
		placeholder="What is your suggestion?"
		edit={$user
			? (text) =>
					queryOrError(
						errors,
						$db.updateOrgPrompt($organization, text, $user.id),
						"Couldn't update prompt"
					)
			: undefined}
	/>
	<Field label="Title" bind:text={newRequestTitle} />
	<Labeled
		label="Describe the problem you're experiencing and any ideas you have for addressing it."
	>
		<MarkupView bind:markup={newRequestProblem} editing placeholder="Detail your suggestion" />
	</Labeled>
	<Labeled label="Affected Roles">
		<Select
			tip="Add a role that is affected by this suggestion."
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
			tip="Add a process that is affected by this suggestion."
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
		tip="Submit the new suggestion."
		submit
		end
		active={newRequestTitle.length > 0 && newRequestProblem.length > 0}
		action={() => {}}>create</Button
	>

	{#if newRequestError}
		<Oops text={newRequestError} />
	{/if}
</Form>
