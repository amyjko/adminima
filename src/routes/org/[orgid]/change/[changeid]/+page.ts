import Organization from '$database/Organization.js';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	console.log(Date.now(), 'Awaiting change parent data.');

	const { supabase, org } = await parent();

	console.log(Date.now(), 'Loading change data');

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

	console.log(Date.now(), 'Returning change data');

	return {
		change,
		roles,
		profiles,
		processes
	};
}
