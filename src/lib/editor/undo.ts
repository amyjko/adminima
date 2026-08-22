import type { Point } from './selection';

/**
 * Undo, owned outright rather than left to the browser.
 *
 * Canceling a beforeinput takes that operation out of the browser's own undo stack, so a document
 * edited partly by the browser and partly by us would undo incoherently: three characters, then a
 * jump past a bold toggle to a state from a minute ago. There is no way to interleave the two
 * correctly, so the browser's stack is turned off entirely and this one used instead.
 *
 * Entries are whole documents. These are comments and role descriptions — hundreds of bytes — so
 * snapshotting is both affordable and correct, where an inverse-operation stack is where weeks go.
 */

export type Snapshot = { source: string; point: Point | undefined };

/** How long a burst of typing keeps folding into one undo step. */
export const IdleMilliseconds = 400;

/** Beyond this, the oldest steps are forgotten. */
export const Cap = 200;

export default class History {
	private past: Snapshot[] = [];
	private future: Snapshot[] = [];
	/** When the last state was recorded, for folding a burst of typing into one step. */
	private recorded = 0;

	/**
	 * Remember the state a change is about to replace.
	 *
	 * Typing coalesces: a burst records once, at the start, so that undo steps back over a word
	 * rather than a letter. A command never coalesces, so bold is always its own step, and it also
	 * closes whatever burst preceded it.
	 */
	record(snapshot: Snapshot, { typing = false, now = Date.now() } = {}) {
		if (typing && this.recorded !== 0 && now - this.recorded < IdleMilliseconds) {
			this.recorded = now;
			return;
		}
		// A new change makes anything that was undone unreachable.
		this.future = [];
		this.past.push(snapshot);
		if (this.past.length > Cap) this.past.shift();
		this.recorded = typing ? now : 0;
	}

	/** End a burst of typing, so the next keystroke starts a new step. Blur, or a command. */
	seal() {
		this.recorded = 0;
	}

	undo(current: Snapshot): Snapshot | undefined {
		const previous = this.past.pop();
		if (previous === undefined) return undefined;
		this.future.push(current);
		this.recorded = 0;
		return previous;
	}

	redo(current: Snapshot): Snapshot | undefined {
		const next = this.future.pop();
		if (next === undefined) return undefined;
		this.past.push(current);
		this.recorded = 0;
		return next;
	}

	get undoable(): boolean {
		return this.past.length > 0;
	}

	get redoable(): boolean {
		return this.future.length > 0;
	}
}
