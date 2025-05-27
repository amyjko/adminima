import { error } from '@sveltejs/kit';
import { validate as isValidUUID } from 'uuid';

export async function load({ params, locals }) {
	const { supabase } = locals;
	const { data: userRecord } = await supabase.auth.getUser();
	const user = userRecord ? userRecord.user : null;

	// Find the org corresponding to the orgid or the path string
	let { data: org } = isValidUUID(params.orgid)
		? await supabase.from('orgs').select('*').eq('id', params.orgid).single()
		: await supabase.from('orgs').select('*').contains('paths', [params.orgid]).single();

	// No org? Error out.
	if (org === null) {
		error(404, {
			message: 'Organization not found.'
		});
	}

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
		supabase
			.from('profiles')
			.select('*')
			.eq('orgid', org.id)
			.eq('personid', user ? user.id : 0)
			.single(),
		supabase.from('roles').select('id', { count: 'exact', head: true }).eq('orgid', org.id),
		supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('orgid', org.id),
		supabase.from('processes').select('id', { count: 'exact', head: true }).eq('orgid', org.id),
		supabase
			.from('suggestions')
			.select('id', { count: 'exact', head: true })
			.eq('orgid', org.id)
			.neq('status', 'done')
			.neq('status', 'declined'),
		supabase.from('roles').select('id, short, title').neq('short', '{}').eq('orgid', org.id),
		supabase
			.from('processes')
			.select('id, short, title, state')
			.neq('short', '{}')
			.eq('orgid', org.id)
	]);

	if (
		profile === null ||
		roles === null ||
		profiles === null ||
		processes === null ||
		changes === null
	) {
		error(404, {
			message:
				user === null
					? `Unable to show this organization. Try logging in with your organization email address, in case this organization restricted to members.`
					: `Unable to retrieve organization data.`
		});
	}

	return {
		org,
		uid: user ? user.id : null,
		member: profile !== null,
		admin: profile !== null && profile.admin,
		counts: {
			roles: roles,
			profiles: profiles,
			processes: processes,
			changes: changes
		},
		shortRoles: shortRoles ?? [],
		shortProcesses: shortProcesses ?? []
	};
}
