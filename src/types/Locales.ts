import { writable } from 'svelte/store';

export const locale = writable<Locale | undefined>(undefined);

async function setLocale(name: string): Promise<Locale> {
	const strings = (await import(/* @vite-ignore */ `/src/locales/${name}.json`)) as Locale;
	locale.set(strings);
	return strings;
}

export type Locale = {
	name: string;
	term: {
		/** The loading word to show when loading */
		loading: string;
		/** The word representing a set of activities a person is responsibile for */
		role: string;
		/** The word representing a specific activity */
		activity: string;
		/** What to call changes to a document */
		change: string;
	};
	landing: {
		value: string;
		description: string;
	};
	error: {
		noActivity: string;
		noRoleActivities: string;
	};
};

setLocale('en-US');
