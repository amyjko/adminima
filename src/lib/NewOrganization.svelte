<script lang="ts">
	import { goto } from '$app/navigation';
	import Organizations from '$database/Organizations';
	import Field from './Field.svelte';
	import FormDialog from './FormDialog.svelte';
	import { getUser } from './contexts';
	import type { PostgrestError } from '@supabase/supabase-js';

	const user = getUser();
	let message: string | undefined = undefined;
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

<FormDialog
	button="Create organization …"
	header="New organization"
	explanation="We need a few things"
	submit="Create"
	action={create}
	valid={() => name.length > 0 && orgName.length > 0}
	error={message}
>
	<Field active={!submitting} label="your name" bind:text={name} />
	<Field active={!submitting} label="organization name" bind:text={orgName} />
</FormDialog>
