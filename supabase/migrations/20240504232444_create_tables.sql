-- A convenience function for policies to get access to current user's email.
create or replace function auth.email() returns text as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ language sql;


-- Define orgs table
create table "public"."orgs" (
    "id" uuid not null default uuid_generate_v1(),
    "name" text not null default ''::text,
    "description" text not null default ''::text
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




-- A table to store people by email.
create table people (
  id uuid references auth.users on delete cascade not null primary key,
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


-- A table to store people's name, bio, profiles, and status per organization.
-- Delete if organization or user is deleted.
create table "public"."profiles" (
    "orgid" uuid references orgs(id) on delete cascade not null,
    "personid" uuid references people(id) on delete cascade not null,
    "name" text not null,
    "bio" text not null,
    "admin" boolean not null,
    "supervisor" uuid references people(id) on delete set null default null
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

create table "public"."roles" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "orgid" uuid not null references orgs(id) on delete cascade not null,
    "title" text not null,
    "description" text not null
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

create table "public"."assignments" (
    "roleid" uuid references roles(id) on delete cascade not null,
    "personid" uuid references people(id) on delete cascade not null
);

alter table "public"."assignments" enable row level security;

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (roleid, personid);
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
