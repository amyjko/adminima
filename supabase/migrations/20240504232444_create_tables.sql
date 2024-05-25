-- Define the visibility enum for all tables.
create type visibility as enum (
  'public', -- Anyone in the world can see it
  'org', -- Anyone with a role in the organization can see it
  'admin' -- Only admins can see it
);

-- A convenience function for policies to get access to current user's email.
create or replace function auth.email() returns text as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ language sql;

-- A table to store people by email.
create table people (
  id uuid references auth.users on delete cascade not null primary key,
  -- Timestamp of creation time
  "when" timestamp with time zone not null default now(),
  email text not null
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table people
  enable row level security;


-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_person()
returns trigger as $$
begin
  insert into public.people (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_person();

-- Define the markup table, storing all long form text that is loaded on demand.
create table "public"."markup" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "text" text not null default '',
    "editor" uuid default null references people(id) on delete set null
);

alter table "public"."markup" enable row level security;

grant delete on table "public"."markup" to "anon";
grant insert on table "public"."markup" to "anon";
grant references on table "public"."markup" to "anon";
grant select on table "public"."markup" to "anon";
grant trigger on table "public"."markup" to "anon";
grant truncate on table "public"."markup" to "anon";
grant update on table "public"."markup" to "anon";

grant delete on table "public"."markup" to "authenticated";
grant insert on table "public"."markup" to "authenticated";
grant references on table "public"."markup" to "authenticated";
grant select on table "public"."markup" to "authenticated";
grant trigger on table "public"."markup" to "authenticated";
grant truncate on table "public"."markup" to "authenticated";
grant update on table "public"."markup" to "authenticated";

grant delete on table "public"."markup" to "service_role";
grant insert on table "public"."markup" to "service_role";
grant references on table "public"."markup" to "service_role";
grant select on table "public"."markup" to "service_role";
grant trigger on table "public"."markup" to "service_role";
grant truncate on table "public"."markup" to "service_role";
grant update on table "public"."markup" to "service_role";

alter
  publication supabase_realtime add table "public"."markup";


-- Define orgs table
create table "public"."orgs" (
    "id" uuid not null default uuid_generate_v1(),
    "when" timestamp with time zone not null default now(),
    "name" text not null default ''::text,
    "description" uuid default null references markup(id) on delete set null,
    "visibility" visibility not null default 'org',
    -- Comments describing changes to the org
    "comments" uuid[] not null default '{}'
);

alter table "public"."orgs" enable row level security;

CREATE UNIQUE INDEX orgs_pkey ON public.orgs USING btree (id);

alter table "public"."orgs" add constraint "orgs_pkey" PRIMARY KEY using index "orgs_pkey";

grant delete on table "public"."orgs" to "anon";
grant insert on table "public"."orgs" to "anon";
grant references on table "public"."orgs" to "anon";
grant select on table "public"."orgs" to "anon";
grant trigger on table "public"."orgs" to "anon";
grant truncate on table "public"."orgs" to "anon";
grant update on table "public"."orgs" to "anon";

grant delete on table "public"."orgs" to "authenticated";
grant insert on table "public"."orgs" to "authenticated";
grant references on table "public"."orgs" to "authenticated";
grant select on table "public"."orgs" to "authenticated";
grant trigger on table "public"."orgs" to "authenticated";
grant truncate on table "public"."orgs" to "authenticated";
grant update on table "public"."orgs" to "authenticated";

grant delete on table "public"."orgs" to "service_role";
grant insert on table "public"."orgs" to "service_role";
grant references on table "public"."orgs" to "service_role";
grant select on table "public"."orgs" to "service_role";
grant trigger on table "public"."orgs" to "service_role";
grant truncate on table "public"."orgs" to "service_role";
grant update on table "public"."orgs" to "service_role";


-- Enable realtime updates on the orgs table.
alter
  publication supabase_realtime add table "public"."orgs";



-- Define teams table
create table "public"."teams" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "when" timestamp with time zone not null default now(),
    "orgid" uuid not null references orgs(id) on delete cascade,
    "name" text not null default ''::text,
    "description" uuid default null references markup(id) on delete set null,
    -- Comments describing changes to the team
    "comments" uuid[] not null default '{}'
);

alter table "public"."teams" enable row level security;

grant delete on table "public"."teams" to "anon";
grant insert on table "public"."teams" to "anon";
grant references on table "public"."teams" to "anon";
grant select on table "public"."teams" to "anon";
grant trigger on table "public"."teams" to "anon";
grant truncate on table "public"."teams" to "anon";
grant update on table "public"."teams" to "anon";

grant delete on table "public"."teams" to "authenticated";
grant insert on table "public"."teams" to "authenticated";
grant references on table "public"."teams" to "authenticated";
grant select on table "public"."teams" to "authenticated";
grant trigger on table "public"."teams" to "authenticated";
grant truncate on table "public"."teams" to "authenticated";
grant update on table "public"."teams" to "authenticated";

grant delete on table "public"."teams" to "service_role";
grant insert on table "public"."teams" to "service_role";
grant references on table "public"."teams" to "service_role";
grant select on table "public"."teams" to "service_role";
grant trigger on table "public"."teams" to "service_role";
grant truncate on table "public"."teams" to "service_role";
grant update on table "public"."teams" to "service_role";


-- Enable realtime updates on the teams table.
alter
  publication supabase_realtime add table "public"."teams";



-- A table to store people's name, bio, profiles, and status per organization.
create table "public"."profiles" (
    "orgid" uuid not null references orgs(id) on delete cascade,
    "personid" uuid not null references people(id) on delete cascade,
    "name" text not null,
    "bio" uuid default null references markup(id) on delete set null,
    "admin" boolean not null,
    "supervisor" uuid default null references people(id) on delete set null
);


alter table "public"."profiles" enable row level security;

create policy "People are viewable by everyone." on people
  for select using (true);

create policy "Users can insert their own person record." on people
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own person record." on people
  for update using ((select auth.uid()) = id);

-- Create an index on the people table with the pair of the organization ID and user email.
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (orgid, personid);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

grant delete on table "public"."profiles" to "anon";
grant insert on table "public"."profiles" to "anon";
grant references on table "public"."profiles" to "anon";
grant select on table "public"."profiles" to "anon";
grant trigger on table "public"."profiles" to "anon";
grant truncate on table "public"."profiles" to "anon";
grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";
grant insert on table "public"."profiles" to "authenticated";
grant references on table "public"."profiles" to "authenticated";
grant select on table "public"."profiles" to "authenticated";
grant trigger on table "public"."profiles" to "authenticated";
grant truncate on table "public"."profiles" to "authenticated";
grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";
grant insert on table "public"."profiles" to "service_role";
grant references on table "public"."profiles" to "service_role";
grant select on table "public"."profiles" to "service_role";
grant trigger on table "public"."profiles" to "service_role";
grant truncate on table "public"."profiles" to "service_role";
grant update on table "public"."profiles" to "service_role";

create policy "Public profiles are viewable by everyone."
on "public"."profiles"
as permissive
for select
to public
using (true);

create policy "Users can insert their own profile."
on "public"."profiles"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = personid));

create policy "Users can update own profile."
on "public"."profiles"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = personid));

-- Enable realtime updates on the profiles table.
alter
  publication supabase_realtime add table "public"."profiles";


-- Now that we've defined both orgs and tables, we can define org policies based on profiles.
create policy "Anyone can view the organization's metadata."
on "public"."orgs"
as permissive
for select
to public
using (true);

create policy "Anyone can create organizations."
on "public"."orgs"
as permissive
for insert
to public
with check (true);

create policy "Only org admins can update an org."
on "public"."orgs"
as permissive
for update
to public
using (true)
with check (exists (select from profiles where id = profiles.orgid and profiles.personid = auth.uid() and profiles.admin = true));

create policy "Only org admins can delete an org."
on "public"."orgs"
as permissive
for delete
to public using (exists (select from profiles where id = profiles.orgid and profiles.personid = auth.uid() and profiles.admin = true));



-- Define the roles table and configuration.
create table "public"."roles" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "when" timestamp with time zone not null default now(),
    "orgid" uuid not null references orgs(id) on delete cascade,
    "title" text not null,
    "description" uuid default null references markup(id) on delete set null,
    "team" uuid references teams(id) on delete set null,
    -- Comments describing changes to the role
    "comments" uuid[] not null default '{}'
);

alter table "public"."roles" enable row level security;

create policy "Roles are viewable by everyone." on roles
  for select using (true);

create policy "Admins can insert." on roles
  for insert with check (true);

create policy "Admins can update" on roles
  for update using (true);

create policy "Admins can delete" on roles
  for delete using (true);

alter table "public"."roles" add constraint "public_roles_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;
alter table "public"."roles" validate constraint "public_roles_orgid_fkey";

grant delete on table "public"."roles" to "anon";
grant insert on table "public"."roles" to "anon";
grant references on table "public"."roles" to "anon";
grant select on table "public"."roles" to "anon";
grant trigger on table "public"."roles" to "anon";
grant truncate on table "public"."roles" to "anon";
grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";
grant insert on table "public"."roles" to "authenticated";
grant references on table "public"."roles" to "authenticated";
grant select on table "public"."roles" to "authenticated";
grant trigger on table "public"."roles" to "authenticated";
grant truncate on table "public"."roles" to "authenticated";
grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";
grant insert on table "public"."roles" to "service_role";
grant references on table "public"."roles" to "service_role";
grant select on table "public"."roles" to "service_role";
grant trigger on table "public"."roles" to "service_role";
grant truncate on table "public"."roles" to "service_role";
grant update on table "public"."roles" to "service_role";


-- Enable realtime updates on the roles table.
alter
  publication supabase_realtime add table "public"."roles";



create table "public"."assignments" (
    "orgid" uuid not null references orgs(id) on delete cascade,
    "roleid" uuid not null references roles(id) on delete cascade,
    "personid" uuid not null references people(id) on delete cascade
);

alter table "public"."assignments" enable row level security;

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (roleid, personid);
alter table "public"."assignments" add constraint "assignments_pkey" PRIMARY KEY using index "assignments_pkey";

alter table "public"."assignments" add constraint "public_assignments_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;

grant delete on table "public"."assignments" to "anon";
grant insert on table "public"."assignments" to "anon";
grant references on table "public"."assignments" to "anon";
grant select on table "public"."assignments" to "anon";
grant trigger on table "public"."assignments" to "anon";
grant truncate on table "public"."assignments" to "anon";
grant update on table "public"."assignments" to "anon";

grant delete on table "public"."assignments" to "authenticated";
grant insert on table "public"."assignments" to "authenticated";
grant references on table "public"."assignments" to "authenticated";
grant select on table "public"."assignments" to "authenticated";
grant trigger on table "public"."assignments" to "authenticated";
grant truncate on table "public"."assignments" to "authenticated";
grant update on table "public"."assignments" to "authenticated";

grant delete on table "public"."assignments" to "service_role";
grant insert on table "public"."assignments" to "service_role";
grant references on table "public"."assignments" to "service_role";
grant select on table "public"."assignments" to "service_role";
grant trigger on table "public"."assignments" to "service_role";
grant truncate on table "public"."assignments" to "service_role";
grant update on table "public"."assignments" to "service_role";


-- Enable realtime updates on the assignments table.
alter
  publication supabase_realtime add table "public"."assignments";



-- Define the hows table and configuration.
create table "public"."hows" (
    -- A unique ID for how
    "id" uuid not null default uuid_generate_v1() primary key,
    -- When the how was created
    "when" timestamp with time zone not null default now(),
    -- The organization this belongs to; delete it if the organization is deleted
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- The process this belongs to; delete it if the process is deleted
    "processid" uuid not null,
    -- A description of how to do this step
    "what" uuid default null references markup(id) on delete set null,
    -- Visibility of this step
    "visibility" visibility not null default 'org',
    -- A list of how to do this
    "how" uuid[] not null default '{}',
    -- Role accountable for this step
    "accountable" uuid default null references roles(id) on delete set null,
    -- Roles responsible for this step
    "responsible" uuid[] not null default'{}',
    -- Roles consulted for this step
    "consulted" uuid[] not null default '{}',
    -- Roles informed about this step
    "informed" uuid[] not null default '{}'
);

alter table "public"."hows" enable row level security;

create policy "Hows are viewable by everyone with access to the process." on hows
  for select using (true);

create policy "Anyone in the org can insert." on hows
  for insert with check (true);

create policy "Anyone with the role can update" on hows
  for update using (true);

create policy "Anyone with the role can delete" on hows
  for delete using (true);

alter table "public"."hows" add constraint "public_hows_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;

grant delete on table "public"."hows" to "anon";
grant insert on table "public"."hows" to "anon";
grant references on table "public"."hows" to "anon";
grant select on table "public"."hows" to "anon";
grant trigger on table "public"."hows" to "anon";
grant truncate on table "public"."hows" to "anon";
grant update on table "public"."hows" to "anon";

grant delete on table "public"."hows" to "authenticated";
grant insert on table "public"."hows" to "authenticated";
grant references on table "public"."hows" to "authenticated";
grant select on table "public"."hows" to "authenticated";
grant trigger on table "public"."hows" to "authenticated";
grant truncate on table "public"."hows" to "authenticated";
grant update on table "public"."hows" to "authenticated";

grant delete on table "public"."hows" to "service_role";
grant insert on table "public"."hows" to "service_role";
grant references on table "public"."hows" to "service_role";
grant select on table "public"."hows" to "service_role";
grant trigger on table "public"."hows" to "service_role";
grant truncate on table "public"."hows" to "service_role";
grant update on table "public"."hows" to "service_role";


-- Enable realtime updates on the hows table.
alter
  publication supabase_realtime add table "public"."hows";


-- Define the processes table and configuration.
create table "public"."processes" (
    -- A unique ID for this process
    "id" uuid not null default uuid_generate_v1() primary key,
    -- Text representing the process
    "what" text not null default '',
    -- When the process was created
    "when" timestamp with time zone not null default now(),
    -- An optional repeat pattern encoded as text
    "repeat" text default null,
    -- The organization for which this process is defined
    "orgid" uuid not null references orgs(id) on delete cascade,
		-- An emoji representing the theme of the process
		"icon" text not null default '',
    -- Text representing the status of the process
    "status" text not null default '',
    -- Text representing the concern of the process
    "concern" text not null default '',
    -- The how representing the processes steps. Empty by default.
    "how" uuid references hows(id) default null,
    -- Comments describing changes to the process
    "comments" uuid[] not null default '{}'
);

alter table "public"."processes" enable row level security;

create policy "Processes are viewable by everyone." on processes
  for select using (true);

create policy "Anyone in the org can insert." on processes
  for insert with check (true);

create policy "Anyone with the role can update" on processes
  for update using (true);

create policy "Anyone with the role can delete" on processes
  for delete using (true);

alter table "public"."processes" add constraint "public_processes_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;

grant delete on table "public"."processes" to "anon";
grant insert on table "public"."processes" to "anon";
grant references on table "public"."processes" to "anon";
grant select on table "public"."processes" to "anon";
grant trigger on table "public"."processes" to "anon";
grant truncate on table "public"."processes" to "anon";
grant update on table "public"."processes" to "anon";

grant delete on table "public"."processes" to "authenticated";
grant insert on table "public"."processes" to "authenticated";
grant references on table "public"."processes" to "authenticated";
grant select on table "public"."processes" to "authenticated";
grant trigger on table "public"."processes" to "authenticated";
grant truncate on table "public"."processes" to "authenticated";
grant update on table "public"."processes" to "authenticated";

grant delete on table "public"."processes" to "service_role";
grant insert on table "public"."processes" to "service_role";
grant references on table "public"."processes" to "service_role";
grant select on table "public"."processes" to "service_role";
grant trigger on table "public"."processes" to "service_role";
grant truncate on table "public"."processes" to "service_role";
grant update on table "public"."processes" to "service_role";


-- Enable realtime updates on the processes table.
alter
  publication supabase_realtime add table "public"."processes";

-- Define the foreign key constraint on the hows table, now that it's defined.
alter table "public"."hows" add constraint "public_hows_processes_fkey" FOREIGN KEY (processid) REFERENCES processes(id) ON DELETE CASCADE not valid;


-- Define the status enum for changes.
create type status as enum (
  'triage', -- Needs to be reviewed
  'backlog', -- Reviewed, but not being worked on
  'active', -- Being worked on
  'done' -- Done being worked on
);

-- Define the changes table
create table "public"."changes" (
    -- A unique ID for the change
    "id" uuid not null default uuid_generate_v1() primary key,
    -- Person who reported it
    "who" uuid not null references people(id) on delete set null,
    -- Title of the change
    "what" text not null,
    -- Timestamp of creation time
    "when" timestamp with time zone not null default now(),
    -- A description of the problem it concerns
    "description" uuid default null references markup(id),
    -- Status of the change
    "status" status not null default 'triage',
    -- The organization it concerns
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- People watching the change
    "watchers" uuid[] not null default '{}',
    -- Processes it affects
    "processes" uuid[] not null default '{}',
    -- Roles it affects
    "roles" uuid[] not null default '{}',
    -- Comments descripting status updates corresponding to comments table
    "comments" uuid[] not null default '{}'
);

grant delete on table "public"."changes" to "anon";
grant insert on table "public"."changes" to "anon";
grant references on table "public"."changes" to "anon";
grant select on table "public"."changes" to "anon";
grant trigger on table "public"."changes" to "anon";
grant truncate on table "public"."changes" to "anon";
grant update on table "public"."changes" to "anon";

grant delete on table "public"."changes" to "authenticated";
grant insert on table "public"."changes" to "authenticated";
grant references on table "public"."changes" to "authenticated";
grant select on table "public"."changes" to "authenticated";
grant trigger on table "public"."changes" to "authenticated";
grant truncate on table "public"."changes" to "authenticated";
grant update on table "public"."changes" to "authenticated";

grant delete on table "public"."changes" to "service_role";
grant insert on table "public"."changes" to "service_role";
grant references on table "public"."changes" to "service_role";
grant select on table "public"."changes" to "service_role";
grant trigger on table "public"."changes" to "service_role";
grant truncate on table "public"."changes" to "service_role";
grant update on table "public"."changes" to "service_role";

-- Enable realtime updates on the changes table.
alter
  publication supabase_realtime add table "public"."changes";


create table "public"."comments" (
    -- A unique ID for the change
    "id" uuid not null default uuid_generate_v1() primary key,
    -- The organization it concerns
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- Person who wrote it
    "who" uuid not null references people(id),
    -- What they said
    "what" text not null,
    -- Timestamp of creation time
    "when" timestamp with time zone not null default now()
);

grant delete on table "public"."comments" to "anon";
grant insert on table "public"."comments" to "anon";
grant references on table "public"."comments" to "anon";
grant select on table "public"."comments" to "anon";
grant trigger on table "public"."comments" to "anon";
grant truncate on table "public"."comments" to "anon";
grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";
grant insert on table "public"."comments" to "authenticated";
grant references on table "public"."comments" to "authenticated";
grant select on table "public"."comments" to "authenticated";
grant trigger on table "public"."comments" to "authenticated";
grant truncate on table "public"."comments" to "authenticated";
grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";
grant insert on table "public"."comments" to "service_role";
grant references on table "public"."comments" to "service_role";
grant select on table "public"."comments" to "service_role";
grant trigger on table "public"."comments" to "service_role";
grant truncate on table "public"."comments" to "service_role";
grant update on table "public"."comments" to "service_role";

-- Enable realtime updates on the comments table.
alter
  publication supabase_realtime add table "public"."comments";
