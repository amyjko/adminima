<script lang="ts">
	import { goto } from '$app/navigation';
	import Organizations from '../database/Organizations';
	import Form from './Form.svelte';
	import Oops from './Oops.svelte';
	import Paragraph from './Paragraph.svelte';
	import Header from './Header.svelte';
	import { getOrg, getUser } from './contexts';
	import type { ProcessID, RoleID } from '$types/Organization';

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
			if (change) goto(`/organization/${organization}/request/${change.id}`);
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}
</script>

<Header>Suggest a Change</Header>
<Form action={createRequest}>
	<Paragraph
		>Is there something you'd like to change about this {#if role}
			role{:else if process}process{/if}? Give your request a title and describe the problem you'd
		like to address.</Paragraph
	>
	<Oops text="Suggestions are not available yet." />
	<!-- <Field label="Title" bind:text={newRequestTitle} />
	<Field
		label="Describe the problem you're experiencing and any ideas you have for addressing it."
		bind:text={newRequestProblem}
	/>
	<Button
		submit
		end
		active={newRequestTitle.length > 0 && newRequestProblem.length > 0}
		action={() => {}}>create</Button
	> -->

	{#if newRequestError}
		<Oops text={newRequestError} />
	{/if}
</Form>
