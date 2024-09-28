alter policy "Any admin or the person who reported it can update a suggestion" 
on public.suggestions
rename to "allow comments by members";

alter policy "allow comments by members"
on public.suggestions
to anon, authenticated
using (
  ismember(orgid)
);