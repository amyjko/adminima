import Characters from '../../markup/Text';
import type Segment from '../../markup/Segment';

/**
 * Editing a line of markup, as arithmetic on segments rather than surgery on DOM nodes.
 *
 * Every structural command — bold, splitting a line, merging one into the one above — is a pure
 * function here, and the editor re-renders the block it changed. Range surgery would avoid the
 * re-render, but a command is something someone did deliberately, not something that happens per
 * keystroke, and typing itself never comes through here. What this buys is that the fiddliest part
 * of an editor can be tested without a browser, a selection, or a single mock.
 *
 * Offsets count what a reader counts: a character of text is one, and a whole pill is one.
 */

export type Format = '' | '*' | '_';

export function segmentLength(segment: Segment): number {
	return segment instanceof Characters ? segment.text.length : 1;
}

export function lineLength(segments: Segment[]): number {
	return segments.reduce<number>((total, segment) => total + segmentLength(segment), 0);
}

/** Put back together the runs that slicing and marking leave split. */
export function coalesce(segments: Segment[]): Segment[] {
	const result: Segment[] = [];
	for (const segment of segments) {
		if (segment instanceof Characters && segment.text === '') continue;
		const previous = result[result.length - 1];
		if (
			segment instanceof Characters &&
			previous instanceof Characters &&
			previous.format === segment.format
		)
			result[result.length - 1] = new Characters(previous.format, previous.text + segment.text);
		else result.push(segment);
	}
	return result;
}

/**
 * Everything between two offsets. A pill is included only if the range covers it whole: half a
 * reference is not a thing the grammar can express.
 */
export function sliceLine(segments: Segment[], start: number, end: number): Segment[] {
	const result: Segment[] = [];
	let at = 0;
	for (const segment of segments) {
		const length = segmentLength(segment);
		const from = Math.max(start, at);
		const to = Math.min(end, at + length);
		if (from < to) {
			if (segment instanceof Characters)
				result.push(new Characters(segment.format, segment.text.slice(from - at, to - at)));
			else if (from === at && to === at + length) result.push(segment);
		}
		at += length;
	}
	return coalesce(result);
}

/** Replace everything between two offsets. */
export function spliceLine(
	segments: Segment[],
	start: number,
	end: number,
	replacement: Segment[] = []
): Segment[] {
	const length = lineLength(segments);
	return coalesce([
		...sliceLine(segments, 0, start),
		...replacement,
		...sliceLine(segments, end, length)
	]);
}

/** Split a line in two at an offset. */
export function splitLine(segments: Segment[], offset: number): [Segment[], Segment[]] {
	const length = lineLength(segments);
	return [sliceLine(segments, 0, offset), sliceLine(segments, offset, length)];
}

/** Whether every character in a range already carries a format. */
export function hasMark(segments: Segment[], start: number, end: number, format: Format): boolean {
	if (start >= end) return false;
	const inside = sliceLine(segments, start, end);
	const text = inside.filter((segment) => segment instanceof Characters) as Characters[];
	return text.length > 0 && text.every((segment) => segment.format === format);
}

/** Set a format across a range, leaving pills alone — the grammar cannot format a reference. */
export function markLine(
	segments: Segment[],
	start: number,
	end: number,
	format: Format
): Segment[] {
	const inside = sliceLine(segments, start, end).map((segment) =>
		segment instanceof Characters ? new Characters(format, segment.text) : segment
	);
	return spliceLine(segments, start, end, inside);
}

/** Turn a format on across a range, or off again if all of it already has it. */
export function toggleMark(
	segments: Segment[],
	start: number,
	end: number,
	format: '*' | '_'
): Segment[] {
	return markLine(segments, start, end, hasMark(segments, start, end, format) ? '' : format);
}

/** The segment covering an offset, and where it sits, for finding the pill beside a caret. */
export function segmentAt(
	segments: Segment[],
	offset: number
): { segment: Segment; start: number; end: number } | undefined {
	let at = 0;
	for (const segment of segments) {
		const length = segmentLength(segment);
		if (offset >= at && offset < at + length) return { segment, start: at, end: at + length };
		at += length;
	}
	return undefined;
}
