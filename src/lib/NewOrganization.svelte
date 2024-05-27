<script lang="ts">
	import { goto } from '$app/navigation';
	import Organizations from '$database/Organizations';
	import Actions from './Actions.svelte';
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Field from './Field.svelte';
	import Form from './Form.svelte';
	import Header from './Header.svelte';
	import Oops from './Oops.svelte';
	import Paragraph from './Paragraph.svelte';
	import { getUser } from './contexts';
	import type { PostgrestError } from '@supabase/supabase-js';

	export let close: () => void;

	const user = getUser();
	let message: string | null = null;
	let submitting = false;

	function showError(error: PostgrestError) {
		message = error.message;
		submitting = false;
	}

	async function create() {
		if ($user === null) return;
		submitting = false;

		const { error, id } = await Organizations.createOrganization(orgName, $user.id, name);

		if (error) showError(error);
		else goto(`/organization/${id}`);
	}

	let name = '';
	let orgName = '';
</script>

<Dialog {close}>
	<Header>Create organization</Header>
	<Paragraph>We need a few things things:</Paragraph>
	<Form action={create}>
		<Field active={!submitting} label="your name" bind:text={name} />
		<Field active={!submitting} label="organization name" bind:text={orgName} />

		<Paragraph>We'll create an organization with you as admin.</Paragraph>
		<Actions>
			<Button active={!submitting} action={close}>Cancel</Button><Button
				active={!submitting && name.length > 0 && orgName.length > 0}
				action={create}
				submit>Submit</Button
			>
		</Actions>
	</Form>

	{#if message}<Oops text={message} />{/if}
</Dialog>
