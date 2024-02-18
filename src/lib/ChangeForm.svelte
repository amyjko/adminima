<script lang="ts">
	import { goto } from '$app/navigation';
	import database from '../database/Database';
	import Button from './Button.svelte';
	import Field from './Field.svelte';
	import Form from './Form.svelte';
	import Oops from './Oops.svelte';
	import Paragraph from './Paragraph.svelte';
	import { type OrganizationID } from '../types/Organization';
	import { user } from '../database/Auth';
	import type { ProcessID } from '../types/Process';
	import type { RoleID } from '../types/Role';

	export let organization: OrganizationID;
	export let process: ProcessID | undefined = undefined;
	export let role: RoleID | undefined = undefined;

	let newRequestTitle = '';
	let newRequestProblem = '';
	let newRequestError: string | undefined = undefined;

	async function createRequest() {
		try {
			const request = await database.createChange(
				$user.id,
				organization,
				newRequestTitle,
				newRequestProblem,
				process ? [process] : [],
				role ? [role] : []
			);
			goto(`/organization/${organization}/request/${request.id}`);
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}
</script>

<Form action={createRequest}>
	<Paragraph
		>Is there something you'd like to change about this {#if role}
			role{:else if process}process{/if}? Give your request a title and describe the problem you'd
		like to address.</Paragraph
	>
	<Field label="title" bind:text={newRequestTitle} />
	<Field label="description" bind:text={newRequestProblem} />
	<Button
		submit
		active={newRequestTitle.length > 0 && newRequestProblem.length > 0}
		action={() => {}}>create</Button
	>

	{#if newRequestError}
		<Oops text={newRequestError} />
	{/if}
</Form>
