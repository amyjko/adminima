-- Stop members from promoting themselves to administrator.
--
-- The profiles UPDATE policy is:
--   using (auth.uid() = personid or isAdmin(orgid))
-- That gates the ROW, not the COLUMNS. A person always matches `auth.uid() = personid` on their own
-- profile, which they need in order to edit their own name and bio -- but it also let them set
-- `admin = true` on themselves, escalating to organization admin without any admin's involvement.
--
-- Postgres RLS policies cannot restrict individual columns, so guard the privileged columns with a
-- trigger instead: changing `admin` or `supervisor` requires already being an admin of the org.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (new.admin is distinct from old.admin or new.supervisor is distinct from old.supervisor)
     -- A null uid means the service role or a security definer trigger (e.g. profile/person
     -- linking), not an end user. Anonymous callers cannot reach here: the RLS policy above
     -- already filters out every row for them.
     and (select auth.uid()) is not null
     and not public.isadmin(old.orgid)
  then
    raise exception 'Only organization admins can change admin status or supervisor.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;

create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();
