import { browser } from '$app/environment';

/**
 * Whether to edit as rich text or as markup source.
 *
 * Kept for the whole application rather than per field: someone who wants to see the markup wants
 * to see it everywhere, and having one description behave differently from the next is the more
 * surprising behavior. Kept on the device rather than in the database, because a preference about
 * how to type does not warrant a column and an access policy.
 */

export type Mode = 'rich' | 'source';

const Key = 'adminima.editor.mode';

function stored(): Mode {
	// Private browsing throws on both reading and writing, and a preference is never worth an error.
	try {
		return browser && localStorage.getItem(Key) === 'source' ? 'source' : 'rich';
	} catch {
		return 'rich';
	}
}

let current = $state<Mode>(stored());

export function mode(): Mode {
	return current;
}

export function setMode(next: Mode) {
	current = next;
	try {
		if (browser) localStorage.setItem(Key, next);
	} catch {
		// A preference that cannot be remembered still works for this session.
	}
}
