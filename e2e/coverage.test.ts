import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guards the e2e suite's completeness.
 *
 * Every method on Organization that touches the database must be exercised somewhere in e2e/.
 * If someone adds a new CRUD method and no test references it, this fails and names it — so the
 * suite can't quietly fall behind the API it's meant to cover.
 */

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '../src/database/Organization.ts'), 'utf8');

/** Methods that never touch the database: pure helpers, realtime plumbing, and client wiring. */
const NON_DATABASE = new Set([
	'constructor',
	'setSupabaseClient',
	'notify',
	'listen',
	'ignore',
	'reconnect',
	'signOut',
	'getPath',
	'getAdmins',
	'hasAdminProfile',
	'getAdminCount',
	'getRoleByID',
	'getRoleProfiles',
	'getRoleProcesses',
	'getPersonRoles',
	'getProfileWithEmail',
	'getProfileWithPersonID',
	'getPersonNameOrEmail',
	'getProfileWithNameOrEmail',
	'getProfileWithID',
	'getProfileRoles',
	'getTeamRoles',
	'getProcessHows',
	'getHowParent',
	'getHow',
	'queryTeamRoles'
]);

/** Every method declared on the Organization class. */
function declaredMethods(): string[] {
	const names = new Set<string>();
	// Matches `async foo(`, `static async foo(`, `static foo(`, and `foo(` at one level of indent.
	const pattern = /^\t(?:static\s+)?(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*\(/gm;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(source)) !== null) names.add(match[1]);
	return [...names];
}

/**
 * Everything the e2e suite references, as one blob. Includes the harness, which exercises some
 * methods (createOrganization, addPersonByEmail) as part of building every test's fixture.
 */
function suiteText(): string {
	return readdirSync(here)
		.filter((f) => (f.endsWith('.test.ts') || f === 'harness.ts') && f !== 'coverage.test.ts')
		.map((f) => readFileSync(join(here, f), 'utf8'))
		.join('\n');
}

describe('e2e coverage', () => {
	it('exercises every database-touching Organization method', () => {
		const tests = suiteText();
		const uncovered = declaredMethods()
			.filter((name) => !NON_DATABASE.has(name))
			// A method counts as covered when a test calls it by name (`db.foo(` or `Organization.foo(`).
			.filter((name) => !new RegExp(`\\.${name}\\s*\\(`).test(tests));

		expect(uncovered, `Uncovered database methods: ${uncovered.join(', ')}`).toEqual([]);
	});

	it('does not exempt methods that no longer exist', () => {
		const declared = new Set(declaredMethods());
		const stale = [...NON_DATABASE].filter((name) => !declared.has(name));
		expect(stale, `Exemptions for methods that are gone: ${stale.join(', ')}`).toEqual([]);
	});
});
