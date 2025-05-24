import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [{ data: team }, { data: roles }] = await Promise.all([
		Organization.queryTeam(supabase, org.id, params.teamid),
		Organization.queryTeamRoles(supabase, org.id, params.teamid)
	]);

	if (team === null || roles === null)
		error(404, {
			message: 'Unable to retrieve roles for this organization.'
		});

	return {
		team,
		roles
	};
}
