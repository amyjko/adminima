import { writable } from 'svelte/store';

export const locale = writable<Locale | undefined>(undefined);

async function setLocale(name: string): Promise<Locale> {
	const strings = (await import(/* @vite-ignore */ `/src/locales/${name}.json`)) as Locale;
	locale.set(strings);
	return strings;
}

export type Locale = {
	name: string;
	landing: {
		value: string;
		description: string;
	};
};

setLocale('en-US');
