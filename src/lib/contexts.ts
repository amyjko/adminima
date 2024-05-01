import type { Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import type Org from '$types/Org';
import type { User } from '@supabase/supabase-js';

export const OrgSymbol = Symbol('organization');
export type OrgContext = Writable<Org>;

export function setOrg(context: OrgContext | null) {
	setContext(OrgSymbol, context);
}

export function getOrg(): OrgContext {
	return getContext<OrgContext>(OrgSymbol);
}

export const UserSymbol = Symbol('user');
export type UserContext = Writable<User | null>;

export function getUser(): UserContext {
	return getContext<UserContext>(UserSymbol);
}
export function setUser(context: UserContext | null) {
	setContext(UserSymbol, context);
}
