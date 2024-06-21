import OrganizationsDB, { type OrganizationPayload } from '$database/OrganizationsDB';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, locals }): Promise<{ payload: OrganizationPayload | null }> {
	/** Get the serializable organization payload from the database */
	const org = await new OrganizationsDB(locals.supabase).getPayload(params.orgid);

	return {
		payload: org
	};
}
