/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
	const { supabase } = await parent();

	const { data, error } = await supabase
		.from('orgs')
		.select('id, name')
		.eq('visibility', 'public')
		.limit(5);

	return {
		orgs: error ? null : data
	};
}
