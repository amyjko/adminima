import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [
		{ data: roles },
		{ data: processes },
		{ data: hows },
		{ data: assignments },
		{ data: profiles },
		{ data: changes }
	] = await Promise.all([
		Organization.queryRoles(supabase, org.id),
		Organization.queryProcesses(supabase, org.id),
		Organization.queryHows(supabase, org.id),
		Organization.queryAssignments(supabase, org.id),
		Organization.queryProfiles(supabase, org.id),
		Organization.queryChanges(supabase, org.id)
	]);

	if (
		roles === null ||
		processes === null ||
		hows === null ||
		assignments === null ||
		profiles === null ||
		changes === null
	)
		error(404, {
			message: 'Unable to retrieve data to export this organization.'
		});

	return {
		roles,
		processes,
		hows,
		assignments,
		profiles,
		changes
	};
}
