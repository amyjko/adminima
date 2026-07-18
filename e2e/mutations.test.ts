import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards against mutation call sites that skip the `mutate` wrapper.
 *
 * `mutate` is what reports the error and reloads the page's data on success. A mutation called
 * without it still reaches the database, but the UI only updates if a realtime notification
 * arrives — and when one doesn't, the change silently fails to appear. That is exactly the class of
 * bug this guard exists to prevent from coming back.
 *
 * This reads source files only; it needs no database.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const organizationSource = readFileSync(join(root, 'src/database/Organization.ts'), 'utf8');

/**
 * Call sites that legitimately don't wrap, each with the reason.
 * Keyed `<path>:<method>`.
 */
const ALLOWED_UNWRAPPED = new Map<string, string>([
	// Wrapped downstream: CommentView calls mutate() on the `remove` prop it is handed.
	['src/routes/org/[orgid]/+page.svelte:deleteComment', 'wrapped downstream in CommentView'],
	[
		'src/routes/org/[orgid]/change/[changeid]/+page.svelte:deleteComment',
		'wrapped downstream in CommentView'
	],
	[
		'src/routes/org/[orgid]/role/[roleid]/+page.svelte:deleteComment',
		'wrapped downstream in CommentView'
	],
	[
		'src/routes/org/[orgid]/process/[processid]/+page.svelte:deleteComment',
		'wrapped downstream in CommentView'
	]
]);

/**
 * Every mutating method, identified by returning a MutationResult. Deriving this from the return
 * type rather than a hand-written list means a new mutation is covered the moment it is written.
 */
function mutatingMethods(): string[] {
	const names = new Set<string>();
	const pattern = /^\t(?:static\s+)?(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*\(/gm;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(organizationSource)) !== null) {
		// The signature runs from the method name to the brace that opens its body.
		const signature = organizationSource.slice(match.index, match.index + 600).split(/\{\s*\n/)[0];
		if (/Promise<MutationResult/.test(signature)) names.add(match[1]);
	}
	return [...names];
}

/** Every .svelte file under src/. */
function svelteFiles(dir: string, found: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) svelteFiles(full, found);
		else if (entry.endsWith('.svelte')) found.push(full);
	}
	return found;
}

describe('mutation call sites', () => {
	it('finds the mutating methods to check', () => {
		// A sanity check on the detection itself: if the regex stops matching, every other assertion
		// here would vacuously pass.
		const methods = mutatingMethods();
		expect(methods.length).toBeGreaterThan(40);
		expect(methods).toContain('updateHowDone');
		expect(methods).toContain('createRole');
	});

	it('wraps every mutating db call in mutate()', () => {
		const methods = mutatingMethods();
		const offenders: string[] = [];

		for (const file of svelteFiles(join(root, 'src'))) {
			const source = readFileSync(file, 'utf8');
			const path = relative(root, file);

			for (const method of methods) {
				const pattern = new RegExp(`db\\.${method}\\s*\\(`, 'g');
				let match: RegExpExecArray | null;
				while ((match = pattern.exec(source)) !== null) {
					if (ALLOWED_UNWRAPPED.has(`${path}:${method}`)) continue;

					// Accept `mutate(db.foo(` with any whitespace or newlines between.
					const before = source.slice(Math.max(0, match.index - 60), match.index);
					if (!/mutate\(\s*$/.test(before)) offenders.push(`${path}:${method}`);
				}
			}
		}

		expect(
			[...new Set(offenders)].sort(),
			`These mutations are not wrapped in mutate(), so they will not refresh the page on success:\n${[...new Set(offenders)].sort().join('\n')}`
		).toEqual([]);
	});

	it('does not allow exemptions for call sites that no longer exist', () => {
		const stale: string[] = [];

		for (const key of ALLOWED_UNWRAPPED.keys()) {
			const [path, method] = key.split(/:(?=[^:]*$)/);
			let source: string;
			try {
				source = readFileSync(join(root, path), 'utf8');
			} catch {
				stale.push(`${key} (file is gone)`);
				continue;
			}
			if (!new RegExp(`db\\.${method}\\s*\\(`).test(source)) stale.push(`${key} (call is gone)`);
		}

		expect(stale, `Stale exemptions: ${stale.join(', ')}`).toEqual([]);
	});
});
