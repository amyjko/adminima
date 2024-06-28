<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Button from '$lib/Button.svelte';
	import Field from '$lib/Field.svelte';
	import Form from '$lib/Form.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getUser } from '$lib/contexts';
	import validEmail from '../validEmail';

	export let data;

	$: ({ supabase } = data);

	let email = '';
	let code = '';
	let message: string | null = null;
	/** True if waiting for a code */
	let submitted = false;
	let submitting = false;

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
		const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });

		if (error) message = error.code ?? error.message;
		else {
			submitted = false;
			message = null;
		}
		submitting = false;
	}

	$: if (browser && $user) goto(`/person/${$user.id}`);
</script>

<Title title="Login" />

{#if $user}
	<Paragraph>You're logged in as {$user.email}.</Paragraph>
{:else if !submitted}
	<p>We'll email you a one-time code each time you log in.</p>
	<Form>
		<Field
			label="email"
			bind:text={email}
			invalid={(text) =>
				text.length === 0 || validEmail(email) ? undefined : 'Not yet a valid email'}
		/>
		<Button
			tip="Email the login code"
			active={!submitting && validEmail(email)}
			action={sendCode}
			submit>Send code …</Button
		>
	</Form>
{:else}
	<Paragraph>We emailed you a code. It might take a minute to arrive.</Paragraph>
	<Form>
		<Field
			label="code"
			bind:text={code}
			placeholder="012345"
			invalid={(text) =>
				text.length === 0 || text.length === 6 ? undefined : 'Codes are 6 characters'}
		/>
		<Button tip="Send login code" active={!submitting && code.length === 6} action={login} submit
			>Login …</Button
		>
	</Form>
{/if}

{#if message}
	<Oops text={message} />
{/if}
