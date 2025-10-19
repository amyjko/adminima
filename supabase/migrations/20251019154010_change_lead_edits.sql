alter policy "allow comments by members" on suggestions rename to "suggestions update";
alter policy "suggestions update" on suggestions
to anon, authenticated 
using (isAdmin(orgid) or who = auth.uid() or lead = (select id from profiles where personid = auth.uid()))
with check (true);

-- Fix incorrect table on RLS for comments
alter policy "Any admin or the person who reported it can update a comment." on comments rename to "allow comments by members";
alter policy "allow comments by members"
on public.comments
to anon, authenticated
using (
  ismember(orgid)
);

alter policy "Any admin or the person who reported it can delete a suggestion." on suggestions rename to "suggestions delete";
alter policy "suggestions delete" on suggestions
to anon, authenticated using (isAdmin(orgid) or who = auth.uid() or lead = (select id from profiles where personid = auth.uid()));