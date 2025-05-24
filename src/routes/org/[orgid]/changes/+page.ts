import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [{ data: changes }, { data: profiles }] = await Promise.all([
		Organization.queryChanges(supabase, org.id),
		Organization.queryProfiles(supabase, org.id)
	]);

	if (changes === null || profiles === null)
		error(404, {
			message: "Unable to retrieve this organization's changes."
		});

	return {
		changes,
		profiles
	};
}
