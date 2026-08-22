import { browser } from '$app/environment';

/**
 * The one duration the editor animates over, shared because two components have to agree on it.
 *
 * Making room for the toolbar pushes everything under it down the page, and taking the room back
 * pulls it up again. Both are worth showing. What is not worth showing is the moment in between,
 * where the editor is still leaving and the rendered version has already arrived, and the same
 * paragraph is on screen twice.
 *
 * So the rendered version waits exactly as long as the editor takes to go.
 */
export const Milliseconds = 160;

/** Nothing animates for anyone who has asked for less of it. */
export function still(): boolean {
	return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** How long the editor takes to leave, which is how long the rendered version waits. */
export function after(): number {
	return still() ? 0 : Milliseconds;
}
