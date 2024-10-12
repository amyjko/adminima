import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	const { supabase } = await parent();

	const { data: orgs } = await supabase
		.from('orgs')
		.select(`id, name, paths, profiles!profiles_orgid_fkey(personid, name)`)
		.not('profiles', 'is', null)
		.eq('profiles.personid', params.personid);

	return {
		orgs
	};
}
