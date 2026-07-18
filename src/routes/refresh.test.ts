import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The coalescing behavior of `refresh`, exercised without a browser or a database.
 *
 * Unchecking a task with many subtasks fires one mutation per subtask, so without coalescing each
 * would trigger its own full reload.
 */

let invalidateCalls = 0;
let resolveInvalidate: (() => void) | null = null;

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({
	invalidateAll: () => {
		invalidateCalls++;
		return new Promise<void>((resolve) => {
			resolveInvalidate = resolve;
		});
	}
}));

const { refresh } = await import('./errors.svelte');

beforeEach(() => {
	invalidateCalls = 0;
	resolveInvalidate = null;
});

describe('refresh coalescing', () => {
	it('collapses concurrent refreshes into one reload, plus one catch-up', async () => {
		// Ten mutations land at once, as "uncheck all" does across a subtask tree.
		const all = Promise.all(Array.from({ length: 10 }, () => refresh()));

		// Only the first started a reload; the other nine are waiting on it.
		expect(invalidateCalls).toBe(1);

		// Finish it. Because others asked while it ran, exactly one more runs so that no caller
		// settles on data older than its own write.
		resolveInvalidate?.();
		await vi.waitFor(() => expect(invalidateCalls).toBe(2));

		resolveInvalidate?.();
		await all;

		// Ten callers, two reloads — not ten.
		expect(invalidateCalls).toBe(2);
	});

	it('starts a fresh reload once the previous one has settled', async () => {
		const first = refresh();
		expect(invalidateCalls).toBe(1);
		resolveInvalidate?.();
		await first;

		const second = refresh();
		expect(invalidateCalls).toBe(2);
		resolveInvalidate?.();
		await second;
	});
});
