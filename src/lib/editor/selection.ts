import { BlockAttribute, PillAttribute } from './render';
import { lines } from './read';

/**
 * Where the caret is, in terms the editor can hold on to.
 *
 * Not a DOM node and offset: normalizing a block after a keystroke replaces its nodes, and any
 * saved reference to one is stale before it can be used. A character offset into a line survives
 * that, because it describes the text rather than the nodes the text happens to live in.
 *
 * A pill counts as a single character, which is what makes a reference behave like one object —
 * one step of arrow travel, one press of backspace — without any of it being hand written.
 */
export type Point = { block: string; line: number; offset: number };

function isElement(node: Node): node is Element {
	return node.nodeType === 1;
}

function isPill(node: Node): boolean {
	return isElement(node) && node.hasAttribute(PillAttribute);
}

/** The block a node sits in, if any. */
export function blockAt(root: Element, node: Node | null): Element | undefined {
	let current: Node | null = node;
	while (current !== null && current !== root) {
		if (isElement(current) && current.hasAttribute(BlockAttribute)) return current;
		current = current.parentNode;
	}
	return undefined;
}

/** The line a node sits in, and which line of its block that is. */
export function lineAt(
	block: Element,
	node: Node | null
): { line: Element; index: number } | undefined {
	const candidates = lines(block);
	for (const [index, line] of candidates.entries()) {
		if (line === node || line.contains(node)) return { line, index };
	}
	return undefined;
}

/**
 * How many characters into a line a position is. Counts what a reader would count: the text, with
 * each pill as one character, and nothing for the empty text nodes that sit beside them.
 */
export function offsetOf(line: Element, node: Node, offset: number): number {
	let count = 0;
	let found = -1;

	const walk = (current: Node) => {
		if (found >= 0) return;
		if (current === node && !isElement(current)) {
			found = count + offset;
			return;
		}
		if (isPill(current)) {
			// A position inside a pill is a position at its near edge, never within its text.
			if (current === node || current.contains(node)) {
				found = count + (offset > 0 ? 1 : 0);
				return;
			}
			count++;
			return;
		}
		if (current.nodeType === 3) {
			count += (current as globalThis.Text).data.length;
			return;
		}
		if (isElement(current)) {
			const children = Array.from(current.childNodes);
			if (current === node) {
				// A position expressed as an index among children, which is what browsers give for
				// an empty line or a position between elements.
				for (let index = 0; index < Math.min(offset, children.length); index++)
					walk(children[index]);
				found = count;
				return;
			}
			for (const child of children) walk(child);
		}
	};

	walk(line);
	return found >= 0 ? found : count;
}

/** The node and offset a character offset lands on, for putting the caret back. */
export function nodeAt(line: Element, offset: number): { node: Node; offset: number } {
	let count = 0;
	let result: { node: Node; offset: number } | undefined;

	const walk = (current: Node) => {
		if (result !== undefined) return;
		if (isPill(current)) {
			count++;
			return;
		}
		if (current.nodeType === 3) {
			const text = current as globalThis.Text;
			if (offset <= count + text.data.length) {
				result = { node: text, offset: offset - count };
				return;
			}
			count += text.data.length;
			return;
		}
		if (isElement(current)) for (const child of Array.from(current.childNodes)) walk(child);
	};

	walk(line);
	// Past the end, or a line with no text in it at all: sit at the end of the line itself.
	return result ?? { node: line, offset: line.childNodes.length };
}

/** The whole visible length of a line, counting each pill as one. */
export function lengthOf(line: Element): number {
	let count = 0;
	const walk = (current: Node) => {
		if (isPill(current)) count++;
		else if (current.nodeType === 3) count += (current as globalThis.Text).data.length;
		else if (isElement(current)) for (const child of Array.from(current.childNodes)) walk(child);
	};
	walk(line);
	return count;
}

/** Where the caret is now, if it is in this editor at all. */
export function savePoint(root: Element): Point | undefined {
	const selection = root.ownerDocument.defaultView?.getSelection();
	if (!selection || selection.focusNode === null) return undefined;
	const block = blockAt(root, selection.focusNode);
	if (block === undefined) return undefined;
	const found = lineAt(block, selection.focusNode);
	if (found === undefined) return undefined;
	return {
		block: block.getAttribute(BlockAttribute) ?? '',
		line: found.index,
		offset: offsetOf(found.line, selection.focusNode, selection.focusOffset)
	};
}

/** Put the caret back where it was, as nearly as the text still allows. */
export function restorePoint(root: Element, point: Point): boolean {
	const block = root.querySelector(`[${BlockAttribute}="${point.block}"]`);
	if (block === null) return false;
	const candidates = lines(block);
	const line = candidates[Math.min(point.line, candidates.length - 1)];
	if (line === undefined) return false;

	const view = root.ownerDocument.defaultView;
	const selection = view?.getSelection();
	if (!selection) return false;

	const { node, offset } = nodeAt(line, Math.min(point.offset, lengthOf(line)));
	const range = root.ownerDocument.createRange();
	range.setStart(node, offset);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
	return true;
}
