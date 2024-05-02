<script lang="ts">
	import Button from '$lib/Button.svelte';
	import Field from '$lib/Field.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getUser } from '$lib/contexts';
	import { supabase } from '$lib/supabaseClient';
	import type { User } from '@supabase/supabase-js';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	let email = '';
	let code = '';
	let message: string | null = null;
	/** True if waiting for a code */
	let submitted = false;

	let user = getUser();

	async function sendCode() {
		console.log('Email is ' + email);
		const { error } = await supabase.auth.signInWithOtp({
			email
		});
		if (error) {
			message = error.message;
		} else {
			submitted = true;
		}
	}

	async function login() {
		const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });

		if (error) message = error.message;
	}

	async function logout() {
		const { error } = await supabase.auth.signOut();
		if (error) message = error.message;
	}

	function validEmail(text: string) {
		return /.+@.+\..+/.test(text);
	}
</script>

<Title title="Login" visibility={null} />

{#if $user}
	<Paragraph>You're logged in as {$user.email}.</Paragraph>

	<Button action={logout}>Log out</Button>
{:else if !submitted}
	<p>We'll email you a one-time code each time you log in.</p>
	<Field
		label="email"
		bind:text={email}
		invalid={(text) => (text.length === 0 || validEmail(email) ? undefined : 'Not a valid email')}
	/>
	<Button active={validEmail(email)} action={sendCode} submit>Send code</Button>
{:else}
	<Paragraph>We emailed you a code. It might take a minute to arrive.</Paragraph>
	<Field label="code" bind:text={code} placeholder="012345" />
	<Button action={login} submit>Login</Button>
{/if}

{#if message}
	<Oops text={message} />
{/if}
