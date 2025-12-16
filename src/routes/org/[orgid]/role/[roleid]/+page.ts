import Organization from '$database/Organization';
import { noAccess } from '$types/Locales.js';
import { error } from '@sveltejs/kit';
import { validate as isValidUUID } from 'uuid';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	let role = isValidUUID(params.roleid)
		? await Organization.queryRole(supabase, org.id, params.roleid)
		: await Organization.queryRoleByShortName(supabase, org.id, params.roleid);

	const [
		{ data: assignments },
		{ data: processes },
		{ data: profiles },
		{ data: teams },
		{ data: changes },
		{ data: hows }
	] = await Promise.all([
		Organization.queryAssignments(supabase, org.id),
		Organization.queryProcesses(supabase, org.id),
		Organization.queryProfiles(supabase, org.id),
		Organization.queryTeams(supabase, org.id),
		Organization.queryChanges(supabase, org.id),
		Organization.queryHows(supabase, org.id)
	]);

	if (
		role === null ||
		assignments === null ||
		processes === null ||
		profiles === null ||
		teams === null ||
		changes === null ||
		hows === null
	)
		error(404, {
			message: noAccess('role')
		});

	return {
		role,
		assignments,
		processes,
		profiles,
		teams,
		changes,
		hows
	};
}
