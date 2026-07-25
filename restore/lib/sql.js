/**
 * Generating the SQL a restore runs.
 *
 * The load-bearing decision here is that values are never rendered by JavaScript. Row tuples come
 * back from Postgres already quoted, via `format('%L::<type>', col)` with the column's introspected
 * type. That buys two things:
 *
 *   - It eliminates the entire class of escaping bugs, because Postgres applies its own quoting
 *     rules rather than ours.
 *   - It avoids a real, quiet corruption: node-postgres parses `timestamp with time zone` into a
 *     JavaScript Date, which cannot hold microseconds. Every `"when"` in a restore would come back
 *     subtly wrong. The value never becomes a Date because it never leaves Postgres as anything
 *     but text.
 *
 * The pure statement builders below are unit-tested in sql.test.ts; the two functions that talk to
 * a database are not.
 */

/** How many tuples go into one INSERT, so no single statement is too big to read. */
const CHUNK = 500;

/** A uuid[] literal, or the empty-array literal, which `array[]` cannot express. */
export function uuidArrayLiteral(ids) {
	if (ids.length === 0) return `'{}'::uuid[]`;
	return `array[${ids.map((id) => `'${id}'`).join(', ')}]::uuid[]`;
}

/** A single uuid literal, cast so it is unambiguous in a VALUES list. */
function uuid(id) {
	return `'${id}'::uuid`;
}

/** Double-quote an identifier. Several columns ("when", "how") are reserved or near-reserved. */
function ident(name) {
	return `"${name}"`;
}

/**
 * A WHERE predicate matching a set of primary keys, single-column or composite.
 *
 * `unnest` over N parallel arrays zips them, so a composite key matches as a tuple rather than as
 * a cross product -- which is what a naive `roleid = any(...) and profileid = any(...)` would do.
 */
export function keyPredicate(key, prefix = '') {
	const qualified = key.map((k) => `${prefix}${ident(k)}`).join(', ');
	const params = key.map((_, i) => `$${i + 1}::uuid[]`).join(', ');
	const aliases = key.map((_, i) => `k${i}`).join(', ');
	return `(${qualified}) in (select ${aliases} from unnest(${params}) as keyset(${aliases}))`;
}

/** Column names and their rendered types, in ordinal order. */
export async function columnsOf(client, table) {
	const { rows } = await client.query(
		`
		select a.attname as name, format_type(a.atttypid, a.atttypmod) as type
		from pg_attribute a
		join pg_class c on c.oid = a.attrelid
		join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relname = $1 and a.attnum > 0 and not a.attisdropped
		order by a.attnum
	`,
		[table]
	);
	return rows;
}

/**
 * Rows as ready-to-paste SQL tuples, quoted by Postgres itself.
 *
 * `nullColumns` forces a column to render as NULL regardless of its stored value. That is how the
 * deferred references are handled: a process is inserted with a null howid and patched afterwards.
 */
export async function fetchTuples(client, table, columns, key, keyValues, { nullColumns } = {}) {
	if (keyValues.length === 0) return [];
	const forced = nullColumns ?? new Set();

	// Build one format() call per row. Forced-null columns become literal text in the format
	// string rather than an argument, so they take no parameter slot.
	const parts = columns.map((c) => (forced.has(c.name) ? `NULL::${c.type}` : `%L::${c.type}`));
	const args = columns.filter((c) => !forced.has(c.name)).map((c) => ident(c.name));
	const format = `(${parts.join(', ')})`;

	// One array per key column, so unnest can zip them. A single-column key arrives as scalars, a
	// composite key (assignments) as tuples.
	const params = key.map((_, i) => keyValues.map((v) => (Array.isArray(v) ? v[i] : v)));

	const { rows } = await client.query(
		`select format('${format}'${args.length ? ', ' + args.join(', ') : ''}) as tuple
		 from public.${ident(table)}
		 where ${keyPredicate(key)}`,
		params
	);
	return rows.map((r) => r.tuple);
}

/**
 * INSERT statements for a set of pre-rendered tuples.
 *
 * Always `do nothing`, never `do update`. An id that reappeared in the target between generating
 * this and applying it is live truth, and overwriting it would be a silent regression. It also
 * makes the whole script idempotent, which matters when a failure part-way through means re-running
 * the file after a fix.
 */
export function insertStatement(table, columnNames, tuples, key) {
	if (tuples.length === 0) return '';
	const cols = columnNames.map(ident).join(', ');
	const conflict = key.map(ident).join(', ');
	const chunks = [];
	for (let i = 0; i < tuples.length; i += CHUNK) {
		const slice = tuples.slice(i, i + CHUNK);
		chunks.push(
			`insert into public.${ident(table)} (${cols}) values\n` +
				slice.map((t) => `\t${t}`).join(',\n') +
				`\non conflict (${conflict}) do nothing;`
		);
	}
	return chunks.join('\n\n');
}

/**
 * Set a reference that had to be inserted as NULL, once its referent exists.
 *
 * Used for the two deferred cases -- processes.howid and profiles.supervisor -- and, in identical
 * form, for repair pass 3. Two guards matter:
 *
 *   - `is null` means an existing non-null pointer is never clobbered. Whatever the target already
 *     has wins, because it may be a deliberate reassignment made since the backup.
 *   - `exists` means one unrestorable referent cannot abort the whole transaction on a foreign key
 *     violation. It is evaluated at apply time, against live data.
 */
export function referenceUpdate(table, column, pairs, refTable, { note } = {}) {
	if (pairs.length === 0) return '';
	const values = pairs.map(([id, value]) => `(${uuid(id)}, ${uuid(value)})`).join(',\n\t\t');
	return (
		(note ? `-- ${note}\n` : '') +
		`update public.${ident(table)} t\n` +
		`set ${ident(column)} = v.value\n` +
		`from (values\n\t\t${values}\n\t) as v(id, value)\n` +
		`where t."id" = v.id\n` +
		`\tand t.${ident(column)} is null\n` +
		`\tand exists (select 1 from public.${ident(refTable)} r where r."id" = v.value);`
	);
}

/**
 * Rebuild a uuid[] reference column, preserving the backup's order.
 *
 * Appending is wrong for hows.how: the step tree lives entirely in that array, so a restored step
 * belongs at its original index, not at the end. This rebuilds the backup's order first, then
 * appends anything the target has gained since, so a concurrent addition is not lost.
 *
 * The `coalesce` calls are not decoration. `array_agg` over an empty set returns NULL, and
 * `NULL || anything` is NULL -- without them, repairing a row whose ids have all since been deleted
 * would blank a NOT NULL column's contents instead of leaving it alone.
 */
export function arrayMergeUpdate(table, id, column, sourceIds, refTable) {
	if (sourceIds.length === 0) return '';
	const wanted = uuidArrayLiteral(sourceIds);
	return (
		`update public.${ident(table)} t\n` +
		`set ${ident(column)} =\n` +
		`\tcoalesce((\n` +
		`\t\tselect array_agg(w.id order by w.ord)\n` +
		`\t\tfrom unnest(${wanted}) with ordinality as w(id, ord)\n` +
		`\t\twhere exists (select 1 from public.${ident(refTable)} r where r."id" = w.id)\n` +
		`\t), '{}'::uuid[])\n` +
		`\t||\n` +
		`\tcoalesce((\n` +
		`\t\tselect array_agg(kept)\n` +
		`\t\tfrom unnest(t.${ident(column)}) kept\n` +
		`\t\twhere not (kept = any(${wanted}))\n` +
		`\t), '{}'::uuid[])\n` +
		`where t."id" = ${uuid(id)};`
	);
}

/**
 * Wrap statements so a trigger cannot rewrite what is being restored.
 *
 * handle_new_profile fires AFTER INSERT on profiles and overwrites personid by matching
 * lower(email) against people. Usually it would land on the same answer, but a restore must
 * reproduce the backup rather than re-derive it -- if the email was reassigned since, re-deriving
 * gives the wrong person.
 *
 * Note this takes an ACCESS EXCLUSIVE lock on the table for the length of the transaction, so the
 * live app blocks on it. Brief at this data scale, but it is why the transaction stays tight.
 */
export function withTriggerDisabled(table, trigger, body) {
	return (
		`alter table public.${ident(table)} disable trigger ${trigger};\n\n` +
		body +
		`\n\nalter table public.${ident(table)} enable trigger ${trigger};`
	);
}

/** Link restored profiles to people, explicitly and only where it cannot do harm. */
export function relinkProfiles() {
	return (
		`-- The backfill from 20260718120000_fix_profile_insert_policy_and_linking.sql, run\n` +
		`-- explicitly now that on_profile_create has been re-enabled. Only fills gaps.\n` +
		`update public.profiles p set personid = pe.id\n` +
		`from public.people pe\n` +
		`where p.personid is null and lower(pe.email) = lower(p.email);`
	);
}

/** The header every generated file carries, so a stray .sql is never mistaken for scratch. */
export function fileHeader(kind, { source, target, command, generated }) {
	const lines = [
		`-- adminima ${kind}`,
		`-- generated ${generated}`,
		source ? `-- source ${source}` : null,
		target ? `-- target ${target}` : null,
		`--`,
		`-- Contains personal data (member names, email addresses). Do not commit this file and do`,
		`-- not attach it to an issue -- this repository is public.`,
		`--`,
		`-- Produced by: ${command}`
	];
	return lines.filter(Boolean).join('\n');
}
