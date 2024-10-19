<script lang="ts">
	import Page from '$lib/Page.svelte';
	import { locale } from '$types/Locales';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		DBSymbol,
		ErrorsSymbol,
		UserSymbol,
		type ErrorsContext,
		type UserContext
	} from '$lib/contexts.svelte';
	import Organizations from '$database/OrganizationsDB.js';
	import Error from '$lib/Error.svelte';
	import { goto, invalidate } from '$app/navigation';
	import Note from '$lib/Note.svelte';
	import Link from '$lib/Link.svelte';
	import type { User } from '@supabase/supabase-js';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let db = $state(new Organizations(data.supabase));
	setContext(DBSymbol, db);
	$effect(() => {
		db.setSupabaseClient(data.supabase);
	});

	function getUserMetadata(user: User | null) {
		return user ? { id: user.id, email: user.email } : null;
	}

	// Start with the user, unless we're on the browser, in which case we get a fresh token.
	// Keep the store up to date if the user changes.
	const user: UserContext = writable(data.session ? getUserMetadata(data.session.user) : null);
	setContext(UserSymbol, user);
	$effect(() => {
		user.set(data.session ? getUserMetadata(data.session.user) : null);
	});

	const errors: ErrorsContext = writable([]);
	setContext(ErrorsSymbol, errors);

	let { strings, supabase, session } = $derived(data);
	$effect(() => {
		locale.set(strings);
	});

	onMount(() => {
		const subscription = supabase.auth.onAuthStateChange((newUser, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			} else if (newUser === 'SIGNED_OUT') {
				user.set(null);
				goto('/login');
			} else if (newSession) {
				// Update the user.
				user.set(getUserMetadata(newSession.user));
			}
		});

		// call unsubscribe to remove the callback
		return () => {
			subscription.data.subscription.unsubscribe();
		};
	});
</script>

<div class="errors">
	{#each $errors as error}
		<Error {error} />
	{/each}
</div>
<Page>
	{@render children?.()}

	<hr />

	<div style="display: flex; flex-direction:row; justify-content: center; width: 100%">
		<Note><Link to="https://amyjko.phd">Amy</Link> built this.</Note>
	</div>
</Page>
