import Organization from '#database/Organization.ts';
import { noAccess } from '#types/Locales.ts';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [{ data: team }, { data: roles }] = await Promise.all([
		Organization.queryTeam(supabase, org.id, params.teamid),
		Organization.queryTeamRoles(supabase, org.id, params.teamid)
	]);

	if (team === null || roles === null) error(404, noAccess('team'));

	return {
		team,
		roles
	};
}
