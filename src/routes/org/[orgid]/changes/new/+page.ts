import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [{ data: roles }, { data: processes }] = await Promise.all([
		Organization.queryRoles(supabase, org.id),
		Organization.queryProcesses(supabase, org.id)
	]);

	if (roles === null || processes === null)
		error(404, {
			message: 'Unable to retrieve roles and processes for new change.'
		});

	return {
		roles,
		processes
	};
}
