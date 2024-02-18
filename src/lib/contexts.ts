import type { Writable } from 'svelte/store';
import type Organization from '../types/Organization';
import { getContext, setContext } from 'svelte';

export const OrganizationSymbol = Symbol('organization');
export type OrganizationContext = Writable<Organization>;
export function setOrganizationContext(context: OrganizationContext) {
	setContext(OrganizationSymbol, context);
}
export function getOrganizationContext(): OrganizationContext {
	return getContext<OrganizationContext>(OrganizationSymbol);
}
