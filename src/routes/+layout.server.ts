/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, cookies }) {
	return {
		session: locals.session,
		user: locals.user,
		cookies: cookies.getAll()
	};
}
