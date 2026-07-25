/**
 * The shape of the `public` schema, as the restore tooling needs to understand it.
 *
 * Two things live here: a hand-written manifest of every restorable table in foreign-key
 * insertion order, and an assertion that checks the manifest against the live catalog. The
 * manifest is hand-written because insertion order and the "what do we do when a referent is
 * missing" policy are judgement calls that introspection cannot make. It is checked against the
 * catalog because a migration that adds a foreign key would otherwise leave this file quietly
 * wrong, and the failure would surface as a corrupted restore during an outage rather than as an
 * error on an ordinary dry run.
 *
 * This is the same anti-rot discipline `e2e/coverage.test.ts` applies to its exemption set.
 */

/**
 * What to do when a foreign key's referent is absent from both databases.
 *
 * - `skip-row`  the column is NOT NULL, so the row cannot be inserted at all. Report and skip it.
 * - `null`      the column is nullable. Insert without it; repair pass 3 restores the pointer
 *               later if the referent comes back.
 * - `defer`     the reference participates in a cycle (or points at its own table), so it is
 *               always inserted as NULL and set by a follow-up UPDATE.
 */

/**
 * Every restorable table, in foreign-key insertion order.
 *
 * `people` is deliberately absent. Its primary key is a foreign key to `auth.users`, so a person
 * cannot be recreated without recreating the account, and accounts are out of scope. Rows that
 * reference a missing person are skipped and named in the report instead.
 *
 * `repair: true` marks a nullable scalar reference that `ON DELETE SET NULL` can silently blank on
 * a row that itself survived. Those are invisible to a row-level diff -- see restore.js pass 3.
 */
export const TABLES = [
	{
		name: 'orgs',
		key: ['id'],
		label: ['name'],
		fks: [],
		arrays: [
			{ column: 'comments', ref: 'comments' },
			{ column: 'authorized', ref: 'roles' }
		]
	},
	{
		name: 'profiles',
		key: ['id'],
		label: ['name', 'email'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'personid', ref: 'people', onMissing: 'null', repair: true },
			// Self-referential, so it cannot be satisfied at insert time in any ordering.
			{ column: 'supervisor', ref: 'profiles', onMissing: 'defer', repair: true }
		],
		arrays: []
	},
	{
		name: 'teams',
		key: ['id'],
		label: ['name'],
		fks: [{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' }],
		arrays: [{ column: 'comments', ref: 'comments' }]
	},
	{
		name: 'roles',
		key: ['id'],
		label: ['title'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'team', ref: 'teams', onMissing: 'null', repair: true }
		],
		arrays: [{ column: 'comments', ref: 'comments' }]
	},
	{
		name: 'processes',
		key: ['id'],
		label: ['title'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'accountable', ref: 'roles', onMissing: 'null', repair: true },
			// processes.howid -> hows.id and hows.processid -> processes.id reference each other,
			// and hows.processid is NOT NULL, so the cycle can only be broken from this side.
			// supabase/seed.sql does exactly this: insert the process with a null howid, insert the
			// root how, then update. The generated SQL cites that file.
			{ column: 'howid', ref: 'hows', onMissing: 'defer' }
		],
		arrays: [{ column: 'comments', ref: 'comments' }]
	},
	{
		name: 'hows',
		key: ['id'],
		label: ['what'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'processid', ref: 'processes', onMissing: 'skip-row' }
		],
		arrays: [
			// The entire step tree lives in this array -- there is no parent foreign key -- so its
			// ORDER is meaning, not incidental. Repairs must restore a step to its original index.
			{ column: 'how', ref: 'hows', ordered: true },
			{ column: 'responsible', ref: 'roles' },
			{ column: 'consulted', ref: 'roles' },
			{ column: 'informed', ref: 'roles' },
			{ column: 'authorized', ref: 'roles' }
		]
	},
	{
		name: 'assignments',
		// No id column at all; the primary key is a composite over these two. Note orgid is NOT
		// part of it, so an assignment is identified only by which role and which profile.
		key: ['roleid', 'profileid'],
		label: [],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'roleid', ref: 'roles', onMissing: 'skip-row' },
			{ column: 'profileid', ref: 'profiles', onMissing: 'skip-row' }
		],
		arrays: []
	},
	{
		name: 'suggestions',
		key: ['id'],
		label: ['what'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			// Declared `on delete set null` against a NOT NULL column, so it can never actually
			// fire -- it blocks the delete instead. Either way the author must exist to restore.
			{ column: 'who', ref: 'people', onMissing: 'skip-row' },
			{ column: 'lead', ref: 'profiles', onMissing: 'null', repair: true }
		],
		arrays: [
			{ column: 'comments', ref: 'comments' },
			{ column: 'processes', ref: 'processes' },
			{ column: 'roles', ref: 'roles' },
			{ column: 'authorized', ref: 'roles' }
			// `watchers` is intentionally unmapped: nothing in src/ reads it, so there is no
			// referent we can validate against and no user-visible consequence to repairing it.
		]
	},
	{
		name: 'comments',
		key: ['id'],
		label: ['what'],
		fks: [
			{ column: 'orgid', ref: 'orgs', onMissing: 'skip-row' },
			{ column: 'who', ref: 'people', onMissing: 'skip-row' }
		],
		arrays: []
	},
	{
		name: 'invites',
		key: ['id'],
		label: [],
		// `who` holds a person id but has no foreign key backing it, so there is nothing to check.
		fks: [],
		arrays: []
	}
];

/** Tables that exist but are never restored, with the reason, for the drift check and reports. */
export const EXCLUDED = {
	people: 'primary key is a foreign key to auth.users; accounts are out of scope'
};

/** The manifest entry for a table, or undefined if it is not restorable. */
export function tableNamed(name) {
	return TABLES.find((t) => t.name === name);
}

/** Every nullable scalar reference that ON DELETE SET NULL can silently blank. */
export function repairableScalars() {
	return TABLES.flatMap((t) =>
		t.fks.filter((fk) => fk.repair).map((fk) => ({ table: t.name, ...fk }))
	);
}

/** Foreign keys the live database actually has, deduplicated by (table, column, referent). */
async function liveForeignKeys(client) {
	// Several constraints are declared more than once in the migrations -- roles.orgid twice,
	// hows.processid three times -- so identical rows come back repeatedly. Dedupe by identity
	// rather than by constraint name.
	const { rows } = await client.query(`
		select distinct
			src.relname as table_name,
			att.attname as column_name,
			tgt.relname as ref_table,
			c.confdeltype as on_delete
		from pg_constraint c
		join pg_class src on src.oid = c.conrelid
		join pg_class tgt on tgt.oid = c.confrelid
		join pg_namespace n on n.oid = src.relnamespace
		join unnest(c.conkey) as k(attnum) on true
		join pg_attribute att on att.attrelid = src.oid and att.attnum = k.attnum
		where c.contype = 'f' and n.nspname = 'public'
	`);
	return rows;
}

/** Every uuid[] column in public, which is where the unenforced references live. */
async function liveArrayColumns(client) {
	const { rows } = await client.query(`
		select c.relname as table_name, a.attname as column_name
		from pg_attribute a
		join pg_class c on c.oid = a.attrelid
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public'
			and c.relkind = 'r'
			and a.attnum > 0
			and not a.attisdropped
			and format_type(a.atttypid, a.atttypmod) = 'uuid[]'
	`);
	return rows;
}

/** Base tables in public, so the manifest can be checked for tables it has never heard of. */
async function liveTables(client) {
	const { rows } = await client.query(`
		select c.relname as table_name
		from pg_class c
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relkind = 'r'
	`);
	return rows.map((r) => r.table_name);
}

/**
 * Throw unless the manifest still describes the live schema, naming every discrepancy.
 *
 * A migration that adds a foreign key or a uuid[] column changes what a correct restore has to do.
 * Failing here, on a dry run, is enormously cheaper than discovering it afterwards.
 */
export async function assertSchemaMatches(client, label) {
	// Sequential, not Promise.all: these share one connection, and node-postgres does not allow
	// two queries in flight on the same client.
	const fks = await liveForeignKeys(client);
	const arrays = await liveArrayColumns(client);
	const tables = await liveTables(client);

	const problems = [];
	const known = new Set([...TABLES.map((t) => t.name), ...Object.keys(EXCLUDED)]);

	for (const name of tables) {
		if (!known.has(name)) {
			problems.push(`table "${name}" exists but the manifest has never heard of it`);
		}
	}
	for (const entry of TABLES) {
		if (!tables.includes(entry.name)) {
			problems.push(`the manifest lists table "${entry.name}", which no longer exists`);
		}
	}

	// Foreign keys, both directions.
	for (const fk of fks) {
		const entry = tableNamed(fk.table_name);
		if (!entry) continue; // excluded tables are checked above, not here
		const declared = entry.fks.find((f) => f.column === fk.column_name);
		if (!declared) {
			problems.push(
				`${fk.table_name}.${fk.column_name} references ${fk.ref_table} in the database, ` +
					`but the manifest does not list it`
			);
		} else if (declared.ref !== fk.ref_table) {
			problems.push(
				`${fk.table_name}.${fk.column_name} references ${fk.ref_table}, ` +
					`but the manifest says ${declared.ref}`
			);
		}
	}
	for (const entry of TABLES) {
		for (const declared of entry.fks) {
			const live = fks.find(
				(f) => f.table_name === entry.name && f.column_name === declared.column
			);
			if (!live) {
				problems.push(
					`the manifest lists ${entry.name}.${declared.column} as a foreign key, ` +
						`but the database has no such constraint`
				);
			}
		}
	}

	// uuid[] columns. A new one is a new unenforced reference that repair pass 2 would miss.
	for (const col of arrays) {
		const entry = tableNamed(col.table_name);
		if (!entry) continue;
		const declared = entry.arrays.find((a) => a.column === col.column_name);
		const excused = entry.name === 'suggestions' && col.column_name === 'watchers';
		if (!declared && !excused) {
			problems.push(
				`${col.table_name}.${col.column_name} is a uuid[] the manifest does not map, ` +
					`so repair pass 2 would silently ignore it`
			);
		}
	}
	for (const entry of TABLES) {
		for (const declared of entry.arrays) {
			const live = arrays.find(
				(a) => a.table_name === entry.name && a.column_name === declared.column
			);
			if (!live) {
				problems.push(
					`the manifest maps ${entry.name}.${declared.column} as a uuid[], ` +
						`but the database has no such column`
				);
			}
		}
	}

	if (problems.length > 0) {
		throw new Error(
			`the schema of ${label} no longer matches restore/lib/schema.js:\n` +
				problems.map((p) => `  - ${p}`).join('\n') +
				`\n\nUpdate the manifest to match, then re-run. Do not restore against a stale manifest.`
		);
	}
}

/** The nullable scalar references, checked to still be nullable in the live database. */
export async function assertNullability(client, label) {
	const { rows } = await client.query(`
		select c.relname as table_name, a.attname as column_name, a.attnotnull as not_null
		from pg_attribute a
		join pg_class c on c.oid = a.attrelid
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
	`);

	const problems = [];
	for (const entry of TABLES) {
		for (const fk of entry.fks) {
			const col = rows.find((r) => r.table_name === entry.name && r.column_name === fk.column);
			if (!col) continue;
			const wantsNullable = fk.onMissing === 'null' || fk.onMissing === 'defer';
			if (wantsNullable && col.not_null) {
				problems.push(
					`${entry.name}.${fk.column} is NOT NULL, but the manifest treats it as ` +
						`nullable ("${fk.onMissing}"). A restore would fail on it.`
				);
			}
			if (fk.onMissing === 'skip-row' && !col.not_null) {
				problems.push(
					`${entry.name}.${fk.column} is nullable, but the manifest skips whole rows ` +
						`when its referent is missing. Those rows could be restored instead.`
				);
			}
		}
	}

	if (problems.length > 0) {
		throw new Error(
			`nullability in ${label} no longer matches restore/lib/schema.js:\n` +
				problems.map((p) => `  - ${p}`).join('\n')
		);
	}
}
