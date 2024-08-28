alter policy "If public or no one is added to an organization, anyone can vie" 
on public.orgs
rename to "Anyone can view organization metadata.";

alter policy "Anyone can view organization metadata." 
on public.orgs
to anon, authenticated
using (true);

alter policy "Processes are readable by everyone in an organization and anyon" 
on public.processes
rename to "If public or a member";

alter policy "If public or a member"
on public.processes
to anon, authenticated
using (
    ismember(orgid) OR (select visibility from hows where id = processes.howid) = 'public' OR (getvisibility(orgid) = 'public'::visibility)
);

alter policy "Roles are viewable by everyone if public, by members otherwise." 
on public.roles
rename to "Roles are public.";

alter policy "Roles are public."
on public.roles
to anon, authenticated
using (
  true
);