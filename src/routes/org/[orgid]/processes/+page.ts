import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [
		{ data: processes },
		{ data: hows },
		{ data: roles },
		{ data: assignments },
		{ data: profiles }
	] = await Promise.all([
		Organization.queryProcesses(supabase, org.id),
		Organization.queryHows(supabase, org.id),
		Organization.queryRoles(supabase, org.id),
		Organization.queryAssignments(supabase, org.id),
		Organization.queryProfiles(supabase, org.id)
	]);

	if (
		processes === null ||
		hows === null ||
		roles === null ||
		assignments === null ||
		profiles === null
	)
		error(404, {
			message: 'Unable to retrieve processes for this organization.'
		});

	return {
		processes,
		hows,
		roles,
		assignments,
		profiles
	};
}
