<script module lang="ts">
	export const UserSymbol = Symbol('user');
	export type UserContext = Writable<{ id: string; email: string | undefined } | null>;

	export function getUser(): UserContext {
		return getContext<UserContext>(UserSymbol);
	}
	export function setUser(context: UserContext | null) {
		setContext(UserSymbol, context);
	}

	export const DBSymbol = Symbol('db');

	export function getDB(): Organization {
		return getContext<Organization>(DBSymbol);
	}
</script>

<script lang="ts">
	import Page from '$lib/Page.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import Organization from '$database/Organization';
	import Error from '$lib/Error.svelte';
	import { goto, invalidate } from '$app/navigation';
	import Note from '$lib/Note.svelte';
	import Link from '$lib/Link.svelte';
	import type { User } from '@supabase/supabase-js';
	import type { LayoutData } from './$types';

	import { type Snippet } from 'svelte';
	import { errors } from './errors.svelte';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	let db = $state(new Organization(data.supabase));
	setContext(DBSymbol, db);

	// Update client when data updates.
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

	let { supabase, session } = $derived(data);

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
	{#each errors as error}
		<Error {error} />
	{/each}
</div>
<Page>
	{@render children?.()}

	<hr />

	<div style="display: flex; flex-direction:row; justify-content: center; width: 100%">
		<Note
			><Link to="https://amyjko.phd">Amy</Link> built this. Submit <Link
				to="https://github.com/amyjko/adminima/issues/new/choose">Feedback</Link
			>?
		</Note>
	</div>
</Page>
