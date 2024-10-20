<script module lang="ts">
	import type { PostgrestError } from '@supabase/postgrest-js';

	export const UserSymbol = Symbol('user');
	export type UserContext = Writable<{ id: string; email: string | undefined } | null>;

	export function getUser(): UserContext {
		return getContext<UserContext>(UserSymbol);
	}
	export function setUser(context: UserContext | null) {
		setContext(UserSymbol, context);
	}

	export function addError(message: string, error?: PostgrestError) {
		errors.push({ message, error });
	}

	export async function queryOrError(query: Promise<PostgrestError | null>, message: string) {
		const error = await query;
		if (error) {
			addError(message, error);
			return error;
		}
		return null;
	}

	export const DBSymbol = Symbol('db');

	export function getDB(): OrganizationsDB {
		return getContext<OrganizationsDB>(DBSymbol);
	}

	export const OrgSymbol = Symbol('organization');
	export type OrgContext = { org: Organization };
	export function getOrg(): OrgContext {
		return getContext<OrgContext>(OrgSymbol);
	}
</script>

<script lang="ts">
	import Page from '$lib/Page.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import OrganizationsDB from '$database/OrganizationsDB';
	import Error from '$lib/Error.svelte';
	import { goto, invalidate } from '$app/navigation';
	import Note from '$lib/Note.svelte';
	import Link from '$lib/Link.svelte';
	import type { User } from '@supabase/supabase-js';
	import type { LayoutData } from './$types';
	import Organization from '$types/Organization';
	import { type Snippet } from 'svelte';
	import { errors } from './errors.svelte';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	let db = $state(new OrganizationsDB(data.supabase));
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
		<Note><Link to="https://amyjko.phd">Amy</Link> built this.</Note>
	</div>
</Page>
