import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [{ data: profiles }, { data: roles }, { data: assignments }, { data: teams }] =
		await Promise.all([
			Organization.queryProfiles(supabase, org.id),
			Organization.queryRoles(supabase, org.id),
			Organization.queryAssignments(supabase, org.id),
			Organization.queryTeams(supabase, org.id)
		]);

	if (roles === null || profiles === null || assignments === null || teams === null)
		error(404, {
			message: 'Unable to retrieve this role.'
		});

	return {
		roles,
		profiles,
		assignments,
		teams
	};
}
