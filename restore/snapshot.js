import fs from 'node:fs';
import path from 'node:path';
import { parse, connectionFrom, assertIgnored } from './lib/args.js';
import { connect, describe, preflight } from './lib/db.js';
import { TABLES } from './lib/schema.js';
import { fileHeader } from './lib/sql.js';
import { selectKeys, tableScript, deferredStatements, assemble } from './lib/generate.js';

/**
 * Dump a database to a replayable SQL script.
 *
 * This is the cheap insurance that fills the gap the daily backups leave. Production snapshots
 * run in seconds at this data scale, so there is no reason not to take one before a risky
 * migration, a bulk edit, or any hand-written SQL. It is read-only: there is deliberately no
 * --apply here, and no target connection at all.
 *
 * The output is the same format restore.js generates, so a snapshot can be replayed directly with
 * psql, or loaded into a scratch database to act as the source of a later diff.
 *
 *   npm run snapshot -- --source-env PROD_DB_URL
 *   npm run snapshot -- --source postgresql://postgres:postgres@127.0.0.1:54322/postgres
 */

const ALLOWED = new Set(['source', 'source-env', 'org', 'out', 'ca', 'help']);

const USAGE = `
Usage: npm run snapshot -- --source-env <VAR> [options]

  --source <url>        connection string to dump
  --source-env <VAR>    ...or the name of an environment variable holding it (preferred:
                        a URL on the command line is visible in ps output and shell history)
  --org <uuid>          restrict to one organization; repeatable
  --out <path>          output file (default backups/snapshot-<timestamp>.sql)
  --ca <path>           CA certificate for verifying a remote server
  --help
`.trim();

/**
 * People are dumped as commented-out reference only.
 *
 * public.people.id is a foreign key to auth.users, so a person cannot be inserted without
 * recreating the account -- which is out of scope. Recording who existed is still useful when
 * reading a snapshot months later and wondering who wrote a comment.
 */
async function peopleComment(client, orgIds) {
	const { rows } = orgIds?.length
		? await client.query(
				`select distinct pe.id, pe.email from public.people pe
				 join public.profiles p on p.personid = pe.id
				 where p.orgid = any($1::uuid[]) order by pe.email`,
				[orgIds]
			)
		: await client.query('select id, email from public.people order by email');

	if (rows.length === 0) return '';
	return [
		'-- People, for reference only. These cannot be restored by this tool: public.people.id is',
		'-- a foreign key to auth.users, and accounts are out of scope.',
		...rows.map((r) => `--   ${r.id}  ${r.email}`)
	].join('\n');
}

async function main() {
	const flags = parse(process.argv, ALLOWED);
	if (flags.help) {
		console.log(USAGE);
		return;
	}

	const url = connectionFrom(flags, 'source');
	const orgIds = flags.org ?? [];

	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const out = flags.out ?? path.join('backups', `snapshot-${stamp}.sql`);
	const directory = path.dirname(path.resolve(out));
	fs.mkdirSync(directory, { recursive: true });
	assertIgnored(directory);

	const client = await connect(url, { ca: flags.ca, label: 'source' });
	try {
		await preflight(client, `source (${describe(url)})`);

		const inserts = [];
		const deferredByTable = {};
		const counts = [];

		for (const entry of TABLES) {
			const keys = await selectKeys(client, entry, { orgIds });
			if (keys.length === 0) continue;
			const { insert, deferred } = await tableScript(client, entry, keys);
			inserts.push({ table: entry.name, sql: insert });
			if (Object.keys(deferred).length > 0) deferredByTable[entry.name] = deferred;
			counts.push(`${entry.name}=${keys.length}`);
		}

		const header = [
			fileHeader('snapshot', {
				source: describe(url),
				command: `npm run snapshot -- ${process.argv.slice(2).join(' ')}`,
				generated: new Date().toISOString()
			}),
			`--`,
			`-- Rows: ${counts.join(' ') || 'none'}`,
			orgIds.length ? `-- Limited to organizations: ${orgIds.join(', ')}` : null,
			``,
			await peopleComment(client, orgIds)
		]
			.filter((line) => line !== null)
			.join('\n');

		const script = assemble({
			header,
			inserts,
			deferred: deferredStatements(deferredByTable),
			repairs: []
		});

		fs.writeFileSync(out, script);
		console.log(`source  ${describe(url)}`);
		console.log(`wrote   ${out}`);
		console.log(`rows    ${counts.join(' ') || 'none'}`);
		console.log('');
		console.log('This file contains personal data. Do not commit it or attach it to an issue.');
	} finally {
		await client.end();
	}
}

main().catch((error) => {
	console.error(`\n${error.message}\n`);
	process.exit(1);
});
