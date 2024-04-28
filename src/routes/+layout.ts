import { type Locale } from '$types/Locales';

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }) {
	const response = await fetch(`/locales/en-US.json`);
	const strings = (await response.json()) as Locale;

	return {
		locale: strings
	};
}
