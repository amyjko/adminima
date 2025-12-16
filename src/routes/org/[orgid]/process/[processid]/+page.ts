import Organization from '$database/Organization';
import { noAccess } from '$types/Locales.js';
import { error } from '@sveltejs/kit';
import { validate as isValidUUID } from 'uuid';

export async function load({ parent, params }) {
	const { supabase, org, uid } = await parent();

	let process = isValidUUID(params.processid)
		? await Organization.queryProcess(supabase, params.processid)
		: await Organization.queryProcessByShortName(supabase, org.id, params.processid);

	if (process === null)
		error(404, {
			message: noAccess('process')
		});

	const [
		{ data: hows },
		{ data: roles },
		{ data: changes },
		concerns,
		{ data: personRoles },
		{ data: profiles }
	] = await Promise.all([
		Organization.queryProcessHows(supabase, process.id),
		Organization.queryRoles(supabase, org.id),
		Organization.queryProcessChanges(supabase, org.id),
		Organization.queryConcerns(supabase, org.id),
		Organization.queryPersonRoles(supabase, org.id, uid),
		Organization.queryProfiles(supabase, org.id)
	]);

	if (
		hows === null ||
		roles === null ||
		changes === null ||
		concerns === null ||
		personRoles === null ||
		profiles === null
	)
		error(404, {
			message: noAccess('process')
		});

	return {
		process,
		hows,
		roles,
		changes,
		concerns,
		personRoles: personRoles.map((r) => r.roleid),
		profiles
	};
}
