import { type Locale } from '$types/Locales';
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_API_URL } from '$env/static/public';

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch, data, depends }) {
	const response = await fetch(`/locales/en-US.json`);
	const strings = (await response.json()) as Locale;

	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_API_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				}
		  })
		: createServerClient(PUBLIC_SUPABASE_API_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll() {
						return data.cookies;
					}
				}
		  });

	/**
	 * It's fine to use `getSession` here, because on the client, `getSession` is
	 * safe, and on the server, it reads `session` from the `LayoutData`, which
	 * safely checked the session using `safeGetSession`.
	 */
	const {
		data: { session }
	} = await supabase.auth.getSession();

	return { session, supabase, strings };
}
