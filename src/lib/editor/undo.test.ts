import { test, expect } from 'vitest';
import History, { IdleMilliseconds, Cap, type Snapshot } from './undo';

function snapshot(source: string): Snapshot {
	return { source, point: undefined };
}

test('undo steps back through changes, and redo forward again', () => {
	const history = new History();
	history.record(snapshot('one'));
	history.record(snapshot('two'));

	expect(history.undo(snapshot('three'))?.source).toBe('two');
	expect(history.undo(snapshot('two'))?.source).toBe('one');
	expect(history.undo(snapshot('one'))).toBeUndefined();

	expect(history.redo(snapshot('one'))?.source).toBe('two');
	expect(history.redo(snapshot('two'))?.source).toBe('three');
	expect(history.redo(snapshot('three'))).toBeUndefined();
});

test('a burst of typing is one step, not one step per letter', () => {
	const history = new History();
	let now = 1000;
	history.record(snapshot('h'), { typing: true, now });
	for (const source of ['he', 'hel', 'hell', 'hello'])
		history.record(snapshot(source), { typing: true, now: (now += 50) });

	expect(history.undo(snapshot('hello'))?.source).toBe('h');
	expect(history.undoable).toBe(false);
});

test('typing again after a pause starts a new step', () => {
	const history = new History();
	let now = 1000;
	history.record(snapshot('one'), { typing: true, now });
	history.record(snapshot('one two'), { typing: true, now: (now += IdleMilliseconds + 1) });

	expect(history.undo(snapshot('one two three'))?.source).toBe('one two');
	expect(history.undo(snapshot('one two'))?.source).toBe('one');
});

test('a command is always its own step, and ends the burst before it', () => {
	const history = new History();
	const now = 1000;
	history.record(snapshot('plain'), { typing: true, now });
	// Bold, immediately after typing and well inside the coalescing window.
	history.record(snapshot('plain'), { now: now + 10 });
	history.record(snapshot('*plain*'), { typing: true, now: now + 20 });

	expect(history.undo(snapshot('*plain* more'))?.source).toBe('*plain*');
	expect(history.undo(snapshot('*plain*'))?.source).toBe('plain');
});

test('sealing ends a burst, so the next keystroke starts a step', () => {
	const history = new History();
	const now = 1000;
	history.record(snapshot('a'), { typing: true, now });
	history.seal();
	history.record(snapshot('ab'), { typing: true, now: now + 10 });

	expect(history.undo(snapshot('abc'))?.source).toBe('ab');
	expect(history.undo(snapshot('ab'))?.source).toBe('a');
});

test('changing something after undoing makes the redo unreachable', () => {
	const history = new History();
	history.record(snapshot('one'));
	history.undo(snapshot('two'));
	expect(history.redoable).toBe(true);

	history.record(snapshot('one'));
	expect(history.redoable).toBe(false);
});

test('the oldest steps are forgotten rather than kept forever', () => {
	const history = new History();
	for (let index = 0; index < Cap + 50; index++) history.record(snapshot(`${index}`));

	let steps = 0;
	let current = snapshot('last');
	while (history.undoable) {
		current = history.undo(current)!;
		steps++;
	}
	expect(steps).toBe(Cap);
	// The oldest 50 are gone; what remains starts where the cap starts.
	expect(current.source).toBe('50');
});
