-- Fix the profiles INSERT policy.
--
-- The original policy was:
--   with check (isAdmin(orgid) or not exists(select * from profiles where orgid = id))
-- Inside that subquery, both `orgid` and `id` resolved to the *inner* profiles table, so the
-- predicate was `profiles_1.orgid = profiles_1.id` -- a profile's org id compared to its own
-- primary key, which is never true. That made `not exists(...)` always true, collapsing the
-- policy to `isAdmin(orgid) or true`, which let anyone (including anon) insert a profile into
-- any organization with admin = true.
--
-- The bootstrap case the clause was reaching for is unnecessary: create_org is security definer
-- and inserts the organization's first admin profile itself, bypassing RLS.
drop policy "Admins can insert profiles, or anyone if there are no profiles." on public.profiles;

create policy "Admins can insert profiles." on public.profiles
for insert to anon, authenticated
with check (isAdmin(orgid));

-- Link profiles to people case-insensitively.
--
-- Both linking triggers matched email with exact `=`, so a profile added as `Amy@Example.com`
-- never linked to an account registered as `amy@example.com`. Also scope handle_new_profile's
-- update to the row that was just inserted; it previously updated every profile sharing the email.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles p set personid = pe.id
  from public.people pe
  where p.id = new.id and lower(pe.email) = lower(new.email);
  return new;
end;
$$;

create or replace function public.handle_new_person()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.people (id, email) values (new.id, new.email);
  update public.profiles set personid = new.id where lower(email) = lower(new.email);
  return new;
end;
$$;

-- Support the case-insensitive lookups above.
create index if not exists people_email_lower_idx on public.people (lower(email));
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));

-- Backfill profiles that failed to link because of email casing.
update public.profiles p set personid = pe.id
from public.people pe
where p.personid is null and lower(pe.email) = lower(p.email);
