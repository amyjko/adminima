import type { PostgrestError } from '@supabase/supabase-js';
import type { MutationResult } from '$database/Organization';
import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';

export type DBError = { message: string; error: PostgrestError | undefined };
export let errors = $state<DBError[]>([]);

export function addError(message: string, error?: PostgrestError) {
	errors.push({ message, error });
}

/** The refresh currently running, if any, and whether another was asked for while it ran. */
let refreshing: Promise<void> | null = null;
let refreshAgain = false;

/**
 * Reload the current route's data, coalescing concurrent requests.
 *
 * Several mutations can land at once — unchecking a task with many subtasks fires one per subtask —
 * and a full reload per mutation would be wasteful. While a reload is in flight, additional callers
 * wait on it rather than starting their own; if any arrived mid-flight, exactly one more runs
 * afterward so nobody sees data older than their own write.
 */
export function refresh(): Promise<void> {
	if (!browser) return Promise.resolve();

	if (refreshing) {
		refreshAgain = true;
		return refreshing;
	}

	refreshing = (async () => {
		try {
			do {
				refreshAgain = false;
				await invalidateAll();
			} while (refreshAgain);
		} finally {
			refreshing = null;
			refreshAgain = false;
		}
	})();

	return refreshing;
}

/**
 * Run a mutation, report any error, and reload the page's data on success.
 *
 * Every mutating call should go through this: it's what keeps the UI correct when a realtime
 * notification is delayed or never arrives. `e2e/mutations.test.ts` fails if a component calls a
 * mutating method without it.
 *
 * Pass `refresh: false` when the caller navigates away on success — reloading data for something
 * that was just deleted, or for a path that just changed, would fail before the navigation happens.
 */
export async function mutate<T>(
	query: Promise<MutationResult<T>>,
	message: string,
	options?: { refresh?: boolean }
): Promise<MutationResult<T>> {
	const result = await query;

	if (result.error) {
		addError(message, result.error);
		return result;
	}

	if (options?.refresh !== false) await refresh();
	return result;
}
