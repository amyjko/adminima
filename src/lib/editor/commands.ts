import Bullets from '../../markup/Bullets';
import Heading from '../../markup/Heading';
import Markup from '../../markup/Markup';
import Numbered from '../../markup/Numbered';
import Paragraph from '../../markup/Paragraph';
import Quote from '../../markup/Quote';
import type Block from '../../markup/Block';
import type Segment from '../../markup/Segment';
import { coalesce, lineLength, splitLine, spliceLine, toggleMark } from './segments';

/**
 * What the toolbar and the keyboard actually do, as transforms on a document.
 *
 * Every one of these takes a document and a position and returns a document and a position, so the
 * hardest part of an editor — where the caret ends up after Enter on an empty list item — is
 * something that can be read, tested, and argued about without a browser in the room.
 */

export type Kind = 'paragraph' | 'heading1' | 'heading2' | 'bullets' | 'numbered' | 'quote';

/** Which block, which of its lines, and how many characters into that line. */
export type Position = { block: number; line: number; offset: number };

export type Edit = { markup: Markup; position: Position };

export function kindOf(block: Block): Kind {
	if (block instanceof Heading) return block.level === 1 ? 'heading1' : 'heading2';
	if (block instanceof Bullets) return 'bullets';
	if (block instanceof Numbered) return 'numbered';
	if (block instanceof Quote) return 'quote';
	return 'paragraph';
}

/** A block's lines, whatever kind it is. A paragraph and a heading have exactly one. */
export function linesOf(block: Block): Segment[][] {
	if (block instanceof Heading) return [block.text];
	if (block instanceof Bullets || block instanceof Numbered) return block.items;
	if (block instanceof Quote) return block.blocks;
	if (block instanceof Paragraph) return [block.segments];
	return [[]];
}

/** Whether a kind holds many lines, which is what decides where Enter goes. */
export function holdsLines(kind: Kind): boolean {
	return kind === 'bullets' || kind === 'numbered' || kind === 'quote';
}

/**
 * Build blocks of a kind from lines. A kind that holds one line per block yields one block per
 * line, so turning a three item list into paragraphs gives three paragraphs rather than losing two.
 */
export function blocksOf(kind: Kind, lines: Segment[][]): Block[] {
	const filled = lines.length === 0 ? [[]] : lines;
	if (kind === 'bullets') return [new Bullets(filled)];
	if (kind === 'numbered') return [new Numbered(filled)];
	if (kind === 'quote') return [new Quote(filled)];
	if (kind === 'heading1') return filled.map((line) => new Heading(1, line));
	if (kind === 'heading2') return filled.map((line) => new Heading(2, line));
	return filled.map((line) => new Paragraph(line));
}

function replace(markup: Markup, index: number, blocks: Block[]): Markup {
	return new Markup([
		...markup.blocks.slice(0, index),
		...blocks,
		...markup.blocks.slice(index + 1)
	]);
}

function withLines(markup: Markup, index: number, lines: Segment[][]): Markup {
	return replace(markup, index, blocksOf(kindOf(markup.blocks[index]), lines));
}

/** Turn bold or italic on or off across a selection within one line. */
export function mark(markup: Markup, at: Position, to: number, format: '*' | '_'): Edit {
	const lines = linesOf(markup.blocks[at.block]);
	const line = lines[at.line];
	if (line === undefined) return { markup, position: at };
	const [start, end] = at.offset <= to ? [at.offset, to] : [to, at.offset];
	const marked = lines.map((each, index) =>
		index === at.line ? toggleMark(line, start, end, format) : each
	);
	return { markup: withLines(markup, at.block, marked), position: at };
}

/** Change what kind of block the caret is in. */
export function setKind(markup: Markup, at: Position, kind: Kind): Edit {
	const block = markup.blocks[at.block];
	if (block === undefined || kindOf(block) === kind) return { markup, position: at };
	const lines = linesOf(block);
	const blocks = blocksOf(kind, lines);
	// One block per line means the line the caret was on is now a block of its own.
	const position = holdsLines(kind)
		? at
		: { block: at.block + at.line, line: 0, offset: at.offset };
	return { markup: replace(markup, at.block, blocks), position };
}

/** Enter. */
export function split(markup: Markup, at: Position): Edit {
	const block = markup.blocks[at.block];
	if (block === undefined) return { markup, position: at };
	const kind = kindOf(block);
	const lines = linesOf(block);
	const [before, after] = splitLine(lines[at.line] ?? [], at.offset);

	if (holdsLines(kind)) {
		// Enter on an empty last line leaves the list rather than adding another empty item to it.
		if (lineLength(lines[at.line] ?? []) === 0 && at.line === lines.length - 1) {
			const remaining = lines.slice(0, -1);
			const blocks: Block[] = [
				...(remaining.length > 0 ? blocksOf(kind, remaining) : []),
				new Paragraph([])
			];
			return {
				markup: replace(markup, at.block, blocks),
				position: { block: at.block + (remaining.length > 0 ? 1 : 0), line: 0, offset: 0 }
			};
		}
		const split = [...lines.slice(0, at.line), before, after, ...lines.slice(at.line + 1)];
		return {
			markup: withLines(markup, at.block, split),
			position: { block: at.block, line: at.line + 1, offset: 0 }
		};
	}

	// A heading is a single line, so what follows it is a paragraph rather than another heading.
	const blocks = [...blocksOf(kind, [before]), new Paragraph(after)];
	return {
		markup: replace(markup, at.block, blocks),
		position: { block: at.block + 1, line: 0, offset: 0 }
	};
}

/** Backspace at the very start of a line. */
export function mergeBackward(markup: Markup, at: Position): Edit {
	const block = markup.blocks[at.block];
	if (block === undefined || at.offset !== 0) return { markup, position: at };
	const kind = kindOf(block);
	const lines = linesOf(block);

	// Within a list or quote, join this line onto the one above it.
	if (at.line > 0) {
		const above = lines[at.line - 1];
		const joined = [
			...lines.slice(0, at.line - 1),
			coalesce([...above, ...lines[at.line]]),
			...lines.slice(at.line + 1)
		];
		return {
			markup: withLines(markup, at.block, joined),
			position: { block: at.block, line: at.line - 1, offset: lineLength(above) }
		};
	}

	// At the top of something that isn't a paragraph, back out of it rather than joining upward.
	if (kind !== 'paragraph') return setKind(markup, at, 'paragraph');

	// A paragraph at the very start of the document has nothing to join.
	if (at.block === 0) return { markup, position: at };

	const previous = markup.blocks[at.block - 1];
	const previousLines = linesOf(previous);
	const last = previousLines[previousLines.length - 1];
	const joined = [...previousLines.slice(0, -1), coalesce([...last, ...(lines[0] ?? [])])];
	return {
		markup: new Markup([
			...markup.blocks.slice(0, at.block - 1),
			...blocksOf(kindOf(previous), joined),
			...markup.blocks.slice(at.block + 1)
		]),
		position: { block: at.block - 1, line: previousLines.length - 1, offset: lineLength(last) }
	};
}

/**
 * Put a whole pasted document in at the caret. A single pasted paragraph joins the line it lands
 * in; anything with structure to it splits the block open and sits between the halves.
 */
export function insertMarkup(markup: Markup, at: Position, to: number, pasted: Markup): Edit {
	if (pasted.blocks.length === 0) return { markup, position: at };

	const only = pasted.blocks.length === 1 ? pasted.blocks[0] : undefined;
	if (only instanceof Paragraph) return insert(markup, at, to, only.segments);

	const block = markup.blocks[at.block];
	if (block === undefined) return { markup, position: at };
	const kind = kindOf(block);
	const lines = linesOf(block);
	const [start, end] = at.offset <= to ? [at.offset, to] : [to, at.offset];
	const [head] = splitLine(lines[at.line] ?? [], start);
	const [, tail] = splitLine(lines[at.line] ?? [], end);

	const above = [...lines.slice(0, at.line), head].filter(
		(line, index) => index < at.line || lineLength(line) > 0
	);
	const below = [tail, ...lines.slice(at.line + 1)].filter(
		(line, index) => index > 0 || lineLength(line) > 0
	);

	const blocks: Block[] = [
		...(above.length > 0 ? blocksOf(kind, above) : []),
		...pasted.blocks,
		...(below.length > 0 ? blocksOf(kind, below) : [])
	];

	// The caret ends up at the end of the last thing pasted.
	const lastIndex =
		(above.length > 0 ? blocksOf(kind, above).length : 0) + pasted.blocks.length - 1;
	const last = blocks[lastIndex];
	const lastLines = linesOf(last);
	return {
		markup: replace(markup, at.block, blocks),
		position: {
			block: at.block + lastIndex,
			line: lastLines.length - 1,
			offset: lineLength(lastLines[lastLines.length - 1])
		}
	};
}

/** Put segments in at the caret, replacing a selection if there is one. */
export function insert(markup: Markup, at: Position, to: number, segments: Segment[]): Edit {
	const lines = linesOf(markup.blocks[at.block]);
	const line = lines[at.line];
	if (line === undefined) return { markup, position: at };
	const [start, end] = at.offset <= to ? [at.offset, to] : [to, at.offset];
	const replaced = lines.map((each, index) =>
		index === at.line ? spliceLine(line, start, end, segments) : each
	);
	return {
		markup: withLines(markup, at.block, replaced),
		position: { ...at, offset: start + lineLength(segments) }
	};
}
