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
      -- If there is a how for this process that contains an assignment with this person's ID, they can update it.
      or exists (
        select id 
        from public.hows where 
          hows.processid = _processid AND 
          (select roleid from public.assignments where public.assignments.profileid = public.getProfileID(_orgid)) = ANY(public.hows.responsible)
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
    -- If there is a how for this process that contains an assignment with this person's ID, they can update it.
    or exists (
      select id 
      from hows where 
        hows.processid = processes.id AND 
        (select roleid from assignments where assignments.profileid = getProfileID(orgid)) = ANY(hows.responsible)
    )
  );

alter policy "Any admin, or any person in the org if no one is accountable, o" on processes
  to anon, authenticated using (
    isAdmin(orgid)
    -- If no one is accountable, anyone in the org can update it.
    or (accountable = null and isMember(orgid))
    -- If the person is accountable, they can update it.
    or exists (select roleid from assignments where accountable = roleid and assignments.profileid = getProfileID(orgid))
  );
