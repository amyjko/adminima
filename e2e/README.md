# End-to-end tests

These tests run the real `Organization` API against a real local Supabase database. They cover
PostgREST, row level security, and the triggers that link profiles to people — none of which a
mocked client would catch. Several of the bugs these were written to guard against (an INSERT
policy that let anonymous callers make themselves admins, profile↔person linking that broke on
email casing) were invisible at the TypeScript level and only observable against a live database.

## Running

```sh
npx supabase start     # the tests need the local stack
npm run test:e2e
```

Run one file:

```sh
npx vitest run --config vitest.e2e.config.ts e2e/roles.test.ts
```

The tests connect to `http://127.0.0.1:54321` with the standard local demo keys. Override with
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` if your stack differs. They
never touch a remote database — but note they create and delete real rows, so never point them at
production.

## How a test is built

`harness.ts` provides the shared fixtures:

- `createTestOrg(name)` builds an org through the real `create_org` RPC (burning an invite, the same
  path the app uses) and returns three people: an `admin`, a non-admin `member`, and an `outsider`
  who belongs to no org. Each carries a `db` — an `Organization` bound to their own authenticated
  client — so a test can assert what each role is actually permitted to do.
- `admin` is a service-role client that bypasses RLS. Use it to set up preconditions and to assert
  what really landed in the database, never to perform the operation under test.
- `anonClient()` is a signed-out client for testing the anonymous boundary.
- `cleanup` removes every org and auth user the file created; call it from `afterAll`.

Two conventions matter:

1. **Assert database state, not the absence of an error.** A mutation silently filtered out by RLS
   returns no error, so `expect(error).toBeNull()` alone proves nothing. Read the row back with the
   service-role client and check it.
2. **Every mutating operation gets an access-control test.** Assert that a member, an outsider, or
   an anonymous caller cannot perform admin-only operations, and that the database is unchanged
   afterward.

Files run serially (`fileParallelism: false`) because they share one database.

## Coverage

`coverage.test.ts` enforces completeness: it parses every method declared on `Organization`,
subtracts the pure helpers that never touch the database, and fails if any remaining method is not
referenced by a test. Adding a new CRUD method without a test breaks the suite and names the method.

If you add a genuinely non-database method, add it to that file's `NON_DATABASE` set — a second
assertion fails if that set names a method that no longer exists, so the exemptions can't rot.
