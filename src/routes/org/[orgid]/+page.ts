import Organization from '#database/Organization.ts';
import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const { supabase, org } = await parent();

	const [{ data: profiles }] = await Promise.all([Organization.queryProfiles(supabase, org.id)]);

	if (profiles === null) error(404, 'Unable to retrieve profiles for this organization.');

	return {
		profiles
	};
}
