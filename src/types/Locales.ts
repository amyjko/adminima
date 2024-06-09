import { writable } from 'svelte/store';

export const locale = writable<Locale | undefined>(undefined);

export type Locale = {
	name: string;
	term: {
		/** The loading word to show when loading */
		loading: string;
		/** The word representing a set of processes a person is responsibile for */
		role: string;
		/** The word representing a specific process */
		process: string;
		/** What to call changes to a document */
		change: string;
		/** What to call people */
		person: string;
		/** What to call organizations */
		organization: string;
		/** What to call a request */
		request: string;
		/** What to call a page load error */
		error: string;
		/** What we call a team */
		team: string;
	};
	landing: {
		value: string;
		description: string;
	};
	error: {
		noProcess: string;
		noRoleProcesses: string;
		noPerson: string;
		noOrganization: string;
		noRole: string;
		noSuggestion: string;
		noProcessChanges: string;
		noTeam: string;
	};
};
