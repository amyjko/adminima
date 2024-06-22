import { get, type Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import type { PostgrestError, User } from '@supabase/supabase-js';
import type Organization from '$types/Organization';
import type OrganizationsDB from '$database/OrganizationsDB';

export const OrgSymbol = Symbol('organization');
export type OrgContext = Writable<Organization>;

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

export const DBSymbol = Symbol('db');
export type DBContext = Writable<OrganizationsDB>;

export function getDB(): DBContext {
	return getContext<DBContext>(DBSymbol);
}

export const ErrorsSymbol = Symbol('errors');
export type DBError = { message: string; error: PostgrestError | undefined };
export type ErrorsContext = Writable<DBError[]>;

export function getErrors(): ErrorsContext {
	return getContext<ErrorsContext>(ErrorsSymbol);
}

export function addError(errors: ErrorsContext, message: string, error?: PostgrestError) {
	return errors.set([...get(errors), { message, error }]);
}

export async function queryOrError(
	errors: ErrorsContext,
	query: Promise<PostgrestError | null>,
	message: string
) {
	const error = await query;
	if (error) {
		addError(errors, message, error);
		return error;
	}
	return null;
}
