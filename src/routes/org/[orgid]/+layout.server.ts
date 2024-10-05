import { type OrganizationPayload } from '$database/OrganizationsDB';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, locals }): Promise<{ payload: OrganizationPayload | null }> {
	const { data, error } = await locals.supabase
		.rpc('organization_payload', { _orgid: params.orgid })
		.single();

	return {
		payload: error ? null : data.payload
	};
}
