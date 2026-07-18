-- Seed data for local development.
--
-- Creates one organization, "Wharf & Willow", populated so that every mutation in the app has
-- something to act on: roles both in and out of teams, a process with a nested how tree and RCI
-- assignments, changes in every status, comments on every kind of parent, and a person who was
-- invited by email but hasn't made an account yet.
--
-- Sign in as test@test.com. The app uses magic links, so no password is involved: enter the address
-- on the login page, then open Mailpit at http://127.0.0.1:54324 and either follow the link or type
-- the six-digit code from the message into the login page.
--
-- Other accounts, all sign in the same way:
--   rosa@test.com  a second admin
--   dev@test.com   a plain member, for checking what non-admins can and cannot do
--   sam@test.com   invited but has NO account: signing in with it creates one and links the
--                  waiting profile, which is how the invite flow is meant to work
--
-- Applied automatically by `npx supabase db reset`. Runs as the postgres superuser, so row level
-- security does not apply here -- which is why the e2e suite tests permissions instead.
--
-- All ids are fixed rather than generated, so a reset always produces the same data and you can
-- link straight to a role or process without hunting for its new id.

-- ---------------------------------------------------------------------------------------------
-- People and accounts
--
-- Inserting into auth.users fires handle_new_person, which creates the matching public.people row.
-- Profiles are created afterwards, so they link to these accounts on insert via handle_new_profile.
-- ---------------------------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'test@test.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'rosa@test.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'dev@test.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

-- GoTrue needs an identity row per account for email sign-in to resolve the user.
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   '{"sub":"11111111-1111-4111-8111-111111111111","email":"test@test.com","email_verified":true,"phone_verified":false}', 'email', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222',
   '{"sub":"22222222-2222-4222-8222-222222222222","email":"rosa@test.com","email_verified":true,"phone_verified":false}', 'email', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333',
   '{"sub":"33333333-3333-4333-8333-333333333333","email":"dev@test.com","email_verified":true,"phone_verified":false}', 'email', now(), now(), now());

-- ---------------------------------------------------------------------------------------------
-- Organization
-- ---------------------------------------------------------------------------------------------

insert into public.orgs (id, name, description, prompt, visibility, paths)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Wharf & Willow',
  'A small bakery and cafe. Everything we do that is not baking lives here.',
  'What should we change about how we work?',
  'org',
  array['wharf-and-willow']
);

-- ---------------------------------------------------------------------------------------------
-- Profiles
--
-- Three linked accounts plus one invited-by-email profile with no account, so the invite flow and
-- the "no account yet" UI both have something to show. sam@test.com has no auth user: sign in with
-- that address to watch handle_new_person link the waiting profile.
-- ---------------------------------------------------------------------------------------------

insert into public.profiles (id, orgid, personid, name, email, bio, admin, supervisor)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Tess Turner', 'test@test.com',
   'Owner. Mostly here to keep the ovens on.', true, null),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222', 'Rosa Marin', 'rosa@test.com',
   'Head baker. Runs the morning shift.', true, 'b0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'Devin Okafor', 'dev@test.com',
   'Front of house.', false, 'b0000000-0000-4000-8000-000000000002'),
  -- Invited, no account yet: personid stays null until they sign in.
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   null, 'Sam Whitlock', 'sam@test.com', '', false, null);

-- ---------------------------------------------------------------------------------------------
-- Teams and roles
--
-- One role deliberately has no team and nobody assigned, so the empty states are visible.
-- ---------------------------------------------------------------------------------------------

insert into public.teams (id, orgid, name, description)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Kitchen', 'Everyone who works behind the pass.'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Front of house', 'Counter, seating, and everything the customer sees.');

insert into public.roles (id, orgid, title, description, team, short)
values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Head Baker', 'Owns the bake schedule and the sourdough starter.',
   'c0000000-0000-4000-8000-000000000001', array['head-baker']),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Opener', 'Unlocks, starts the ovens, sets up the counter.',
   'c0000000-0000-4000-8000-000000000001', array['opener']),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Counter Lead', 'Runs the register and the queue.',
   'c0000000-0000-4000-8000-000000000002', array['counter-lead']),
  -- No team, and nobody assigned: exercises the teamless and unassigned states.
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'Bookkeeper', 'Invoices, payroll, and the quarterly tax filing.', null, array['bookkeeper']);

insert into public.assignments (orgid, roleid, profileid)
values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003');

-- ---------------------------------------------------------------------------------------------
-- Processes
--
-- processes.howid points at a root how and hows.processid points back, so each process is inserted
-- first with a null howid and updated once its root how exists.
-- ---------------------------------------------------------------------------------------------

insert into public.processes (id, orgid, title, concern, accountable, short, state, repeat)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Open the bakery', 'Daily operations', 'd0000000-0000-4000-8000-000000000002',
   array['open'], 'active',
   -- See src/database/Period.ts for the accepted shapes.
   '[{"type":"weekly","weeks":1,"day":1}]'::jsonb),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Close out the register', 'Daily operations', 'd0000000-0000-4000-8000-000000000003',
   array['close'], 'active', '[]'::jsonb),
  -- No accountable role: any member may delete this one, which the DELETE policy allows.
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Quarterly tax filing', 'Money', null, array['tax'], 'active',
   '[{"type":"annually-date","month":3,"date":15}]'::jsonb),
  -- A draft and an archived process, so both non-active states are represented.
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'Hire a weekend baker', 'Hiring', null, array['hiring'], 'draft', '[]'::jsonb),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   'Retire the old loyalty cards', 'Money', null, array['loyalty'], 'archived', '[]'::jsonb);

-- Root hows, one per process. The first carries responsible/consulted/informed roles.
insert into public.hows (id, orgid, processid, what, done, visibility, how, responsible, consulted, informed)
values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Everything that has to happen before the doors open.', 'no', 'org',
   array['f0000000-0000-4000-8000-000000000011','f0000000-0000-4000-8000-000000000012','f0000000-0000-4000-8000-000000000013']::uuid[],
   array['d0000000-0000-4000-8000-000000000002']::uuid[],
   array['d0000000-0000-4000-8000-000000000001']::uuid[],
   array['d0000000-0000-4000-8000-000000000003']::uuid[]),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002',
   'End of day cash and card reconciliation.', 'no', 'org', array[]::uuid[],
   array['d0000000-0000-4000-8000-000000000003']::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003',
   'File with the state and pay any balance due.', 'no', 'admin', array[]::uuid[],
   array[]::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000004',
   'Draft the posting and decide where to run it.', 'no', 'org', array[]::uuid[],
   array[]::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000005',
   'Wind down the punch-card program.', 'no', 'org', array[]::uuid[],
   array[]::uuid[], array[]::uuid[], array[]::uuid[]);

-- Subtasks of "Open the bakery", including one nested a level deeper and a mix of done states.
insert into public.hows (id, orgid, processid, what, done, visibility, how, responsible, consulted, informed)
values
  ('f0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Unlock and disarm the alarm.', 'yes', 'org', array[]::uuid[], array[]::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Start the ovens and the first bake.', 'pending', 'org',
   array['f0000000-0000-4000-8000-000000000121','f0000000-0000-4000-8000-000000000122']::uuid[],
   array['d0000000-0000-4000-8000-000000000001']::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Set up the counter and float the till.', 'no', 'org', array[]::uuid[],
   array['d0000000-0000-4000-8000-000000000003']::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000121', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Feed the starter and check the hydration.', 'yes', 'org', array[]::uuid[], array[]::uuid[], array[]::uuid[], array[]::uuid[]),
  ('f0000000-0000-4000-8000-000000000122', 'a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Score and load the sourdough.', 'no', 'org', array[]::uuid[], array[]::uuid[], array[]::uuid[], array[]::uuid[]);

update public.processes set howid = 'f0000000-0000-4000-8000-000000000001' where id = 'e0000000-0000-4000-8000-000000000001';
update public.processes set howid = 'f0000000-0000-4000-8000-000000000002' where id = 'e0000000-0000-4000-8000-000000000002';
update public.processes set howid = 'f0000000-0000-4000-8000-000000000003' where id = 'e0000000-0000-4000-8000-000000000003';
update public.processes set howid = 'f0000000-0000-4000-8000-000000000004' where id = 'e0000000-0000-4000-8000-000000000004';
update public.processes set howid = 'f0000000-0000-4000-8000-000000000005' where id = 'e0000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------------------------
-- Changes
--
-- `who` references people.id (the account) while `lead` references profiles.id (membership in this
-- organization) -- different tables, which is easy to mix up when writing fixtures by hand.
-- One change per status, so every status filter has a result.
-- ---------------------------------------------------------------------------------------------

insert into public.suggestions (id, orgid, who, what, description, proposal, status, visibility, lead, processes, roles, review)
values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'The morning queue backs up past the door',
   'Between 8 and 9 the line reaches the pavement and people give up and leave.',
   'Open a second register on weekday mornings.', 'triage', 'org',
   'b0000000-0000-4000-8000-000000000001',
   array['e0000000-0000-4000-8000-000000000001']::uuid[],
   array['d0000000-0000-4000-8000-000000000003']::uuid[], null),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222', 'Starter discard is going in the bin',
   'We throw away a litre of discard a week.', 'Add a discard cracker to the counter menu.',
   'backlog', 'org', null, array[]::uuid[], array['d0000000-0000-4000-8000-000000000001']::uuid[], null),
  ('a1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Closing checklist is out of date',
   'It still mentions the old card reader.', 'Rewrite the closing process.', 'active', 'org',
   'b0000000-0000-4000-8000-000000000002', array['e0000000-0000-4000-8000-000000000002']::uuid[],
   array[]::uuid[], now() + interval '14 days'),
  ('a1000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'Label the allergen bins',
   'Nut and seed bins look identical.', 'Colour-code the lids.', 'done', 'org', null,
   array[]::uuid[], array[]::uuid[], null),
  ('a1000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222', 'Buy a second proofing cabinet',
   'We are proofing in the walk-in on weekends.', 'Order the mid-size cabinet.', 'blocked', 'org',
   null, array[]::uuid[], array[]::uuid[], null),
  ('a1000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'Switch to compostable cups',
   'Raised last spring.', 'Move the whole cup line over.', 'declined', 'public', null,
   array[]::uuid[], array[]::uuid[], null),
  -- An admin-only change, so visibility filtering has something to hide.
  ('a1000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Review pay bands before the new year',
   'Only admins should see this one.', 'Draft new bands and discuss.', 'triage', 'admin', null,
   array[]::uuid[], array[]::uuid[], null);

-- ---------------------------------------------------------------------------------------------
-- Comments
--
-- One on each kind of parent (organization, role, process, change). A comment is linked by
-- appending its id to the parent's `comments` array; the app does this through the add_comment
-- function, but here the array is written directly.
-- ---------------------------------------------------------------------------------------------

insert into public.comments (id, orgid, who, what)
values
  ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Adding everything we do outside of baking here so it stops living in my head.'),
  ('a2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222', 'This role also covers the Saturday market stall now.'),
  ('a2000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'Worth timing this properly for a week before we change anything.'),
  ('a2000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Agreed, let us try it for a fortnight and see.'),
  ('a2000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222', 'The new reader arrived, so this is unblocked.');

update public.orgs set comments = array['a2000000-0000-4000-8000-000000000001']::uuid[]
  where id = 'a0000000-0000-4000-8000-000000000001';
update public.roles set comments = array['a2000000-0000-4000-8000-000000000002']::uuid[]
  where id = 'd0000000-0000-4000-8000-000000000001';
update public.processes set comments = array['a2000000-0000-4000-8000-000000000003']::uuid[]
  where id = 'e0000000-0000-4000-8000-000000000001';
update public.suggestions set comments = array['a2000000-0000-4000-8000-000000000004']::uuid[]
  where id = 'a1000000-0000-4000-8000-000000000001';
update public.suggestions set comments = array['a2000000-0000-4000-8000-000000000005']::uuid[]
  where id = 'a1000000-0000-4000-8000-000000000003';

-- ---------------------------------------------------------------------------------------------
-- An unused invite, so creating a second organization can be tried from the UI.
-- ---------------------------------------------------------------------------------------------

insert into public.invites (id, used) values ('a3000000-0000-4000-8000-000000000001', false);
