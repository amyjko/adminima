-- Several checks compared a scalar subquery over the person's role assignments to an array of roles,
-- e.g. `(select roleid from assignments where profileid = ...) = ANY(responsible)`. When a person is
-- assigned to more than one role, the subquery returns multiple rows and Postgres raises
-- "more than one row returned by a subquery used as an expression", blocking step edits and reads.
-- These are rewritten as `exists` checks over all of the person's assignments.

create or replace function isEditableHow("_orgid" uuid, "_processid" uuid)
returns boolean
language sql
security definer set search_path = ''
as $$
    select (
      public.isAdmin(_orgid)
      -- If no one is accountable, anyone in the org can update it.
      or ((select accountable from public.processes where id = _processid) is null and public.isMember(_orgid))
      -- If the person is accountable, they can update it.
      or exists (select roleid from public.assignments where (select accountable from public.processes where id = _processid) = roleid and public.assignments.profileid = public.getProfileID(_orgid))
      -- If there is a how for this process that has any of this person's roles responsible, they can update it.
      or exists (
        select 1
        from public.hows where
          hows.processid = _processid AND
          exists (
            select 1 from public.assignments
            where public.assignments.profileid = public.getProfileID(_orgid)
              and public.assignments.roleid = ANY(public.hows.responsible)
          )
      )
    );
$$;

alter policy "Any admin, anyone in the organization if no one is accountable," on processes
  to anon, authenticated using (
    isAdmin(orgid)
    -- If no one is accountable, anyone in the org can update it.
    or (accountable is null and isMember(orgid))
    -- If the person is accountable, they can update it.
    or exists (select roleid from assignments where accountable = roleid and assignments.profileid = getProfileID(orgid))
    -- If there is a how for this process that has any of this person's roles responsible, they can update it.
    or exists (
      select 1
      from hows where
        hows.processid = processes.id AND
        exists (
          select 1 from assignments
          where assignments.profileid = getProfileID(orgid)
            and assignments.roleid = ANY(hows.responsible)
        )
    )
  );

alter policy "Hows are readable by every member of an organization and anyone if the organization is public." on hows
  to anon, authenticated using (
    visibility = 'public' or
    (visibility = 'org' and isMember(orgid)) or
    (visibility = 'admin' and isAdmin(orgid)) or
    (visibility = 'roles' and exists (select 1 from assignments where profileid = getProfileID(orgid) and roleid = ANY(authorized)))
  );

alter policy "Suggestions can be viewed by anyone in the org, or anyone if public." on suggestions
  to anon, authenticated using (
    visibility = 'public' or
    (visibility = 'org' and isMember(orgid)) or
    (visibility = 'admin' and isAdmin(orgid)) or
    (visibility = 'roles' and exists (select 1 from assignments where profileid = getProfileID(orgid) and roleid = ANY(authorized)))
  );
