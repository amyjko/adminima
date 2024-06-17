import Organizations, { type OrganizationPayload } from '$database/Organizations';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, locals }): Promise<{ payload: OrganizationPayload | null }> {
	/** Get the serializable organization payload from the database */
	const org = await new Organizations(locals.supabase).getPayload(params.orgid);

	return {
		payload: org
	};
}
