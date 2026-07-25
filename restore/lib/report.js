/**
 * The human-readable half of a dry run.
 *
 * The report exists because of one hard limit: a diff cannot tell an accidental deletion from a
 * deliberate one. Both look identical -- rows that are in the backup and not in production. The
 * only thing standing between a restore and resurrecting something somebody meant to delete is an
 * operator recognising the list, so every row gets a label a person can actually recognise rather
 * than a bare uuid.
 */

/** Trim a value to something that fits on a line of the report. */
function short(value, limit = 48) {
	if (value === null || value === undefined) return '';
	const text = String(value).replace(/\s+/g, ' ').trim();
	return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/** A recognisable name for a row, from whichever label columns the manifest names. */
export function labelFor(entry, row) {
	const parts = entry.label
		.map((column) => row[column])
		.filter(Boolean)
		.map((v) => short(v, 32));
	if (parts.length > 0) return `"${parts.join(' / ')}"`;

	// assignments has no descriptive column at all -- it is nothing but a (role, profile) pair --
	// so fall back to the key, which is at least something an operator can look up.
	const key = entry.key.map((k) => row[k]).filter(Boolean);
	if (key.length > 0) return key.map((v) => String(v).slice(0, 8)).join('/');
	return row.id ? String(row.id).slice(0, 8) : '<row>';
}

/** Accumulates the sections of a report, then renders them. */
export class Report {
	constructor({ source, target }) {
		this.source = source;
		this.target = target;
		this.missing = [];
		this.arrays = [];
		this.scalars = [];
		this.diverged = [];
		this.warnings = [];
	}

	addMissing(table, labels) {
		if (labels.length > 0) this.missing.push({ table, labels });
	}

	addArrayRepair(table, column, rows, ids) {
		if (rows > 0) this.arrays.push({ table, column, rows, ids });
	}

	addScalarRepair(table, column, rows) {
		if (rows > 0) this.scalars.push({ table, column, rows });
	}

	addDiverged(table, labels) {
		if (labels.length > 0) this.diverged.push({ table, labels });
	}

	warn(message) {
		this.warnings.push(message);
	}

	/** Total rows this restore would insert, for the --limit fuse. */
	get insertCount() {
		return this.missing.reduce((sum, m) => sum + m.labels.length, 0);
	}

	/** True when there is nothing at all to do -- the goal state after a successful restore. */
	get empty() {
		return this.missing.length === 0 && this.arrays.length === 0 && this.scalars.length === 0;
	}

	render() {
		const lines = [`source  ${this.source}`, `target  ${this.target}`, ''];

		if (this.missing.length > 0) {
			lines.push('MISSING ROWS');
			for (const { table, labels } of this.missing) {
				const shown = labels.slice(0, 6).join(', ');
				const more = labels.length > 6 ? `, and ${labels.length - 6} more` : '';
				lines.push(`  ${table.padEnd(14)}${String(labels.length).padStart(4)}   ${shown}${more}`);
			}
			lines.push('');
		}

		if (this.arrays.length > 0) {
			lines.push('ARRAY REPAIRS');
			for (const { table, column, rows, ids } of this.arrays) {
				const target = `${table}.${column}`;
				lines.push(`  ${target.padEnd(28)}${rows} row(s), ${ids} id(s) restored`);
			}
			lines.push('');
		}

		if (this.scalars.length > 0) {
			lines.push('SCALAR REPAIRS');
			lines.push('  (references that ON DELETE SET NULL blanked on rows that survived)');
			for (const { table, column, rows } of this.scalars) {
				lines.push(`  ${`${table}.${column}`.padEnd(28)}${rows} row(s)`);
			}
			lines.push('');
		}

		if (this.diverged.length > 0) {
			lines.push('DIVERGED (present in both, NOT touched)');
			for (const { table, labels } of this.diverged) {
				lines.push(
					`  ${table.padEnd(14)}${String(labels.length).padStart(4)}   ${labels.slice(0, 4).join(', ')}`
				);
			}
			lines.push('');
		}

		if (this.warnings.length > 0) {
			lines.push('WARNINGS');
			for (const warning of this.warnings) lines.push(`  ${warning}`);
			lines.push('');
		}

		if (this.empty) {
			lines.push('Nothing to do: the target already has everything the source does.');
			lines.push('');
		}

		return lines.join('\n');
	}
}
