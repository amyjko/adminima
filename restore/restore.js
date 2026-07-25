import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parse, connectionFrom, parseIds, assertIgnored } from './lib/args.js';
import { connect, describe, preflight, majorVersion } from './lib/db.js';
import { TABLES, tableNamed, repairableScalars } from './lib/schema.js';
import { columnsOf, fileHeader, arrayMergeUpdate, referenceUpdate } from './lib/sql.js';
import { selectKeys, tableScript, deferredStatements, assemble } from './lib/generate.js';
import { Report, labelFor } from './lib/report.js';

/**
 * Restore rows that a target database is missing, from a database that still has them.
 *
 * The workflow this belongs to is in restore/README.md, and reading it first is worth the two
 * minutes. In short: a Supabase daily backup restored in place is whole-database and destructive,
 * so recovering one deleted row that way would discard every legitimate write since the snapshot.
 * Instead, load the backup into a local database and use this to copy back only what is missing.
 *
 * Three properties make it safe to run:
 *
 *   - It is a dry run unless you pass --apply.
 *   - It only ever inserts absences and fills nulls. It never updates a populated column and never
 *     deletes anything, so the target's own writes always win.
 *   - Every statement is idempotent, so the generated file can be re-run after a failure.
 *
 * What it cannot do is tell an accidental deletion from a deliberate one. Read the report.
 */

const ALLOWED = new Set([
	'source',
	'source-env',
	'target',
	'target-env',
	'org',
	'table',
	'id',
	'limit',
	'columns',
	'out',
	'ca',
	'apply',
	'yes',
	'help'
]);

const USAGE = `
Usage: npm run restore -- --source <url> --target-env <VAR> [options]

  --source <url>        the database that still has the data (usually a restored backup)
  --source-env <VAR>    ...or the name of an environment variable holding it
  --target <url>        the database to repair (usually production)
  --target-env <VAR>    ...or the name of an environment variable holding it (preferred:
                        a URL on the command line is visible in ps output and shell history)

  --org <uuid>          restrict to one organization; repeatable
  --table <name>        restrict to one table; repeatable
  --id <table>:<uuid>   restore exactly these rows; repeatable
  --limit <n>           refuse to proceed above this many inserts (default 500)
  --columns intersect   when the two schemas differ, use only the columns they share
  --out <path>          output file (default backups/restore-<timestamp>.sql)
  --ca <path>           CA certificate for verifying a remote server
  --apply               execute the generated file against the target
  --yes                 skip the typed confirmation (for scripted use)
  --help

Connections are never inferred. Note that \`npm run stop\` points .env at production, so
nothing in restore/ reads .env.
`.trim();

/** A stable string for a primary key, single-column or composite. */
function keyOf(value) {
	return Array.isArray(value) ? value.join(':') : String(value);
}

/** Which tables this run covers, honouring --table. */
function selectedTables(flags) {
	if (!flags.table) return TABLES;
	for (const name of flags.table) {
		if (!tableNamed(name)) throw new Error(`--table ${name} is not a restorable table`);
	}
	return TABLES.filter((t) => flags.table.includes(t.name));
}

/**
 * Compare the two schemas column by column.
 *
 * In the bad-migration case these genuinely differ, because the backup predates the migration.
 * That is exactly when a restore is most needed and most dangerous, so the default is to stop and
 * make you look. --columns intersect proceeds, but prints everything it is dropping.
 */
async function reconcileColumns(source, target, entry, flags, report) {
	const [sourceColumns, targetColumns] = await Promise.all([
		columnsOf(source, entry.name),
		columnsOf(target, entry.name)
	]);
	const sourceNames = sourceColumns.map((c) => c.name);
	const targetNames = targetColumns.map((c) => c.name);

	const onlySource = sourceNames.filter((n) => !targetNames.includes(n));
	const onlyTarget = targetNames.filter((n) => !sourceNames.includes(n));
	if (onlySource.length === 0 && onlyTarget.length === 0) return null;

	if (flags.columns !== 'intersect') {
		throw new Error(
			`${entry.name} has different columns in the two databases:\n` +
				(onlySource.length ? `  only in source: ${onlySource.join(', ')}\n` : '') +
				(onlyTarget.length ? `  only in target: ${onlyTarget.join(', ')}\n` : '') +
				`\nThis usually means the backup predates a migration. Re-run with ` +
				`--columns intersect to restore using only the shared columns, but read the ` +
				`warnings it prints first.`
		);
	}

	if (onlySource.length) {
		report.warn(
			`${entry.name}: dropping ${onlySource.join(', ')} -- present in the backup, gone from the target`
		);
	}
	if (onlyTarget.length) {
		report.warn(
			`${entry.name}: ${onlyTarget.join(', ')} will take their defaults -- the backup has no value for them`
		);
	}
	return sourceNames.filter((n) => targetNames.includes(n));
}

/**
 * Every value pass 1 needs to decide a row's fate: its key, its references, and its label.
 *
 * One query rather than several, because the reference columns and the label columns are needed
 * together -- a row that gets skipped still has to be named in the report.
 */
async function fetchDetail(client, entry, keyValues) {
	if (keyValues.length === 0) return new Map();

	const wanted = [...new Set([...entry.key, ...entry.fks.map((f) => f.column), ...entry.label])];
	const params = entry.key.map((_, i) => keyValues.map((v) => (Array.isArray(v) ? v[i] : v)));
	const predicate = entry.key.map((k, i) => `"${k}" = any($${i + 1}::uuid[])`).join(' and ');
	const { rows } = await client.query(
		`select ${wanted.map((c) => `"${c}"`).join(', ')}
		 from public."${entry.name}" where ${predicate}`,
		params
	);

	const map = new Map();
	for (const row of rows) map.set(entry.key.map((k) => row[k]).join(':'), row);
	return map;
}

/**
 * Labels for assignment rows, which have nothing descriptive of their own.
 *
 * Every other table has a title or a name. An assignment is only a (role, profile) pair, so a
 * truncated uuid tells an operator nothing -- and the report exists to be recognised. Resolve the
 * pair to the names it stands for instead.
 */
async function describeAssignments(client, keys) {
	if (keys.length === 0) return [];
	const { rows } = await client.query(
		`select r.title, p.name, a.roleid, a.profileid
		 from public.assignments a
		 join public.roles r on r.id = a.roleid
		 join public.profiles p on p.id = a.profileid
		 where a.roleid = any($1::uuid[]) and a.profileid = any($2::uuid[])`,
		[keys.map((k) => k[0]), keys.map((k) => k[1])]
	);
	const found = new Map(rows.map((r) => [`${r.roleid}:${r.profileid}`, `${r.title} → ${r.name}`]));
	return keys.map((k) => found.get(`${k[0]}:${k[1]}`) ?? `${k[0].slice(0, 8)}/${k[1].slice(0, 8)}`);
}

/** Whole rows of a uuid[] column, for the array repair pass. */
async function arrayValues(client, table, column) {
	const { rows } = await client.query(`select "id", "${column}" as value from public."${table}"`);
	return new Map(rows.map((r) => [r.id, r.value ?? []]));
}

async function main() {
	const flags = parse(process.argv, ALLOWED);
	if (flags.help) {
		console.log(USAGE);
		return;
	}

	const sourceUrl = connectionFrom(flags, 'source');
	const targetUrl = connectionFrom(flags, 'target');
	if (sourceUrl === targetUrl) throw new Error('source and target are the same database');

	const orgIds = flags.org ?? [];
	const idsByTable = parseIds(flags.id);
	const limit = flags.limit ? Number(flags.limit) : 500;
	if (!Number.isFinite(limit) || limit < 0) throw new Error('--limit must be a positive number');

	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const out = flags.out ?? path.join('backups', `restore-${stamp}.sql`);
	const directory = path.dirname(path.resolve(out));
	fs.mkdirSync(directory, { recursive: true });
	assertIgnored(directory);

	const source = await connect(sourceUrl, { ca: flags.ca, label: 'source' });
	const target = await connect(targetUrl, { ca: flags.ca, label: 'target' });

	try {
		await preflight(source, `source (${describe(sourceUrl)})`);
		await preflight(target, `target (${describe(targetUrl)})`);

		const report = new Report({ source: describe(sourceUrl), target: describe(targetUrl) });

		const [sourceVersion, targetVersion] = await Promise.all([
			majorVersion(source),
			majorVersion(target)
		]);
		if (sourceVersion !== targetVersion) {
			report.warn(
				`Postgres major versions differ: source ${sourceVersion}, target ${targetVersion}`
			);
		}

		const tables = selectedTables(flags);
		/** Keys that will exist in the target once this restore is applied, per table. */
		const willExist = {};
		for (const entry of TABLES) {
			const keys = await selectKeys(target, entry, {});
			willExist[entry.name] = new Set(keys.map(keyOf));
		}
		// people are never restored, so whatever the target has is all there will ever be.
		const { rows: peopleRows } = await target.query('select id from public.people');
		willExist.people = new Set(peopleRows.map((r) => r.id));

		const inserts = [];
		const deferredByTable = {};

		// ---- Pass 1: rows the target is missing -------------------------------------------------
		for (const entry of tables) {
			const shared = await reconcileColumns(source, target, entry, flags, report);

			const sourceKeys = await selectKeys(source, entry, {
				orgIds,
				ids: idsByTable[entry.name]
			});
			const present = willExist[entry.name];
			let missing = sourceKeys.filter((k) => !present.has(keyOf(k)));
			if (missing.length === 0) continue;

			// Resolve each row's references against what will exist. Insertion order is topological,
			// so by the time a table is reached its referents are already decided.
			const rows = await fetchDetail(source, entry, missing);

			/** Rows grouped by which nullable references have to be withheld. */
			const groups = new Map();
			const skipped = [];

			for (const key of missing) {
				const id = keyOf(key);
				const row = rows.get(id) ?? {};
				const withhold = [];
				let skip = null;

				for (const fk of entry.fks) {
					// Deferred references are withheld from every row regardless, and set afterwards.
					if (fk.onMissing === 'defer') continue;
					const value = row[fk.column];
					if (!value) continue;

					if (!willExist[fk.ref]?.has(String(value))) {
						if (fk.onMissing === 'skip-row') {
							// NOT NULL, so the row cannot exist without its referent. The usual case is
							// a comment whose author's account is gone -- unrestorable by design.
							skip =
								`${fk.column} -> ${fk.ref} ${String(value).slice(0, 8)} does not exist` +
								(fk.ref === 'people' ? ' (account deleted; out of scope)' : '');
							break;
						}
						withhold.push(fk.column);
					}
				}

				if (skip) {
					skipped.push({ reason: skip, label: labelFor(entry, row) });
					continue;
				}
				const groupKey = withhold.sort().join(',');
				if (!groups.has(groupKey)) groups.set(groupKey, []);
				groups.get(groupKey).push(key);
			}

			for (const { label, reason } of skipped) {
				report.warn(`${entry.name}: skipped ${label} -- ${reason}`);
			}

			const accepted = [...groups.values()].flat();
			if (accepted.length === 0) continue;

			// Everything accepted here will exist after the restore, so later tables can see it.
			for (const key of accepted) present.add(keyOf(key));

			for (const [groupKey, keys] of groups) {
				const extraNulls = groupKey ? groupKey.split(',') : [];
				const { insert, deferred } = await tableScript(source, entry, keys, {
					extraNulls,
					columns: shared
				});
				if (insert) inserts.push({ table: entry.name, sql: insert });
				for (const [column, pairs] of Object.entries(deferred)) {
					(deferredByTable[entry.name] ??= {})[column] = [
						...((deferredByTable[entry.name] ?? {})[column] ?? []),
						...pairs
					];
				}
			}

			report.addMissing(
				entry.name,
				entry.name === 'assignments'
					? await describeAssignments(source, accepted)
					: accepted.map((k) => labelFor(entry, rows.get(keyOf(k)) ?? {}))
			);
		}

		// ---- Pass 2: unenforced uuid[] references ------------------------------------------------
		// Several relationships are uuid[] columns rather than foreign keys. The app's delete_comment
		// RPC array_removes an id from its parent, so restoring the comment row alone leaves it
		// present in the database but invisible in the UI. Only rows that SURVIVED in the target need
		// this -- restored rows carry their array from the backup already.
		const repairs = [];
		for (const entry of tables) {
			for (const array of entry.arrays) {
				const [sourceArrays, targetArrays] = await Promise.all([
					arrayValues(source, entry.name, array.column),
					arrayValues(target, entry.name, array.column)
				]);

				let rowCount = 0;
				let idCount = 0;
				for (const [id, targetValue] of targetArrays) {
					const sourceValue = sourceArrays.get(id);
					if (!sourceValue) continue;
					const have = new Set(targetValue);
					const restorable = sourceValue.filter(
						(x) => !have.has(x) && willExist[array.ref]?.has(String(x))
					);
					if (restorable.length === 0) continue;

					repairs.push(arrayMergeUpdate(entry.name, id, array.column, sourceValue, array.ref));
					rowCount += 1;
					idCount += restorable.length;
				}
				report.addArrayRepair(entry.name, array.column, rowCount, idCount);
			}
		}

		// ---- Pass 3: scalar references blanked by ON DELETE SET NULL -----------------------------
		// Invisible to a row-level diff: delete a role that was a process's `accountable` and the
		// process survives with a null pointer. It is present in both databases, so pass 1 sees
		// nothing, and re-inserting the role does not put the pointer back.
		for (const scalar of repairableScalars()) {
			if (!tables.some((t) => t.name === scalar.table)) continue;
			const { rows } = await target.query(
				`select "id" from public."${scalar.table}" where "${scalar.column}" is null`
			);
			if (rows.length === 0) continue;

			const blanked = new Set(rows.map((r) => r.id));
			const { rows: sourceRows } = await source.query(
				`select "id", "${scalar.column}" as value from public."${scalar.table}"
				 where "${scalar.column}" is not null`
			);

			const pairs = sourceRows
				.filter((r) => blanked.has(r.id) && willExist[scalar.ref]?.has(String(r.value)))
				.map((r) => [r.id, r.value]);
			if (pairs.length === 0) continue;

			repairs.push(
				referenceUpdate(scalar.table, scalar.column, pairs, scalar.ref, {
					note: `${scalar.table}.${scalar.column} was blanked by ON DELETE SET NULL on rows that survived.`
				})
			);
			report.addScalarRepair(scalar.table, scalar.column, pairs.length);
		}

		// ---- Org path collisions -----------------------------------------------------------------
		// orgs.paths is not unique and path_available() only checks at read time, so restoring an org
		// whose vanity path was retaken creates a silent duplicate -- and the org lookup in
		// src/routes/org/[orgid]/+layout.server.ts uses .single(), which then errors. Broken and
		// visible beats invisible, but this should be a decision rather than a surprise.
		const restoringOrgs = inserts.some((i) => i.table === 'orgs');
		if (restoringOrgs) {
			const { rows } = await target.query('select id, paths from public.orgs');
			const taken = new Map();
			for (const row of rows) for (const p of row.paths ?? []) taken.set(p, row.id);

			const { rows: incoming } = await source.query('select id, name, paths from public.orgs');
			for (const org of incoming) {
				if (willExist.orgs.has(org.id) && !taken.has(org.id)) {
					for (const p of org.paths ?? []) {
						if (taken.has(p) && taken.get(p) !== org.id) {
							report.warn(
								`orgs: path "${p}" is already used by another organization. ` +
									`Restoring "${org.name}" would make both unreachable. Clear the path first.`
							);
						}
					}
				}
			}
		}

		// ---- Output ------------------------------------------------------------------------------
		const header = fileHeader('restore', {
			source: describe(sourceUrl),
			target: describe(targetUrl),
			command: `npm run restore -- ${process.argv.slice(2).join(' ')}`,
			generated: new Date().toISOString()
		});

		const script = assemble({
			header,
			inserts,
			deferred: deferredStatements(deferredByTable),
			repairs: repairs.filter(Boolean)
		});

		const reportPath = out.replace(/\.sql$/, '.txt');
		fs.writeFileSync(out, script);
		fs.writeFileSync(reportPath, report.render());

		console.log('');
		console.log(report.render());
		console.log(`wrote ${out}`);
		console.log(`      ${reportPath}`);

		if (report.empty) return;

		if (report.insertCount > limit) {
			throw new Error(
				`this would insert ${report.insertCount} rows, above the --limit of ${limit}. ` +
					`If that is genuinely the size of the loss (a deleted organization cascades into ` +
					`eight tables), re-run with --limit ${report.insertCount}.`
			);
		}

		if (!flags.apply) {
			console.log('');
			console.log('This was a dry run. Review the SQL above, then apply it with:');
			console.log(`  npm run restore -- ${process.argv.slice(2).join(' ')} --apply`);
			return;
		}

		await apply(target, targetUrl, script, report, flags);
	} finally {
		await source.end();
		await target.end();
	}
}

/**
 * Execute the generated file, exactly as written, in one transaction.
 *
 * Running the same bytes that were reviewed is the point: there is no second code path that could
 * drift from the preview. A failure rolls the whole thing back and leaves the file on disk, so it
 * can be corrected and re-run.
 */
async function apply(target, targetUrl, script, report, flags) {
	const where = describe(targetUrl);
	const hostname = new URL(targetUrl).hostname;

	if (!flags.yes) {
		console.log('');
		console.log(`About to write to ${where}:`);
		console.log(
			`  ${report.insertCount} row(s) inserted, ${report.arrays.length + report.scalars.length} repair(s)`
		);
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		const answer = await rl.question(`Type the target hostname (${hostname}) to continue: `);
		rl.close();
		if (answer.trim() !== hostname) {
			throw new Error('confirmation did not match; nothing was written');
		}
	}

	// The script carries its own begin/commit, so a failure anywhere rolls back everything.
	await target.query(script);
	console.log('');
	console.log(`Applied to ${where}.`);
	console.log('Re-run without --apply to confirm there is nothing left to do.');
}

main().catch((error) => {
	console.error(`\n${error.message}\n`);
	process.exit(1);
});
