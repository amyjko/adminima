/**
 * Matching `<name@target>` against the roles and processes of an organization.
 *
 * The same rule is needed in two places -- showing a reference, and offering one to insert -- and
 * they have to agree, or the picker will offer something that renders as unknown.
 */

/** As much of a role or process as a reference needs to know about. */
export type Short = { id: string; title: string; short: string[] };

/** A reference names a short name or the title, and cares about neither case nor spacing. */
export function matches(item: Short, target: string): boolean {
	const wanted = target.trim().toLocaleLowerCase();
	if (wanted === '') return false;
	return (
		item.short.some((name) => name.trim().toLocaleLowerCase() === wanted) ||
		item.title.trim().toLocaleLowerCase() === wanted
	);
}

/** Whichever role or process a target names, if any. */
export function find<T extends Short>(items: T[], target: string): T | undefined {
	return items.find((item) => matches(item, target));
}

/**
 * What to write in a reference to something. A short name if it has one, since that is what the
 * short names are for, and the title otherwise.
 */
export function targetFor(item: Short): string {
	return item.short.find((name) => name.trim() !== '') ?? item.title;
}
