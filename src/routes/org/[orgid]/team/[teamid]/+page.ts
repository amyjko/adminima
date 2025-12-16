import Organization from '$database/Organization';
import { noAccess } from '$types/Locales.js';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [{ data: team }, { data: roles }] = await Promise.all([
		Organization.queryTeam(supabase, org.id, params.teamid),
		Organization.queryTeamRoles(supabase, org.id, params.teamid)
	]);

	if (team === null || roles === null)
		error(404, {
			message: noAccess('team')
		});

	return {
		team,
		roles
	};
}
