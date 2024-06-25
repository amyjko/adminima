CREATE INDEX assignments_orgid_idx ON public.assignments USING btree (orgid);

CREATE INDEX hows_orgid_idx ON public.hows USING btree (orgid);

CREATE INDEX processes_orgid_idx ON public.processes USING btree (orgid);

CREATE INDEX profiles_orgid_idx ON public.profiles USING btree (orgid);

CREATE INDEX profiles_personid_idx ON public.profiles USING btree (personid);

CREATE INDEX roles_orgid_idx ON public.roles USING btree (orgid);

CREATE INDEX suggestions_orgid_idx ON public.suggestions USING btree (orgid);

CREATE INDEX teams_orgid_idx ON public.teams USING btree (orgid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_org(adminname text, orgname text, invite uuid, uid uuid, email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  orgid uuid;
begin
  raise log 'Starting org create';
  -- Invite already used? Return null;
  if not exists (select * from invites where id = invite and used = false) then
     raise log 'No valid invite';
     return null;
  end if;
  -- Use the invite
  raise log 'Updating invite';
  update invites set used = true, who = uid where id = invite;
  -- Create the organization
  raise log 'Creating the org';
  insert into orgs (name) values (orgName) returning id into orgid;
  -- Add the user into the profiles for the organization
  raise log 'Adding the profile';
  insert into profiles (orgid, personid, name, email, admin) values (orgid, uid, adminName, email, true);
  -- Return the org id
  return orgid;
end;
$function$
;


