import type Markup from '../../markup/Markup';
import type Part from '../../markup/Part';
import type Segment from '../../markup/Segment';
import { parseWithSpans } from '../../markup/parser';
import { renderMarkup } from './render';
import { readDocument } from './read';
import { spliceSource } from './splice';
import { markupFromHTML, markupFromText } from './paste';
import History from './undo';
import { announce } from './announce.svelte';
import { saveSpan, savePoint, restorePoint, indexOf, type Point, type Span } from './selection';
import {
	kindOf,
	linesOf,
	mark,
	mergeBackward,
	setKind,
	split,
	insert,
	insertMarkup,
	type Edit,
	type Kind,
	type Position
} from './commands';
import { hasMark } from './segments';

/**
 * The editor, as the browser sees it.
 *
 * The arrangement is: the browser owns the DOM while someone is typing, the DOM is read back into
 * a document afterwards, and the source is derived from that. Typing is never intercepted and
 * never causes a re-render, which is what keeps the caret, the screen reader's cursor, the braille
 * cursor and the input method's own buffer where they were. Only deliberate commands — bold,
 * Enter, a block type change — go the other way and rebuild the block they changed.
 *
 * What is deliberately not done here is cancel every input and re-render, the way a strictly
 * controlled editor would. Composition cannot be cancelled at all, so that arrangement is a fiction
 * during exactly the input it claims to control, and every avoidable rebuild near the caret costs
 * a screen reader user their place.
 */

export type State = {
	bold: boolean;
	italic: boolean;
	kind: Kind;
	undoable: boolean;
	redoable: boolean;
	/** Whether anything is selected, since formatting needs something to apply to. */
	selected: boolean;
};

export type Options = {
	onChange: (source: string) => void;
	onState: (state: State) => void;
	/** The application's own origin, so a pasted link back into it becomes a reference. */
	origin?: string;
	/** Switching between rich text and source, which the component owns rather than the host. */
	onToggleSource?: () => void;
};

/** Input types that arrive while an input method is composing and must be left entirely alone. */
function composed(type: string): boolean {
	return (
		type.startsWith('insertComposition') ||
		type.startsWith('deleteComposition') ||
		type === 'insertFromComposition' ||
		type === 'deleteByComposition'
	);
}

/** Formatting the grammar has no way to express. Dropped here rather than lost at save time. */
const Unsupported = new Set([
	'formatUnderline',
	'formatStrikeThrough',
	'formatSuperscript',
	'formatSubscript',
	'formatFontColor',
	'formatFontName',
	'formatBackColor',
	'formatIndent',
	'formatOutdent',
	'formatJustifyLeft',
	'formatJustifyCenter',
	'formatJustifyRight'
]);

const Names: Record<Kind, string> = {
	paragraph: 'Paragraph',
	heading1: 'Heading level one',
	heading2: 'Heading level two',
	bullets: 'Bulleted list',
	numbered: 'Numbered list',
	quote: 'Block quote'
};

export default class Host {
	readonly root: HTMLElement;
	private options: Options;

	/**
	 * The source as it was opened, and its parse. Everything emitted is spliced against this, so
	 * blocks nobody touched keep the bytes they were written with for the whole session.
	 */
	private baseline: { source: string; markup: Markup; spans: Map<Part, [number, number]> };

	/** The live document, read back from the DOM after typing and replaced outright by commands. */
	private markup: Markup;

	private history = new History();
	private composing = false;
	private listening = false;

	constructor(root: HTMLElement, source: string, options: Options) {
		this.root = root;
		this.options = options;
		const parsed = parseWithSpans(source);
		this.baseline = { source, markup: parsed.markup, spans: parsed.spans };
		this.markup = parsed.markup;
	}

	// -- Lifecycle ------------------------------------------------------------

	mount() {
		this.render();
		if (this.listening) return;
		const root = this.root;
		root.addEventListener('beforeinput', this.onBeforeInput);
		root.addEventListener('input', this.onInput);
		root.addEventListener('compositionstart', this.onCompositionStart);
		root.addEventListener('compositionend', this.onCompositionEnd);
		root.addEventListener('keydown', this.onKeyDown);
		root.addEventListener('paste', this.onPaste);
		root.addEventListener('dragstart', this.onDragStart);
		root.addEventListener('blur', this.onBlur);
		root.ownerDocument.addEventListener('selectionchange', this.onSelectionChange);
		this.listening = true;
	}

	destroy() {
		if (!this.listening) return;
		const root = this.root;
		root.removeEventListener('beforeinput', this.onBeforeInput);
		root.removeEventListener('input', this.onInput);
		root.removeEventListener('compositionstart', this.onCompositionStart);
		root.removeEventListener('compositionend', this.onCompositionEnd);
		root.removeEventListener('keydown', this.onKeyDown);
		root.removeEventListener('paste', this.onPaste);
		root.removeEventListener('dragstart', this.onDragStart);
		root.removeEventListener('blur', this.onBlur);
		root.ownerDocument.removeEventListener('selectionchange', this.onSelectionChange);
		this.listening = false;
	}

	focus() {
		this.root.focus();
	}

	// -- Source ---------------------------------------------------------------

	/** The document as markup, with everything untouched left exactly as it was written. */
	get source(): string {
		return spliceSource(
			this.baseline.source,
			this.baseline.markup,
			this.markup,
			this.baseline.spans
		);
	}

	/**
	 * Take in content from outside. Only ever called deliberately — on opening, and on switching
	 * between rich text and source — never in response to a property changing, which would rebuild
	 * the document under someone's cursor the moment a colleague saved an edit of their own.
	 */
	adopt(source: string) {
		const parsed = parseWithSpans(source);
		this.baseline = { source, markup: parsed.markup, spans: parsed.spans };
		this.markup = parsed.markup;
		this.history = new History();
		this.render();
	}

	private render(point?: Point) {
		const document = this.root.ownerDocument;
		let next = 0;
		this.root.replaceChildren(renderMarkup(document, this.markup, () => `b${next++}`));
		if (point !== undefined) restorePoint(this.root, point);
		this.report();
	}

	private emit() {
		this.options.onChange(this.source);
	}

	private report() {
		this.options.onState(this.state());
	}

	// -- Reading the DOM back -------------------------------------------------

	/**
	 * What the browser has done since the last time we looked. The whole document is read rather
	 * than the one block that changed: these are comments and descriptions, so it costs nothing,
	 * and it means no bookkeeping can drift out of step with what is on screen.
	 */
	private readBack() {
		if (this.composing) return;
		this.markup = readDocument(this.root);
		this.emit();
		this.report();
	}

	// -- Positions ------------------------------------------------------------

	private positionAt(point: Point): Position {
		return { block: indexOf(point), line: point.line, offset: point.offset };
	}

	private pointAt(position: Position): Point {
		return { block: `b${position.block}`, line: position.line, offset: position.offset };
	}

	private span(): Span | undefined {
		return saveSpan(this.root);
	}

	/** Apply a transform, rebuild, and put the caret where the transform said it should go. */
	private apply(edit: Edit, spoken?: string) {
		this.history.record({ source: this.source, point: savePoint(this.root) });
		this.markup = edit.markup;
		this.render(this.pointAt(edit.position));
		this.emit();
		if (spoken !== undefined) announce(spoken);
	}

	// -- Commands -------------------------------------------------------------

	toggleMark(format: '*' | '_') {
		const span = this.span();
		const name = format === '*' ? 'Bold' : 'Italic';
		if (span === undefined) return;
		if (
			span.collapsed ||
			span.start.line !== span.end.line ||
			span.start.block !== span.end.block
		) {
			// Formatting needs something to apply to, and the grammar cannot carry a mark across a
			// block boundary. Say so rather than doing nothing silently.
			announce(`Select text on one line to make it ${name.toLowerCase()}`);
			return;
		}
		const at = this.positionAt(span.start);
		const was = this.markedNow(format);
		this.apply(mark(this.markup, at, span.end.offset, format), `${name} ${was ? 'off' : 'on'}`);
	}

	setKind(kind: Kind) {
		const point = savePoint(this.root);
		if (point === undefined) return;
		this.apply(setKind(this.markup, this.positionAt(point), kind), Names[kind]);
	}

	insertSegments(segments: Segment[]) {
		const span = this.span();
		if (span === undefined) return;
		this.apply(insert(this.markup, this.positionAt(span.start), span.end.offset, segments));
	}

	undo() {
		const restored = this.history.undo({ source: this.source, point: savePoint(this.root) });
		if (restored === undefined) {
			announce('Nothing to undo');
			return;
		}
		this.restore(restored.source, restored.point, 'Undo');
	}

	redo() {
		const restored = this.history.redo({ source: this.source, point: savePoint(this.root) });
		if (restored === undefined) {
			announce('Nothing to redo');
			return;
		}
		this.restore(restored.source, restored.point, 'Redo');
	}

	private restore(source: string, point: Point | undefined, spoken: string) {
		this.markup = parseWithSpans(source).markup;
		this.render(point);
		this.emit();
		announce(spoken);
	}

	// -- State ----------------------------------------------------------------

	private markedNow(format: '*' | '_'): boolean {
		const span = this.span();
		if (span === undefined || span.collapsed) return false;
		if (span.start.block !== span.end.block || span.start.line !== span.end.line) return false;
		const block = this.markup.blocks[indexOf(span.start)];
		if (block === undefined) return false;
		const line = linesOf(block)[span.start.line];
		return line === undefined ? false : hasMark(line, span.start.offset, span.end.offset, format);
	}

	state(): State {
		const span = this.span();
		const block = span === undefined ? undefined : this.markup.blocks[indexOf(span.start)];
		return {
			bold: this.markedNow('*'),
			italic: this.markedNow('_'),
			kind: block === undefined ? 'paragraph' : kindOf(block),
			undoable: this.history.undoable,
			redoable: this.history.redoable,
			selected: span !== undefined && !span.collapsed
		};
	}

	// -- Events ---------------------------------------------------------------

	private onCompositionStart = () => {
		// Nothing may touch the DOM until this finishes. Anything that does desynchronizes the
		// input method's own buffer, and on Android that shows up as duplicated text.
		this.composing = true;
	};

	private onCompositionEnd = () => {
		this.composing = false;
		// Chrome fires a trailing input event after this, and some virtual keyboards mutate once
		// more, so settle on the next frame rather than reading a half finished state.
		const view = this.root.ownerDocument.defaultView;
		if (view) view.requestAnimationFrame(() => this.readBack());
		else this.readBack();
	};

	private onBeforeInput = (event: Event) => {
		const input = event as InputEvent;
		if (this.composing || composed(input.inputType)) return;

		const type = input.inputType;

		if (Unsupported.has(type)) {
			event.preventDefault();
			return;
		}

		switch (type) {
			case 'formatBold':
				event.preventDefault();
				this.toggleMark('*');
				return;
			case 'formatItalic':
				event.preventDefault();
				this.toggleMark('_');
				return;
			case 'insertParagraph':
			case 'insertLineBreak': {
				event.preventDefault();
				const span = this.span();
				if (span !== undefined)
					this.apply(split(this.markup, this.positionAt(span.start), this.positionAt(span.end)));
				return;
			}
			case 'historyUndo':
				event.preventDefault();
				this.undo();
				return;
			case 'historyRedo':
				event.preventDefault();
				this.redo();
				return;
			case 'insertFromPaste':
			case 'insertFromDrop':
				// Handled on the clipboard events, which carry the data this one does not.
				event.preventDefault();
				return;
			case 'deleteContentBackward': {
				const span = this.span();
				// Only the start of a line needs deciding: what joins to what, and whether backspace
				// backs out of a list rather than merging into the block above. Everywhere else the
				// browser already does the right thing, including deleting a whole reference.
				if (span === undefined || !span.collapsed || span.start.offset !== 0) break;
				event.preventDefault();
				this.apply(mergeBackward(this.markup, this.positionAt(span.start)));
				return;
			}
			default:
				break;
		}

		// Anything left is the browser's to do. Remember the state it is about to replace.
		this.history.record(
			{ source: this.source, point: savePoint(this.root) },
			{ typing: type.startsWith('insert') || type.startsWith('delete') }
		);
	};

	private onInput = () => {
		if (this.composing) return;
		this.readBack();
	};

	private onSelectionChange = () => {
		// What the toolbar shows depends on where the caret is, but only while this editor has it.
		if (this.root.ownerDocument.activeElement === this.root) this.report();
	};

	private onBlur = () => {
		this.history.seal();
	};

	private onDragStart = (event: Event) => {
		// Dragging a reference out of a line is more ways to go wrong than it is worth.
		const target = event.target;
		if (target instanceof Element && target.closest('[data-pill]') !== null) event.preventDefault();
	};

	private onKeyDown = (event: Event) => {
		const key = event as KeyboardEvent;
		const command = key.metaKey || key.ctrlKey;
		if (!command) return;

		// On many European layouts AltGr is Ctrl and Alt together, so Ctrl+Alt+2 is how someone
		// types an @. Taking that keystroke would make the editor unusable for them.
		if (key.getModifierState && key.getModifierState('AltGraph')) return;

		const lower = key.key.toLowerCase();

		if (key.altKey) {
			const kinds: Record<string, Kind> = { '0': 'paragraph', '1': 'heading1', '2': 'heading2' };
			const kind = kinds[key.key];
			if (kind !== undefined) {
				event.preventDefault();
				this.setKind(kind);
			}
			return;
		}

		if (key.shiftKey) {
			const kinds: Record<string, Kind> = { '7': 'numbered', '8': 'bullets', '9': 'quote' };
			const kind = kinds[key.key];
			if (kind !== undefined) {
				event.preventDefault();
				this.setKind(kind);
				return;
			}
			if (lower === 'z') {
				event.preventDefault();
				this.redo();
			} else if (lower === 'm' && this.options.onToggleSource !== undefined) {
				event.preventDefault();
				this.options.onToggleSource();
			}
			return;
		}

		if (lower === 'b') {
			event.preventDefault();
			this.toggleMark('*');
		} else if (lower === 'i') {
			event.preventDefault();
			this.toggleMark('_');
		} else if (lower === 'z') {
			event.preventDefault();
			this.undo();
		} else if (lower === 'y') {
			event.preventDefault();
			this.redo();
		}
	};

	// -- Clipboard ------------------------------------------------------------

	/*
	 * Copy and cut are left entirely to the browser. It gets both right: cutting across paragraphs
	 * joins the halves that remain, and what it puts on the clipboard as HTML carries formatting
	 * and references through a paste back in. Writing markup to the clipboard instead would mean
	 * cancelling the cut and reimplementing the deletion, to make an external paste say
	 * `a \*bold\* word` rather than `a bold word` -- and this markup is not meant to travel.
	 */

	private onPaste = (event: Event) => {
		const paste = event as ClipboardEvent;
		const data = paste.clipboardData;
		if (data === null) return;
		event.preventDefault();

		const html = data.getData('text/html');
		const text = data.getData('text/plain');

		// Something the size of a document is a mistake, not a paste.
		if (html.length > 200000 || text.length > 200000) {
			announce('That is too large to paste');
			return;
		}

		const pasted =
			html !== ''
				? markupFromHTML(html, this.root.ownerDocument, this.options.origin)
				: markupFromText(text);

		const span = this.span();
		if (span === undefined) return;
		this.apply(insertMarkup(this.markup, this.positionAt(span.start), span.end.offset, pasted));
	};
}
