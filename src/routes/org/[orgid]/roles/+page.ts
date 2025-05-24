import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [{ data: roles }, { data: teams }, { data: assignments }, { data: profiles }] =
		await Promise.all([
			Organization.queryRoles(supabase, org.id),
			Organization.queryTeams(supabase, org.id),
			Organization.queryAssignments(supabase, org.id),
			Organization.queryProfiles(supabase, org.id)
		]);

	if (roles === null || teams === null || assignments === null || profiles === null)
		error(404, {
			message: 'Unable to retrieve roles for this organization.'
		});

	return {
		roles,
		teams,
		assignments,
		profiles
	};
}
