import fs from 'node:fs';
import pg from 'pg';
import { assertSchemaMatches, assertNullability } from './schema.js';

/**
 * Connecting to a database, and refusing to proceed when the connection cannot do the job.
 *
 * Everything here exists because of a failure mode that is silent rather than loud. The restore
 * tooling talks to Postgres directly rather than through PostgREST for four reasons, and three of
 * them are silent failures:
 *
 *   1. PostgREST truncates reads at `max_rows` (1000, see supabase/config.toml) without saying so.
 *   2. A write filtered by row level security reports success while inserting zero rows.
 *   3. PostgREST cannot disable a trigger, which the profile restore requires.
 *   4. PostgREST cannot hold a multi-statement transaction.
 *
 * If you are ever tempted to port this to @supabase/supabase-js, re-read that list first.
 */

/**
 * A connection string, with the password removed, safe to print.
 *
 * Nothing in this tool ever prints a raw connection string -- not in logs, not in errors, not in
 * the generated SQL. Production credentials end up in scrollback and in bug reports otherwise.
 */
export function describe(url) {
	try {
		const parsed = new URL(url);
		const port = parsed.port || '5432';
		const database = parsed.pathname.replace(/^\//, '') || 'postgres';
		return `${parsed.hostname}:${port}/${database}`;
	} catch {
		return '<unparseable connection string>';
	}
}

/** True for a database on this machine, which does not need TLS. */
function isLocal(hostname) {
	return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

/**
 * Open a connection, or throw with an explanation of what to do instead.
 *
 * Remote connections verify the server certificate. There is deliberately no flag to turn that
 * off: this connection carries a database password, and a `rejectUnauthorized: false` escape hatch
 * added "just for now" is how that becomes permanent.
 */
export async function connect(url, { ca, label } = {}) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`${label ?? 'connection'}: not a valid postgres:// connection string`);
	}

	// The transaction pooler does not keep session state across statements, so ALTER TABLE
	// ... DISABLE TRIGGER and the single-transaction envelope would misbehave in ways that are
	// hard to spot after the fact. Refuse it rather than half-work.
	if (parsed.port === '6543') {
		throw new Error(
			`${label ?? 'connection'} points at port 6543, the transaction pooler, which does not ` +
				`hold session state across statements. Use the direct connection or the session ` +
				`pooler (port 5432) from Dashboard -> Connect.`
		);
	}

	/*
	 * The session pooler's username is postgres.<project-ref>, which is easy to paste into the
	 * database's place at the end of the string instead. Postgres then reports that a database of
	 * that name does not exist, and the search goes looking for a missing database rather than for
	 * a username in the wrong half of the connection string.
	 */
	const database = parsed.pathname.replace(/^\//, '');
	if (/^postgres\.\w/.test(database)) {
		throw new Error(
			`${label ?? 'connection'} names a database of "${database}", which looks like the session ` +
				`pooler's username in the database's place. The username goes before the @ and the ` +
				`database after the host:\n` +
				`  postgresql://${database}:PASSWORD@${parsed.hostname}:${parsed.port || '5432'}/postgres`
		);
	}

	const local = isLocal(parsed.hostname);
	/** @type {import('pg').ClientConfig} */
	const config = { connectionString: url };
	if (!local) {
		config.ssl = { rejectUnauthorized: true };
		if (ca) {
			if (!fs.existsSync(ca)) throw new Error(`certificate file not found: ${ca}`);
			config.ssl.ca = fs.readFileSync(ca, 'utf8');
		}
	}

	const client = new pg.Client(config);
	try {
		await client.connect();
	} catch (error) {
		const message = String(error?.message ?? error);
		if (/self.signed|unable to verify|certificate/i.test(message)) {
			throw new Error(
				`${label ?? 'connection'} (${describe(url)}): TLS verification failed -- ${message}\n` +
					`Download the project's CA certificate from Dashboard -> Settings -> Database and ` +
					`pass it with --ca <path>. Do not disable certificate verification.`
			);
		}
		// A direct connection host resolves to IPv6 only unless the project has the IPv4 add-on, so
		// on a network without IPv6 it fails here rather than anywhere informative. Saying so is
		// worth more than the raw resolver error, since this is read during an emergency.
		if (/ENOTFOUND|EAI_AGAIN/i.test(message) && /^db\./.test(parsed.hostname)) {
			throw new Error(
				`${label ?? 'connection'} (${describe(url)}): ${message}\n` +
					`${parsed.hostname} is a direct connection host, which resolves to IPv6 only unless ` +
					`the project has the IPv4 add-on. Use the session pooler instead: Dashboard -> ` +
					`Connect -> Session pooler, on port 5432. Note its username is postgres.<project-ref> ` +
					`rather than postgres.`
			);
		}
		throw new Error(`${label ?? 'connection'} (${describe(url)}): ${message}`);
	}
	return client;
}

/**
 * Throw unless this connection can actually write past row level security.
 *
 * None of the tables set FORCE ROW LEVEL SECURITY, so the owner bypasses RLS by ownership. A
 * connection as anything else does not, and PostgREST-style silent zero-row writes are exactly
 * what this tool cannot afford. Better to fail on the first query than to report a successful
 * restore that wrote nothing.
 */
export async function assertOwner(client, label) {
	const { rows } = await client.query(`
		select
			current_user as who,
			pg_get_userbyid(c.relowner) as owner
		from pg_class c
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relname = 'orgs'
	`);

	if (rows.length === 0) {
		throw new Error(`${label}: no public.orgs table here -- is this the right database?`);
	}
	const { who, owner } = rows[0];
	if (who !== owner) {
		throw new Error(
			`${label}: connected as "${who}", but public.orgs is owned by "${owner}".\n` +
				`Row level security would filter these writes, and they would report success while ` +
				`inserting zero rows. Use the postgres connection string.`
		);
	}
}

/** Server major version, for comparing the two ends of a restore. */
export async function majorVersion(client) {
	const { rows } = await client.query('show server_version');
	return String(rows[0].server_version).split('.')[0];
}

/**
 * Everything that must be true before a connection is used for real work.
 *
 * Runs against both ends of a restore. The schema and nullability assertions are what stop a
 * migration from quietly invalidating the manifest.
 */
export async function preflight(client, label) {
	await assertOwner(client, label);
	await assertSchemaMatches(client, label);
	await assertNullability(client, label);
}
