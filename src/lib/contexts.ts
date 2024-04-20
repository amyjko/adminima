import type { Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import type Org from '$types/Org';

export const OrgSymbol = Symbol('organization');
export type OrgContext = Writable<Org>;
export function setOrg(context: OrgContext | null) {
	setContext(OrgSymbol, context);
}

export function getOrg(): OrgContext {
	return getContext<OrgContext>(OrgSymbol);
}
