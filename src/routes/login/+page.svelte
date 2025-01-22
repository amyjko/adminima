<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/Button.svelte';
	import Field from '$lib/Field.svelte';
	import Form from '$lib/Form.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import validEmail from '../validEmail';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let { supabase } = $derived(data);

	let email = $state('');
	let code = $state('');
	let message: string | null = $state(null);
	/** True if waiting for a code */
	let submitted = $state(false);
	let submitting = $state(false);

	let user = getUser();

	async function sendCode() {
		submitting = true;
		const { error } = await supabase.auth.signInWithOtp({
			email
		});
		if (error) message = error.code ?? error.message;
		else submitted = true;
		submitting = false;
	}

	async function login() {
		submitting = true;
		const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });

		if (error) message = error.code ?? error.message;
		else {
			submitted = false;
			message = null;
			if (data.user?.id) goto(`/person/${data.user.id}`);
		}
		submitting = false;
	}

	// Already signed in? Go to the profile.
	// $: if (browser && $user) goto(`/person/${$user.id}`);

	let emailActive = $derived(!submitting && validEmail(email));

	let codeActive = $derived(!submitting && code.length === 6);
</script>

<Title title="Login" />

{#if $user}
	<Paragraph>You're logged in as {$user.email}.</Paragraph>
{:else if !submitted}
	<Paragraph>We'll email you a one-time code each time you log in.</Paragraph>
	<Form
		active={emailActive}
		inactiveMessage={submitting ? undefined : 'Make sure your email is valid.'}
	>
		<Field
			label="email"
			bind:text={email}
			active={!submitting}
			invalid={(text) =>
				text.length === 0 || validEmail(email) ? undefined : 'Not yet a valid email'}
		/>
		<Button tip="Email the login code" active={emailActive} action={sendCode} submit
			>Send code …</Button
		>
	</Form>
{:else}
	<Paragraph>We emailed you a code. It might take a minute to arrive.</Paragraph>
	<Form
		active={codeActive}
		inactiveMessage={submitting ? undefined : 'Make sure your code is 6 digits.'}
	>
		<Field
			label="code"
			bind:text={code}
			active={!submitting}
			placeholder="012345"
			invalid={(text) =>
				text.length === 0 || text.length === 6 ? undefined : 'Codes are 6 characters'}
		/>
		<Button tip="Send login code" active={codeActive} action={login} submit>Login …</Button>
	</Form>
{/if}

{#if message}
	<Oops text={message} />
{/if}
