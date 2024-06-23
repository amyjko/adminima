-- Define the visibility enum for all tables.
create type visibility as enum (
  'public', -- Anyone in the world can see it
  'org', -- Anyone with a role in the organization can see it
  'people', -- Only specified people
  'teams', -- Only specified teams
  'roles', --- Only specified roles
  'admin' -- Only admins can see it
);

-- A convenience function for policies to get access to current user's email.
create or replace function auth.email() returns text as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ language sql;

-- A table to store people by email.
create table "public"."people" (
  id uuid references auth.users on delete cascade not null primary key,
  -- Timestamp of creation time
  "when" timestamp with time zone not null default now(),
  email text not null
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table people
  enable row level security;

create policy "People are viewable by themselves." on people
  for select to anon, authenticated using (id = auth.uid());

create policy "People can update themselves." on people
  for update to anon, authenticated using (id = auth.uid());

create policy "People can delete themselves." on people
  for delete to anon, authenticated using (id = auth.uid());


-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_person()
returns trigger as $$
begin
  -- Insert the new user into the people table.
  insert into public.people (id, email)
  values (new.id, new.email);
  -- If any profile has this email address, update the profile's personid.
  update public.profiles set personid = new.id where email = new.email;
  -- Return the new row.
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_person();

-- Define invite code table to store invite codes.
create table "public"."invites" (
  -- Generate a primary key that doubles as the invite code.
  "id" uuid not null default uuid_generate_v1() primary key,
  -- Keep track of when the code was used.
  "when" timestamp with time zone not null default now(),
  -- Whether the invite is used
  "used" boolean not null default false,
  -- Keep track of who used the invite code.
  "who" uuid default uuid_nil()
);

grant delete on table "public"."invites" to "anon";
grant insert on table "public"."invites" to "anon";
grant references on table "public"."invites" to "anon";
grant select on table "public"."invites" to "anon";
grant trigger on table "public"."invites" to "anon";
grant truncate on table "public"."invites" to "anon";
grant update on table "public"."invites" to "anon";

grant delete on table "public"."invites" to "authenticated";
grant insert on table "public"."invites" to "authenticated";
grant references on table "public"."invites" to "authenticated";
grant select on table "public"."invites" to "authenticated";
grant trigger on table "public"."invites" to "authenticated";
grant truncate on table "public"."invites" to "authenticated";
grant update on table "public"."invites" to "authenticated";

grant delete on table "public"."invites" to "service_role";
grant insert on table "public"."invites" to "service_role";
grant references on table "public"."invites" to "service_role";
grant select on table "public"."invites" to "service_role";
grant trigger on table "public"."invites" to "service_role";
grant truncate on table "public"."invites" to "service_role";
grant update on table "public"."invites" to "service_role";

alter table "public"."invites" enable row level security;

create policy "No one can read these but superusers." on invites 
for select to anon, authenticated
using (false);

create policy "No one can insert these but super users." on invites 
for insert to anon, authenticated
with check (false);

create policy "No one can update except super users" on invites 
for update to anon, authenticated
using (false);

create policy "Only super users can delete." on invites 
for delete to anon, authenticated
using (false);


-- Define orgs table
create table "public"."orgs" (
    "id" uuid not null default uuid_generate_v1(),
    "when" timestamp with time zone not null default now(),
    "name" text not null default ''::text,
    -- The description of the organization
    "description" text not null default ''::text,
    -- The suggestion prompt
    "prompt" text not null default ''::text,
    -- Visibility of the org
    "visibility" visibility not null default 'org',
    -- Which roles are authorized to view, if not public, org, or admin
    "authorized" uuid[] not null default '{}',
    -- Comments describing changes to the org
    "comments" uuid[] not null default '{}'
);

alter table "public"."orgs" enable row level security;

create unique index orgs_pkey ON public.orgs USING btree (id);

alter table "public"."orgs" add constraint "orgs_pkey" PRIMARY KEY using index "orgs_pkey";

-- Enable realtime updates on the orgs table.
alter
  publication supabase_realtime add table "public"."orgs";

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

-- Get an organization's visibility
-- Define a function to check if someone is a member of an organization
create function getVisibility("_orgid" uuid) 
returns visibility
language sql
as $$
  select visibility from orgs where id = _orgid;
$$;

-- Create a new organization 
create or replace function create_org(adminName text, orgName text, invite uuid, uid uuid, email text)
returns uuid
language plpgsql
security definer set search_path = public, pg_temp
as $$
declare
  orgid uuid;
begin
  -- Invite already used? Return null;
  if not exists (select * from invites where id = invite and used = false) then
     return null;
  end if;
  -- Use the invite
  update invites set used = true, who = uid where id = invite;
  -- Create the organization
  insert into orgs (name) values (orgName) returning id into orgid;
  -- Add the user into the profiles for the organization
  insert into profiles (orgid, personid, name, email, admin) values (orgid, uid, adminName, email, true);
  -- Return the org id
  return orgid;
end;
$$;


-- A table to store people's name, bio, profiles, and status per organization.
create table "public"."profiles" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- An optional link to the person this corresponds to in auth
    "personid" uuid null default null references people(id) on delete cascade,
    "name" text not null default ''::text,
    "email" text not null default ''::text,
    "bio" text not null default ''::text,
    "admin" boolean not null,
    "supervisor" uuid default null references profiles(id) on delete set null
);


alter table "public"."profiles" enable row level security;

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

-- Define a function to check if someone is a member of an organization
create function isMember("_orgid" uuid) 
returns boolean 
language sql
as $$
  select exists (
    select personid from profiles where 
      profiles.orgid = _orgid and 
      profiles.personid = auth.uid()
    );
$$;

-- Define a function to get someone's profile ID for the given organization, if it exists.
create function getProfileID("_orgid" uuid) 
returns uuid
language sql
as $$
  select id from profiles where profiles.orgid = _orgid and personid = auth.uid()
$$;


-- Define a function to check if someone is an admin
create function isAdmin("_orgid" uuid) 
returns boolean 
language sql
as $$
  select exists (
    select personid from profiles where 
      profiles.orgid = _orgid and 
      profiles.personid = auth.uid() and
      profiles.admin = true
    );
$$;

create policy "Public profiles are viewable by everyone." on profiles 
for select to anon, authenticated
using (true);

create policy "Admins can insert profiles, or anyone if there are no profiles." on profiles 
for insert to anon, authenticated
with check (isAdmin(orgid) or not exists(select * from profiles where orgid = id));

create policy "Admins can update a user's profile, as can a user of their own profile." on profiles 
for update to anon, authenticated
using (auth.uid() = personid or isAdmin(orgid));

create policy "Admins can delete a profile, as can users of their own profile." on profiles 
for delete to anon, authenticated
using (auth.uid() = personid or isAdmin(orgid));

-- Enable realtime updates on the profiles table.
alter
  publication supabase_realtime add table "public"."profiles";

-- Define teams table
create table "public"."teams" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "when" timestamp with time zone not null default now(),
    "orgid" uuid not null references orgs(id) on delete cascade,
    "name" text not null default ''::text,
    "description" text not null default ''::text,
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

create policy "Teams are viewable based on organization's policy." on teams
  for select to anon, authenticated using (getVisibility(orgid) = 'public' or isMember(orgid));

create policy "Admins can create teams." on teams
  for insert to anon, authenticated with check (isAdmin(orgid));

create policy "Admins can update teams." on teams
  for update to anon, authenticated using (isAdmin(orgid));

  create policy "Admins can delete teams." on teams
  for delete to anon, authenticated using (isAdmin(orgid));

-- Enable realtime updates on the teams table.
alter
  publication supabase_realtime add table "public"."teams";


-- Now that we've defined both orgs and profiles, we can define org policies based on profiles.
create policy "If public or no one is added to an organization, anyone can view an organization's metadata. Otherwise any member can view." on orgs
for select to anon, authenticated using (visibility = 'public' or isMember(id) or not exists (select * from profiles where orgid = id));

create policy "Anyone can create organizations." on orgs
for insert to anon, authenticated with check (true);

create policy "Only admins can update an organization." on orgs
for update to anon, authenticated using (isAdmin(id));

create policy "Only admins can delete an organization." on orgs
for delete to anon, authenticated using (isAdmin(id));

-- Define the roles table and configuration.
create table "public"."roles" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "when" timestamp with time zone not null default now(),
    "orgid" uuid not null references orgs(id) on delete cascade,
    "title" text not null,
    "description" text not null default ''::text,
    "team" uuid references teams(id) on delete set null,
    -- Comments describing changes to the role
    "comments" uuid[] not null default '{}'
);

alter table "public"."roles" enable row level security;

create policy "Roles are viewable by everyone if public, by members otherwise." on roles
  for select to anon, authenticated using (getVisibility(orgid) = 'public' or isMember(orgid));

create policy "Admins can insert." on roles
  for insert to anon, authenticated with check (isAdmin(orgid));

create policy "Admins can update" on roles
  for update to anon, authenticated using (isAdmin(orgid));

create policy "Admins can delete" on roles
  for delete to anon, authenticated using (isAdmin(orgid));


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
    "profileid" uuid not null references profiles(id) on delete cascade
);

alter table "public"."assignments" enable row level security;

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (roleid, profileid);
alter table "public"."assignments" add constraint "assignments_pkey" PRIMARY KEY using index "assignments_pkey";

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


create policy "Roles are viewable by anyone in the organization, or everyone if public." on assignments
  for select to anon, authenticated 
  using (getVisibility(orgid) = 'public' or isMember(orgid));

create policy "Admins can insert." on assignments
  for insert to anon, authenticated 
  with check (isAdmin(orgid));

create policy "Admins can update" on assignments
  for update to anon, authenticated 
  using (isAdmin(orgid));

create policy "Admins can delete" on assignments
  for delete to anon, authenticated 
  using (isAdmin(orgid));



-- Define the states for hows.
create type completion as enum (
  'no', -- Anyone in the world can see it
  'pending', -- Anyone with a role in the organization can see it
  'yes' -- Only admins can see it
);

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
    "what" text not null default '',
    -- Status of this step
    "done" completion not null default 'no',
    -- Visibility of this step
    "visibility" visibility not null default 'org',
    -- Which roles are authorized, if not public, org, or admin
    "authorized" uuid[] not null default '{}',
    -- A list of how to do this
    "how" uuid[] not null default '{}',
    -- Roles responsible for this step
    "responsible" uuid[] not null default'{}',
    -- Roles consulted for this step
    "consulted" uuid[] not null default '{}',
    -- Roles informed about this step
    "informed" uuid[] not null default '{}'
);

alter table "public"."hows" enable row level security;

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
    -- The organization for which this process is defined
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- The short title of the process
    "title" text not null default '',
    -- When the process was created
    "when" timestamp with time zone not null default now(),
    -- An optional repeat pattern encoded as text
    "repeat" text default null,
		-- An emoji representing the theme of the process
		"icon" text not null default '',
    -- Text representing the concern of the process
    "concern" text not null default '',
    -- Who is accountable for this process's outcome
    "accountable" uuid default null references roles(id) on delete set null,
    -- The how representing the processes steps. Empty by default.
    "howid" uuid references hows(id) default null,
    -- Comments describing changes to the process
    "comments" uuid[] not null default '{}'
);

alter table "public"."processes" enable row level security;

create policy "Processes are readable by everyone in an organization and anyone if the organization is public." on processes
  for select to anon, authenticated using (getVisibility(orgid) = 'public' or isMember(orgid));

create policy "Anyone in the organization can insert new processes." on processes
  for insert to anon, authenticated with check (isMember(orgid));

create policy "Any admin, anyone in the organization if no one is accountable, or anyone in the organization with a role that is accountable or responsible for the process." on processes
  for update to anon, authenticated using (
    isAdmin(orgid)
    -- If no one is accountable, anyone in the org can update it.
    or (accountable = null and isMember(orgid))
    -- If the person is accountable, they can update it.
    or exists (select roleid from assignments where accountable = roleid and assignments.profileid = getProfileID(orgid))
    -- If there is a how for this process that contains an assignment with this person's ID, they can update it.
    or exists (
      select id 
      from hows where 
        hows.processid = processes.id AND 
        (select roleid from assignments where assignments.profileid = getProfileID(orgid)) = ANY(hows.responsible)
    )
  );

create policy "Any admin, or any person in the org if no one is accountable, or the person accountable." on processes
  for delete to anon, authenticated using (
    isAdmin(orgid)
    -- If no one is accountable, anyone in the org can update it.
    or (accountable = null and isMember(orgid))
    -- If the person is accountable, they can update it.
    or exists (select roleid from assignments where accountable = roleid and assignments.profileid = getProfileID(orgid))
  );

alter table "public"."processes" add constraint "public_processes_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;

-- Now that the processes table is defined, create the reference in the hows table.
alter table "public"."hows" add constraint "public_hows_proceses_fkey" FOREIGN KEY (processid) REFERENCES processes(id) ON DELETE CASCADE not valid;


-- Create a generic function that checks if someone can edit or a delete a how
create function isEditableHow("_orgid" uuid, "_processid" uuid) 
returns boolean 
language sql
as $$
    select (
      isAdmin(_orgid)
      -- If no one is accountable, anyone in the org can update it.
      or ((select processes.accountable from processes where id = _processid) = null and isMember(_orgid))
      -- If the person is accountable, they can update it.
      or exists (select roleid from assignments where (select processes.accountable from processes where id = _processid) = roleid and assignments.profileid = getProfileID(_orgid))
      -- If there is a how for this process that contains an assignment with this person's ID, they can update it.
      or exists (
        select id 
        from hows where 
          hows.processid = _processid AND 
          (select roleid from assignments where assignments.profileid = getProfileID(_orgid)) = ANY(hows.responsible)
      )
    );
$$;

create policy "Hows are readable by every member of an organization and anyone if the organization is public." 
on hows
  for select to anon, authenticated using 
  (
    visibility = 'public' or 
    (visibility = 'org' and isMember(orgid)) or 
    (visibility = 'admin' and isAdmin(orgid)) or 
    (visibility = 'roles' and (select roleid from assignments where profileid = getProfileID(orgid)) = ANY(authorized))
  );

create policy "Anyone in the organization can insert new processes." 
on hows
for insert to anon, authenticated with check (isEditableHow(orgid, processid));

create policy "Any admin, anyone in the organization if no one is accountable, or anyone in the organization with a role that is accountable or responsible for the process." 
on hows
for update to anon, authenticated using (isEditableHow(orgid, processid));

create policy "Any admin, or any person in the org if no one is accountable, or the person accountable." 
on hows
for delete to anon, authenticated using (isEditableHow(orgid, processid));


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


-- Define the status enum for suggestions.
create type status as enum (
  'triage', -- Needs to be reviewed
  'backlog', -- Reviewed, but not being worked on
  'active', -- Being worked on
  'done' -- Done being worked on
);

-- Define the suggestions table
create table "public"."suggestions" (
    -- A unique ID for the change
    "id" uuid not null default uuid_generate_v1() primary key,
    -- Person who reported it
    "who" uuid not null references people(id) on delete set null,
    -- Title of the change
    "what" text not null default ''::text,
    -- Timestamp of creation time
    "when" timestamp with time zone not null default now(),
    -- A description of the problem it concerns
    "description" text not null default ''::text,
    -- Status of the change
    "status" status not null default 'triage',
    -- Who the change is visible to
    "visibility" visibility not null default 'org',
    -- Who is authorized, if not public, org, or admin
    "authorized" uuid[] not null default '{}',
    -- The organization it concerns
    "orgid" uuid not null references orgs(id) on delete cascade,
    -- Processes it affects
    "processes" uuid[] not null default '{}',
    -- Roles it affects
    "roles" uuid[] not null default '{}',
    -- People watching the change
    "watchers" uuid[] not null default '{}',
    -- Comments descripting status updates corresponding to comments table
    "comments" uuid[] not null default '{}'
);

grant delete on table "public"."suggestions" to "anon";
grant insert on table "public"."suggestions" to "anon";
grant references on table "public"."suggestions" to "anon";
grant select on table "public"."suggestions" to "anon";
grant trigger on table "public"."suggestions" to "anon";
grant truncate on table "public"."suggestions" to "anon";
grant update on table "public"."suggestions" to "anon";

grant delete on table "public"."suggestions" to "authenticated";
grant insert on table "public"."suggestions" to "authenticated";
grant references on table "public"."suggestions" to "authenticated";
grant select on table "public"."suggestions" to "authenticated";
grant trigger on table "public"."suggestions" to "authenticated";
grant truncate on table "public"."suggestions" to "authenticated";
grant update on table "public"."suggestions" to "authenticated";

grant delete on table "public"."suggestions" to "service_role";
grant insert on table "public"."suggestions" to "service_role";
grant references on table "public"."suggestions" to "service_role";
grant select on table "public"."suggestions" to "service_role";
grant trigger on table "public"."suggestions" to "service_role";
grant truncate on table "public"."suggestions" to "service_role";
grant update on table "public"."suggestions" to "service_role";

-- Enable realtime updates on the suggestions table.
alter publication supabase_realtime add table "public"."suggestions";

alter table "public"."suggestions" enable row level security;

create policy "Suggestions can be viewed by anyone in the org, or anyone if public." 
on suggestions
  for select to anon, authenticated using 
  (
    visibility = 'public' or 
    (visibility = 'org' and isMember(orgid)) or 
    (visibility = 'admin' and isAdmin(orgid)) or 
    (visibility = 'roles' and (select roleid from assignments where profileid = getProfileID(orgid)) = ANY(authorized))
  );

create policy "Anyone can insert new suggestions." 
on suggestions
for insert to anon, authenticated with check (true);

create policy "Any admin or the person who reported it can update a suggestion." 
on suggestions
for update to anon, authenticated using (isAdmin(orgid) or who = auth.uid());

create policy "Any admin or the person who reported it can delete a suggestion." 
on suggestions
for delete to anon, authenticated using (isAdmin(orgid) or who = auth.uid());


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

alter table "public"."comments" enable row level security;

create policy "Comments can be viewed by anyone in the org, or anyone if public." 
on comments
for select to anon, authenticated using (getVisibility(orgid) = 'public' or isMember(orgid));

create policy "Anyone can insert comments if a member of the org, or if the org is public" 
on comments
for insert to anon, authenticated with check (getVisibility(orgid) = 'public' or  isMember(orgid));

create policy "Any admin or the person who reported it can update a comment." 
on comments
for update to anon, authenticated using (isAdmin(orgid) or who = auth.uid());

create policy "Any admin or the person who reported it can delete a comment." 
on comments
for delete to anon, authenticated using (isAdmin(orgid) or who = auth.uid());
