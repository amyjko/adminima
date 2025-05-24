import Organization from '$database/Organization.js';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [
		{ data: change, error: changeError },
		{ data: roles },
		{ data: profiles },
		{ data: processes }
	] = await Promise.all([
		Organization.queryChange(supabase, params.changeid),
		Organization.queryRoles(supabase, org.id),
		Organization.queryProfiles(supabase, org.id),
		Organization.queryProcesses(supabase, org.id)
	]);

	if (change === null || roles === null || profiles === null || processes === null)
		error(404, {
			message: 'Unable to retrieve this change.' + changeError?.message || ''
		});

	return {
		change,
		roles,
		profiles,
		processes
	};
}
