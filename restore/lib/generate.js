import {
	columnsOf,
	fetchTuples,
	insertStatement,
	referenceUpdate,
	relinkProfiles,
	withTriggerDisabled
} from './sql.js';
import { TABLES } from './schema.js';

/**
 * Turning a set of rows into a runnable script.
 *
 * Shared by snapshot.js and restore.js so there is exactly one output format. A snapshot is
 * therefore itself a replayable restore script, and can be loaded into a scratch database to serve
 * as the source of a later diff -- which keeps one mental model throughout: the diff source is
 * always a database, never a file.
 */

/** Which tables can be filtered by organization, and on which column. */
function orgColumn(entry) {
	if (entry.name === 'orgs') return 'id';
	// invites belong to no organization -- `who` is a person id with no foreign key behind it.
	if (entry.name === 'invites') return null;
	return 'orgid';
}

/**
 * Primary keys for the rows a script should cover.
 *
 * Returns scalars for a single-column key and tuples for the composite one (assignments).
 */
export async function selectKeys(client, entry, { orgIds, ids } = {}) {
	const columns = entry.key.map((k) => `"${k}"`).join(', ');
	const conditions = [];
	const params = [];

	if (orgIds?.length) {
		const column = orgColumn(entry);
		if (!column) return [];
		params.push(orgIds);
		conditions.push(`"${column}" = any($${params.length}::uuid[])`);
	}
	if (ids?.length) {
		if (entry.key.length > 1) {
			throw new Error(`--id cannot address ${entry.name}: it has a composite key`);
		}
		params.push(ids);
		conditions.push(`"${entry.key[0]}" = any($${params.length}::uuid[])`);
	}

	const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
	const { rows } = await client.query(
		`select ${columns} from public."${entry.name}" ${where}`,
		params
	);
	return rows.map((row) =>
		entry.key.length === 1 ? row[entry.key[0]] : entry.key.map((k) => row[k])
	);
}

/** Rows keyed by primary key, for labelling and for comparing values. */
export async function fetchRows(client, entry, keyValues) {
	if (keyValues.length === 0) return new Map();
	const labelColumns = [...new Set([...entry.key, ...entry.label, 'id'])]
		.filter(Boolean)
		.map((c) => `"${c}"`)
		.join(', ');
	const params = entry.key.map((_, i) => keyValues.map((v) => (Array.isArray(v) ? v[i] : v)));
	const predicate = entry.key.map((k, i) => `"${k}" = any($${i + 1}::uuid[])`).join(' and ');
	const { rows } = await client.query(
		`select ${labelColumns} from public."${entry.name}" where ${predicate}`,
		params
	);
	const map = new Map();
	for (const row of rows) {
		map.set(entry.key.map((k) => row[k]).join(':'), row);
	}
	return map;
}

/** The columns whose value must be withheld at insert time and set by a later UPDATE. */
export function deferredColumns(entry) {
	return entry.fks.filter((fk) => fk.onMissing === 'defer').map((fk) => fk.column);
}

/**
 * The INSERT block for one table, plus the deferred references it could not carry.
 *
 * `extraNulls` lets the caller withhold a nullable reference whose referent does not exist in the
 * target, so the insert cannot fail on a foreign key. Repair pass 3 puts it back if the referent
 * ever returns.
 */
export async function tableScript(client, entry, keyValues, { extraNulls, columns: only } = {}) {
	if (keyValues.length === 0) return { insert: '', deferred: {} };

	const all = await columnsOf(client, entry.name);
	// `only` is the intersection of the two schemas, used when the backup predates a migration.
	const columns = only ? all.filter((c) => only.includes(c.name)) : all;
	const deferred = deferredColumns(entry);
	const nullColumns = new Set([...deferred, ...(extraNulls ?? [])]);

	const tuples = await fetchTuples(client, entry.name, columns, entry.key, keyValues, {
		nullColumns
	});
	const insert = insertStatement(
		entry.name,
		columns.map((c) => c.name),
		tuples,
		entry.key
	);

	// Read the withheld values so they can be applied once their referents exist.
	const pairs = {};
	for (const column of nullColumns) {
		const params = entry.key.map((_, i) => keyValues.map((v) => (Array.isArray(v) ? v[i] : v)));
		const predicate = entry.key.map((k, i) => `"${k}" = any($${i + 1}::uuid[])`).join(' and ');
		const { rows } = await client.query(
			`select "id", "${column}" as value from public."${entry.name}"
			 where ${predicate} and "${column}" is not null`,
			params
		);
		if (rows.length > 0) pairs[column] = rows.map((r) => [r.id, r.value]);
	}

	return { insert, deferred: pairs };
}

/** The UPDATE statements that close the deferred references, in the order they become valid. */
export function deferredStatements(deferredByTable) {
	const statements = [];
	for (const entry of TABLES) {
		const pairs = deferredByTable[entry.name];
		if (!pairs) continue;
		for (const [column, values] of Object.entries(pairs)) {
			const fk = entry.fks.find((f) => f.column === column);
			if (!fk || values.length === 0) continue;
			const note =
				entry.name === 'processes' && column === 'howid'
					? 'processes.howid points at a root how and hows.processid points back, so each ' +
						'process was inserted with a null howid. See supabase/seed.sql.'
					: entry.name === 'profiles' && column === 'supervisor'
						? 'profiles.supervisor is self-referential, so it could not be set at insert time.'
						: undefined;
			statements.push(referenceUpdate(entry.name, column, values, fk.ref, { note }));
		}
	}
	return statements.filter(Boolean);
}

/**
 * Assemble a complete, runnable transaction.
 *
 * One `begin`/`commit` around everything: a restore is all-or-nothing, so a failure part-way
 * through leaves the target exactly as it was rather than half-repaired.
 */
export function assemble({ header, inserts, deferred, repairs }) {
	const body = [];

	// Profile inserts run with on_profile_create disabled, then profiles are relinked explicitly.
	// The trigger rewrites personid from the email, which re-derives the link instead of restoring
	// the one the backup recorded.
	for (const { table, sql } of inserts) {
		if (!sql) continue;
		body.push(
			table === 'profiles' ? withTriggerDisabled('profiles', 'on_profile_create', sql) : sql
		);
	}

	body.push(...deferred);
	if (inserts.some(({ table, sql }) => table === 'profiles' && sql)) {
		body.push(relinkProfiles());
	}
	body.push(...(repairs ?? []));

	if (body.length === 0) return `${header}\n\n-- Nothing to do.\n`;
	return `${header}\n\nbegin;\n\n${body.join('\n\n')}\n\ncommit;\n`;
}
