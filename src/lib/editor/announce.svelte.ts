/**
 * Saying out loud what only sighted people can otherwise see.
 *
 * The editor changes things a screen reader has no way to notice: a format turning on for text
 * that has not been typed yet, a block becoming a list, a reference deleted as one object. Those
 * get announced. What the screen reader already handles — the caret moving, characters arriving —
 * deliberately does not, because announcing it as well would drown out everything that matters.
 *
 * There is one region for the whole application rather than one per editor, so that a page with a
 * dozen editable descriptions on it does not have a dozen live regions competing.
 */

let current = $state('');
let pending: ReturnType<typeof setTimeout> | undefined;

/** How long to leave the region empty before filling it again. */
const ClearMilliseconds = 50;

export function announcement(): string {
	return current;
}

export function announce(message: string) {
	if (pending !== undefined) clearTimeout(pending);
	// Setting a region to what it already says announces nothing, and "Bold on" twice in a row is
	// an ordinary thing to do. Emptying it first makes the second one land.
	current = '';
	pending = setTimeout(() => {
		current = message;
		pending = undefined;
	}, ClearMilliseconds);
}

/** For tests, and for tearing down between pages. */
export function reset() {
	if (pending !== undefined) clearTimeout(pending);
	pending = undefined;
	current = '';
}
