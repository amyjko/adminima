import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const { supabase, org } = await parent();

	const [
		{ data: profile },
		{ data: assignments },
		{ data: roles },
		{ data: processes },
		{ data: hows },
		{ data: changes }
	] = await Promise.all([
		Organization.queryProfile(supabase, org.id, params.profileid),
		Organization.queryAssignments(supabase, org.id),
		Organization.queryRoles(supabase, org.id),
		Organization.queryProcesses(supabase, org.id),
		Organization.queryHows(supabase, org.id),
		Organization.queryLeadChanges(supabase, org.id, params.profileid)
	]);

	if (
		profile === null ||
		assignments === null ||
		roles === null ||
		processes === null ||
		hows === null ||
		changes === null
	)
		error(404, {
			message: "This profile doesn't exist or isn't visible to you."
		});

	return {
		profile,
		assignments,
		roles,
		processes,
		hows,
		changes
	};
}
