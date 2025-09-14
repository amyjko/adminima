import type Database from '$database/Database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { validate as isValidUUID } from 'uuid';

export async function load({ params, locals }) {
	const { supabase } = locals as { supabase: SupabaseClient<Database> };
	const { data: userRecord } = await supabase.auth.getUser();
	const user = userRecord ? userRecord.user : null;

	// Find the org corresponding to the orgid or the path string
	let { data: org } = isValidUUID(params.orgid)
		? await supabase.from('orgs').select('*').eq('id', params.orgid).single()
		: await supabase.from('orgs').select('*').contains('paths', [params.orgid]).single();

	// No org? Error out.
	if (org === null) {
		error(404, {
			message: 'Unable to show organization. It may not exist or may not be visible to you.'
		});
	}

	const profileQuery = supabase
		.from('profiles')
		.select('*')
		.eq('orgid', org.id)
		.eq('personid', user ? user.id : '00000000-0000-0000-0000-000000000000')
		.single();

	const roleCountQuery = supabase
		.from('roles')
		.select('id', { count: 'exact', head: true })
		.eq('orgid', org.id);
	const profileCountQuery = supabase
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.eq('orgid', org.id);

	const processCountQuery = supabase
		.from('processes')
		.select('id', { count: 'exact', head: true })
		.eq('orgid', org.id);

	const changeCountQuery = supabase
		.from('suggestions')
		.select('id', { count: 'exact', head: true })
		.eq('orgid', org.id)
		.neq('status', 'done')
		.neq('status', 'declined');

	const rolesQuery = supabase.from('roles').select('id, short, title').eq('orgid', org.id);
	const processesQuery = supabase
		.from('processes')
		.select('id, short, title, state')
		.eq('orgid', org.id);

	// Get this user's profile in the org and the counts.
	// Also get any roles and processses with short names.
	const [
		{ data: profile },
		{ count: roles },
		{ count: profiles },
		{ count: processes },
		{ count: changes },
		{ data: shortRoles },
		{ data: shortProcesses }
	] = await Promise.all([
		profileQuery,
		roleCountQuery,
		profileCountQuery,
		processCountQuery,
		changeCountQuery,
		rolesQuery,
		processesQuery
	]);

	return {
		org,
		uid: user ? user.id : null,
		member: profile !== null,
		admin: profile !== null && 'admin' in profile && profile.admin,
		counts: {
			roles: roles ?? 0,
			profiles: profiles ?? 0,
			processes: processes ?? 0,
			changes: changes ?? 0
		},
		shortRoles: shortRoles ?? [],
		shortProcesses: shortProcesses ?? []
	};
}
