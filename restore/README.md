# Recovering lost data

Read this when data has gone missing: somebody deleted something they wanted back, a migration
destroyed a column, or an organization vanished.

## What can and cannot be recovered

Production has **seven daily backups on a rolling seven-day window**, taken around 14:50 UTC.
There is no point-in-time recovery, deliberately — it costs $100/month and up to 24 hours of loss
is an accepted risk. So the worst case is real: a deletion at 14:45 UTC loses almost a full day.

**Every delete in this schema is a hard delete.** There is no `deleted_at`, no archive table, no
tombstone anywhere. Nothing is recoverable from the live database once it is gone.

> `processes.state = 'archived'` is a lifecycle label that users set, **not** a deletion marker.
> An archived process is a normal, fully queried row. Do not go looking there for deleted data.

**Deleted accounts are out of scope.** `public.people.id` is a foreign key to `auth.users`, so a
person cannot be recreated without recreating the account. Comments and suggestions are `NOT NULL`
references to their author, so if an author's account is gone their rows cannot be restored either.
The tool skips them and names them in the report rather than failing part-way through.

## The shape of a recovery

Restoring a Supabase backup **in place** rolls the entire database back to 14:50 UTC and takes the
project offline while it happens. That is almost never what you want: recovering one deleted role
that way would also discard every legitimate write since the snapshot.

So instead:

1. Load the backup into a **local** database.
2. Diff it against production.
3. Copy back **only what is missing**.

`restore.js` does steps 2 and 3. It only ever inserts absences and fills nulls — it never updates a
populated column and never deletes anything, so production's own writes always win.

## 1. First moves

Take a snapshot of production **before** you change anything. It is your only record of the
pre-restore state, and it makes the whole operation auditable.

```sh
export PROD_DB_URL='postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres'
npm run snapshot -- --source-env PROD_DB_URL
```

No downtime is needed and nothing is locked for long — the tool only reads here.

Then write down what was lost, roughly when, and who reported it. You will need it in step 4,
because the diff cannot tell an accidental deletion from a deliberate one.

Get the connection string from **Dashboard → Connect**. Use the **direct connection** or the
**session pooler**. Not the transaction pooler on port 6543 — it does not hold session state across
statements, and the tool refuses it.

## 2. Get the backup

**Dashboard → Database → Backups**, pick the day, **Download**. The timestamps are UTC.

Pick the most recent backup _before_ the loss. If you are not sure when the loss happened, prefer
an earlier one: rows the target already has are never touched, so an older backup restores strictly
less, not something wrong.

## 3. Load it into a local database

**Stop any other local Supabase stack first.** They all bind port 54322, so a stack from another
project will silently take the port this one needs:

```sh
npx supabase stop --project-id <other-project>
```

Then bring this one up and load the backup:

```sh
npx supabase start -x storage,imgproxy,analytics,vector,edge-runtime,functions
npx supabase db reset          # a clean database; this DESTROYS your local dev data
docker exec -i supabase_db_adminima psql -U postgres -d postgres < path/to/backup.sql
```

Two things that will bite you:

- **`psql` and `pg_dump` are not installed on this machine.** Every command here goes through
  `docker exec` into the running container. `docker exec` needs **`-i`** to accept piped input —
  without it the file is silently ignored and nothing happens.
- **Local Postgres must be major version 15**, matching production. `supabase/config.toml` pins it.

`npm run reset` brings the seed data back when you are finished.

> **`npm run stop` runs `cp .env.prod .env`.** Your `.env` points at _production_ whenever the local
> stack is down. Nothing in `restore/` reads `.env` for exactly this reason — connections are always
> passed explicitly — but be careful with anything else you run.

## 4. Preview

```sh
npm run restore -- \
  --source postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  --target-env PROD_DB_URL
```

This is a dry run. It writes `backups/restore-<timestamp>.sql` and a matching `.txt` report, and
changes nothing.

Prefer `--target-env` over `--target` for production: a connection string passed on the command
line is visible in `ps` output and stays in your shell history, password included.

**Read the report.** It has five sections:

- **MISSING ROWS** — what would be inserted, each labelled with something recognisable.
- **ARRAY REPAIRS** — see below.
- **SCALAR REPAIRS** — see below.
- **DIVERGED** — rows that exist in both but differ. **Never touched.** Production wins.
- **WARNINGS** — skipped rows, dropped columns, path collisions. Always worth reading.

> **The diff cannot tell an accidental deletion from a deliberate one.** Anything legitimately
> deleted since the backup looks exactly like the accident. The row labels are your only defence —
> read them, and scope the run if anything looks like it should stay deleted.

Scope with `--org <uuid>`, `--table <name>`, or `--id <table>:<uuid>`, all repeatable.

`--limit` (default 500) refuses to proceed above a given number of inserts. It is a blast-radius
fuse: if a run wants to insert far more than you expected, that is information.

### Why there are three kinds of repair

Restoring the rows is not sufficient, because two kinds of damage survive it.

**Array repairs.** Several relationships are unenforced `uuid[]` columns rather than foreign keys —
`orgs.comments`, `hows.how`, `hows.responsible/consulted/informed`, `suggestions.processes`, and
others. The app's `delete_comment` removes the id from its parent's array. So restoring the comment
row alone puts it back in the database but leaves it **invisible in the app**. The repair puts the
id back, in the backup's original order — which matters most for `hows.how`, where the array _is_
the step tree, so a restored step has to return to its original position rather than the end.

**Scalar repairs.** `ON DELETE SET NULL` damage is invisible to a row-level diff. Delete a role that
was some process's `accountable` and the process row **survives** with a null pointer — present in
both databases, so nothing looks missing, and re-inserting the role does not put the pointer back.
This affects `processes.accountable`, `roles.team`, `profiles.supervisor`, `profiles.personid`, and
`suggestions.lead`. Repairs only ever fill a null, so a deliberate reassignment is never overwritten.

## 5. Apply

```sh
npm run restore -- --source ... --target-env PROD_DB_URL --apply
```

It prints the target and the totals, then asks you to type the target hostname. `--yes` skips that
for scripted use.

`--apply` executes **the exact bytes of the file you just reviewed**, in a single transaction. There
is no second code path that could differ from the preview. If anything fails, the whole thing rolls
back and the file stays on disk to be corrected and re-run.

Every statement is idempotent (`on conflict do nothing`, and every update guarded on `is null`), so
re-running is safe.

## 6. Verify

Re-run the dry run. **Success is a report with nothing to do:**

```
Nothing to do: the target already has everything the source does.
```

Then look at the app: the organization loads, the process shows its steps **in the right order**,
and restored comments appear under their parents. Those three checks cover exactly the failure modes
the array repairs exist for.

## Scenarios

**Somebody deleted a few rows.** Scope it: `--org <uuid>` plus `--table` or `--id`. Expect array
repairs — if a comment was deleted through the app, its parent's array lost the id too, and without
the repair the restored comment stays invisible.

**A migration destroyed data.** Fix the schema first; `supabase db push` cannot be rolled back, as
`.github/workflows/production.yaml` warns. The backup predates the migration, so the column sets
will differ and the tool stops. Re-run with `--columns intersect` to restore using only the shared
columns — but **read the warnings**, which name every column being dropped and every column that
will silently take its default.

**An organization was deleted.** `orgid` cascades into eight tables at once — profiles, teams,
roles, assignments, processes, hows, suggestions, comments — so this is a total wipe of that org.
One run with `--org <uuid>` and `--limit` raised deliberately. Two things to check before applying:
skipped rows whose authors' accounts are gone, and the path-collision warning. `orgs.paths` is not
unique and is only checked at read time, so if the org's vanity path was taken by another org since,
restoring it makes **both** unreachable — the org lookup uses `.single()`.

## What this tool will not do

- Update a row that already exists. Ever.
- Delete anything.
- Touch `auth`, or restore a deleted account.
- Reconcile `orgs.paths` for you.
- Prune array entries pointing at rows that no longer exist. It reports them; a dangling id may
  become valid once you restore the next thing.

## Prevention

`npm run snapshot` takes seconds at this data scale. Run it before any risky migration, bulk edit,
or hand-written SQL against production. That is the cheapest way to close the 24-hour gap the daily
backups leave.

Snapshots are written in the same format `restore.js` generates, so a snapshot is itself a runnable
restore script — `psql -f` replays it directly, or you can load it into a scratch database to act as
the `--source` of a later diff.

If accidental deletion ever becomes routine rather than exceptional, the real fix is a `deleted_at`
column on the handful of user-deletable tables. That would make recovery a one-line update and would
make most of this directory unnecessary.

## Rehearsal

Do this after any migration that touches foreign keys, and once a quarter. It runs entirely against
the local stack — **never point any part of it at production.**

Set up two local databases: `postgres` plays production, `rehearsal` plays the restored backup.

```sh
npx supabase start -x storage,imgproxy,analytics,vector,edge-runtime,functions
npx supabase db reset

docker exec supabase_db_adminima pg_dump -U postgres -d postgres \
	--no-owner --no-acl -n public -n auth -n extensions -f /tmp/rehearsal.sql
docker exec supabase_db_adminima createdb -U postgres rehearsal
docker exec supabase_db_adminima psql -U postgres -d rehearsal -q -c \
	'create schema if not exists extensions;
	 create extension if not exists "uuid-ossp" with schema extensions;
	 create extension if not exists pgcrypto with schema extensions;'
docker exec supabase_db_adminima psql -U postgres -d rehearsal -q -f /tmp/rehearsal.sql
```

`--no-owner --no-acl` matters: without it the dump tries to assign ownership to `supabase_admin` and
fails. Creating the extensions by hand matters too — `pg_dump -n` does **not** emit `CREATE
EXTENSION`, so without them every `uuid_generate_v1()` default fails and no table gets created.

The load prints exactly two errors, `schema "extensions" already exists` and `schema "public"
already exists`. Both are expected — they are the schemas you just created by hand. Any _other_
error means the clone is incomplete, so check the row counts before trusting a rehearsal.

Now damage `postgres`, using the seed's fixed UUIDs. Each deletion exercises a case the others do
not:

```sh
docker exec -i supabase_db_adminima psql -U postgres -d postgres -q <<'SQL'
-- A comment on a surviving role, removed the way delete_comment does it.
update public.roles set comments = array_remove(comments, 'a2000000-0000-4000-8000-000000000002'::uuid);
delete from public.comments where id = 'a2000000-0000-4000-8000-000000000002';

-- The MIDDLE child of a how tree, so the repair must restore it to index 1, not append it.
update public.hows set how = array_remove(how, 'f0000000-0000-4000-8000-000000000012'::uuid)
	where id = 'f0000000-0000-4000-8000-000000000001';
delete from public.hows where id = 'f0000000-0000-4000-8000-000000000012';

-- A role that is a process's accountable: the process SURVIVES with a null pointer.
delete from public.roles where id = 'd0000000-0000-4000-8000-000000000002';

-- A profile that another profile reports to.
delete from public.profiles where id = 'b0000000-0000-4000-8000-000000000001';

-- A whole process, which cascades its hows and exercises the processes <-> hows cycle.
delete from public.processes where id = 'e0000000-0000-4000-8000-000000000002';
SQL
```

Then restore, and check it twice:

```sh
LOCAL=postgresql://postgres:postgres@127.0.0.1:54322
npm run restore -- --source $LOCAL/rehearsal --target $LOCAL/postgres
# read backups/restore-<timestamp>.sql, then:
npm run restore -- --source $LOCAL/rehearsal --target $LOCAL/postgres --apply --yes
npm run restore -- --source $LOCAL/rehearsal --target $LOCAL/postgres
```

The third command must report **nothing to do**. That is the tool agreeing with itself, though, so
prove it independently — compare every table:

```sh
for t in orgs profiles teams roles processes hows assignments suggestions comments invites; do
	A=$(docker exec supabase_db_adminima psql -U postgres -d postgres  -tAc \
		"select coalesce(md5(string_agg(x::text,'|' order by x::text)),'empty') from public.$t x")
	B=$(docker exec supabase_db_adminima psql -U postgres -d rehearsal -tAc \
		"select coalesce(md5(string_agg(x::text,'|' order by x::text)),'empty') from public.$t x")
	[ "$A" = "$B" ] && echo "  $t: IDENTICAL" || echo "  $t: DIFFERS"
done
```

Every table must say `IDENTICAL`. Because both databases came from the same deterministic seed, that
is a real equality proof rather than a spot check.

For the largest case, delete the whole organization (`delete from public.orgs`) and restore that —
42 rows across nine tables, including the foreign-key cycle and the composite-key `assignments`
table. It needs `--limit` raised, which is the fuse working as intended.

Clean up with `docker exec supabase_db_adminima dropdb -U postgres rehearsal`.

## Files

| File              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `restore.js`      | Diff two databases, generate SQL, optionally apply it            |
| `snapshot.js`     | Dump a database to a replayable script; read-only                |
| `lib/schema.js`   | The table manifest, in foreign-key order, plus a drift assertion |
| `lib/db.js`       | Connections, TLS, and the preflight checks                       |
| `lib/sql.js`      | Statement generation; unit-tested by `lib/sql.test.ts`           |
| `lib/generate.js` | Assembling a full script, shared by both entry points            |
| `lib/report.js`   | The human-readable report                                        |
| `lib/args.js`     | Flag parsing, and the refusal to write anywhere git tracks       |

Generated files go to `backups/`, which is gitignored. The tooling **refuses** to write anywhere
`git check-ignore` does not cover: these files contain member names and email addresses, and this
repository is public.

Everything talks to Postgres directly rather than through `@supabase/supabase-js`. That is not a
style preference — PostgREST truncates reads at `max_rows` (1000) without saying so, reports success
while inserting zero rows when row level security filters the caller, cannot disable a trigger, and
cannot hold a transaction. Three of those four fail _silently_, which is the one thing a restore
tool cannot afford.
