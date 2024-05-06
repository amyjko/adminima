<script lang="ts">
	import { goto } from '$app/navigation';
	import Actions from './Actions.svelte';
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Field from './Field.svelte';
	import Header from './Header.svelte';
	import Oops from './Oops.svelte';
	import Paragraph from './Paragraph.svelte';
	import { getUser } from './contexts';
	import { supabase } from './supabaseClient';
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

		// Insert the new organization
		const { data, error } = await supabase
			.from('orgs')
			.insert({
				name: orgName,
				description: ''
			})
			.select();
		if (error) showError(error);
		else {
			const orgid = data[0].id;
			// Insert the new user profile
			const { error } = await supabase.from('profiles').insert({
				orgid,
				personid: $user.id,
				name,
				bio: '',
				admin: true
			});
			if (error) showError(error);

			goto(`/organization/${orgid}`);
		}
	}

	let name = '';
	let orgName = '';
</script>

<Dialog {close}>
	<Header>Create organization</Header>
	<Paragraph>We need a few things things:</Paragraph>
	<Field active={!submitting} label="your name" bind:text={name} />
	<Field active={!submitting} label="organization name" bind:text={orgName} />

	<Paragraph>We'll create an organization with you as admin.</Paragraph>
	<Actions>
		<Button active={!submitting} action={close}>Cancel</Button><Button
			active={!submitting && name.length > 0 && orgName.length > 0}
			action={create}>Submit</Button
		>
	</Actions>

	{#if message}<Oops text={message} />{/if}
</Dialog>
