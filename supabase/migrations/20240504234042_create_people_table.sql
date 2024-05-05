-- A convenience function for policies to get access to current user's email.
create or replace function auth.email() returns text as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ language sql;

-- A table to store people by email.
create table people (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table people
  enable row level security;

create policy "People are viewable by everyone." on people
  for select using (true);

create policy "Users can insert their own person record." on people
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own person record." on people
  for update using ((select auth.uid()) = id);

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



