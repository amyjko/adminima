import type Markup from '../../markup/Markup';
import type Part from '../../markup/Part';
import { serializeBlock } from '../../markup/serializer';

/**
 * Rewrite only what changed.
 *
 * Reserializing a whole document normalizes all of it: bullet markers change, blank line spacing
 * collapses, an unterminated asterisk closes. None of that is wrong, but a person who fixed one
 * typo did not ask for the other forty lines to be rewritten, and a diff that says they did is
 * one nobody can review.
 *
 * So the blocks that still say the same thing keep their original bytes, exactly as they were
 * typed, and only the run of blocks in the middle that actually changed is written out fresh.
 */
export function spliceSource(
	source: string,
	before: Markup,
	after: Markup,
	spans: Map<Part, [number, number]>
): string {
	const old = before.blocks;
	const fresh = after.blocks;

	const written = old.map(serializeBlock);
	const rewritten = fresh.map(serializeBlock);

	// How much of the start, and then of the end, is unchanged.
	let head = 0;
	while (head < written.length && head < rewritten.length && written[head] === rewritten[head])
		head++;

	let tail = 0;
	while (
		tail < written.length - head &&
		tail < rewritten.length - head &&
		written[written.length - 1 - tail] === rewritten[rewritten.length - 1 - tail]
	)
		tail++;

	// Nothing changed, so nothing is rewritten.
	if (head === written.length && head === rewritten.length) return source;

	const middle = rewritten.slice(head, rewritten.length - tail).join('\n\n');
	const replaced = old.slice(head, old.length - tail);

	/*
	 * The boundaries are drawn so that the blank lines between blocks belong to the part being
	 * kept, not to the part being rewritten. Rejoining with a fixed separator instead would quietly
	 * close up the deliberate spacing in the rest of someone's document.
	 */
	const from =
		replaced.length > 0
			? (spans.get(replaced[0])?.[0] ?? source.length)
			: head > 0
				? (spans.get(old[head - 1])?.[1] ?? source.length)
				: 0;
	const to =
		replaced.length > 0 ? (spans.get(replaced[replaced.length - 1])?.[1] ?? source.length) : from;

	const prefix = source.slice(0, from);
	const suffix = source.slice(to);

	// Blocks were removed, and the prefix still ends with the separator that led into them.
	if (middle === '') return prefix.replace(/\s+$/, '') + suffix;

	// Blocks were added between two that stayed, so the new ones need a separator ahead of them.
	if (replaced.length === 0)
		return prefix === ''
			? middle + (suffix === '' ? '' : `\n\n${suffix}`)
			: `${prefix}\n\n${middle}${suffix}`;

	return prefix + middle + suffix;
}
