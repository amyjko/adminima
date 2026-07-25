import { execFileSync } from 'node:child_process';

/**
 * Command line parsing shared by restore.js and snapshot.js.
 *
 * The one rule worth stating: a connection is never inferred. There is no default, no fallback,
 * and nothing in restore/ reads a .env file. That is not caution for its own sake -- `npm run stop`
 * does `cp .env.prod .env`, so .env points at PRODUCTION whenever the local stack is down. A tool
 * that reads .env to find its target would eventually write to production believing it was local.
 * This one cannot, because it never opens the file.
 */

/** Flags that take no value. */
const BOOLEANS = new Set(['apply', 'yes', 'help']);

/** Flags that may be given more than once. */
const REPEATABLE = new Set(['org', 'table', 'id']);

/** Parse argv into a flag bag, erroring on anything unrecognised. */
export function parse(argv, allowed) {
	const args = argv.slice(2);
	/** @type {Record<string, any>} */
	const flags = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg.startsWith('--')) {
			throw new Error(`unexpected argument "${arg}" -- every option starts with --`);
		}
		const name = arg.slice(2);
		if (!allowed.has(name)) {
			throw new Error(`unknown option "--${name}"`);
		}
		if (BOOLEANS.has(name)) {
			flags[name] = true;
			continue;
		}
		const value = args[++i];
		if (value === undefined || value.startsWith('--')) {
			throw new Error(`--${name} needs a value`);
		}
		if (REPEATABLE.has(name)) {
			(flags[name] ??= []).push(value);
		} else if (name in flags) {
			throw new Error(`--${name} was given more than once`);
		} else {
			flags[name] = value;
		}
	}
	return flags;
}

/**
 * Resolve one connection from either --x or --x-env, requiring exactly one.
 *
 * --x-env is the documented form for production: a connection string passed directly on the
 * command line lands in shell history and is visible in `ps` output, password and all.
 */
export function connectionFrom(flags, name) {
	const direct = flags[name];
	const fromEnv = flags[`${name}-env`];

	if (direct && fromEnv) {
		throw new Error(`give either --${name} or --${name}-env, not both`);
	}
	if (direct) return direct;
	if (fromEnv) {
		const value = process.env[fromEnv];
		if (!value) {
			throw new Error(`--${name}-env names ${fromEnv}, but that variable is not set`);
		}
		return value;
	}
	throw new Error(
		`--${name} or --${name}-env is required. Connections are never inferred -- note that ` +
			`\`npm run stop\` points .env at production, so nothing here reads .env.`
	);
}

/** Parse `--id table:uuid` into the per-table id lists the diff uses to scope itself. */
export function parseIds(values) {
	/** @type {Record<string, string[]>} */
	const byTable = {};
	for (const value of values ?? []) {
		const [table, id] = value.split(':');
		if (!table || !id) {
			throw new Error(`--id must look like table:uuid, got "${value}"`);
		}
		(byTable[table] ??= []).push(id);
	}
	return byTable;
}

/**
 * Refuse to write anywhere git would track.
 *
 * Dumps and generated restore scripts contain member names and email addresses, and this
 * repository is public. .gitignore already covers backups/, but this survives someone
 * reorganising that file, and it catches --out pointing somewhere else entirely.
 */
export function assertIgnored(directory) {
	try {
		execFileSync('git', ['check-ignore', '-q', directory], { stdio: 'ignore' });
	} catch {
		throw new Error(
			`refusing to write to ${directory}: git does not ignore it.\n` +
				`These files contain member names and email addresses, and this repository is ` +
				`public. Write to backups/ instead, or add this path to .gitignore.`
		);
	}
}
