import Organization from '$database/Organization';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [{ data: profiles }] = await Promise.all([Organization.queryProfiles(supabase, org.id)]);

	if (profiles === null)
		error(404, {
			message: 'Unable to retrieve profiles for this organization.'
		});

	return {
		profiles
	};
}
