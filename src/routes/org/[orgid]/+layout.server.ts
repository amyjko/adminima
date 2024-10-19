import { type OrganizationPayload } from '$database/OrganizationsDB';
import type { LayoutServerLoadEvent } from './$types';

export async function load({
	params,
	locals
}: LayoutServerLoadEvent): Promise<{ payload: OrganizationPayload | null }> {
	const { data, error } = await locals.supabase
		.rpc('organization_payload', { _orgid: params.orgid })
		.single();

	return {
		payload: error ? null : data.payload
	};
}
