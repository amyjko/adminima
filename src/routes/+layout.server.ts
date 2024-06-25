/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	return {
		session: locals.session,
		user: locals.user
	};
}
