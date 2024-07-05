drop policy "If public or no one is added to an organization, anyone can vie" on "public"."orgs";

create policy "If public or no one is added to an organization, anyone can vie"
on "public"."orgs"
as permissive
for select
to anon, authenticated
using (((visibility = 'public'::visibility) OR ismember(id) OR (NOT (EXISTS ( SELECT profiles.id,
    profiles.orgid,
    profiles.personid,
    profiles.name,
    profiles.email,
    profiles.bio,
    profiles.admin,
    profiles.supervisor
   FROM profiles
  WHERE (profiles.orgid = orgs.id))))));



