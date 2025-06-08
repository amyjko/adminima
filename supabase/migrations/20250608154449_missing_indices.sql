-- Create missing indexes to improve query performance.
create index assignments_profile_idx on assignments(profileid);
create index assignments_role_idx on assignments(roleid);
create index comments_org_idx on comments(orgid);
create index comments_person_idx on comments(who);
create index hows_process_idx on hows(processid);
create index processes_accountable_idx on processes(accountable);
create index processes_how_idx on processes(howid);
create index profiles_supervisor_idx on profiles(supervisor);
create index roles_team_index on roles(team);
create index suggestions_lead_index on suggestions(lead);
create index suggestions_who_idx on suggestions(who);

-- More efficient calls to auth.uid().
alter policy "People are viewable by themselves." 
    on people
    using (id = (select auth.uid()));

alter policy "People can update themselves." 
    on people
    using (id = (select auth.uid()));

alter policy "People can delete themselves." 
    on people
    using (id = (select auth.uid()));

alter policy "Admins can update a user's profile, as can a user of their own profile." 
    on profiles 
    using ((select auth.uid()) = personid or isAdmin(orgid));

alter policy "Admins can delete a profile, as can users of their own profile." 
    on profiles 
    using ((select auth.uid()) = personid or isAdmin(orgid));

alter policy "allow comments by members" 
    on suggestions
    using (isAdmin(orgid) or who = (select auth.uid()));

alter policy "Any admin or the person who reported it can delete a suggestion" 
    on suggestions
    using (isAdmin(orgid) or who = (select auth.uid()));

alter policy "Any admin or the person who reported it can update a comment." 
    on comments
    using (isAdmin(orgid) or who = (select auth.uid()));

alter policy "Any admin or the person who reported it can delete a comment." 
    on comments
    using (isAdmin(orgid) or who = (select auth.uid()));

-- Disallow mutable search paths
create or replace function isAdmin("_orgid" uuid) 
returns boolean 
language sql
security definer set search_path = ''
as $$
  select exists (
    select personid from public.profiles where 
      public.profiles.orgid = _orgid and 
      public.profiles.personid = (select auth.uid()) and
      public.profiles.admin = true
    );
$$;

create or replace function getProfileID("_orgid" uuid) 
returns uuid
language sql
security definer set search_path = ''
as $$
  select id from public.profiles where public.profiles.orgid = _orgid and personid = (select auth.uid())
$$;

create or replace function isEditableHow("_orgid" uuid, "_processid" uuid) 
returns boolean 
language sql
security definer set search_path = ''
as $$
    select (
      public.isAdmin(_orgid)
      -- If no one is accountable, anyone in the org can update it.
      or ((select accountable from public.processes where id = _processid) = null and public.isMember(_orgid))
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

create or replace function public.create_org(adminname text, orgname text, invite uuid, uid uuid, email text)
 returns uuid
 language plpgsql
 security definer set search_path to ''
as $function$
declare
  orgid uuid;
begin
  raise log 'Starting org create';
  -- Invite already used? Return null;
  if not exists (select * from public.invites where id = invite and used = false) then
     raise log 'No valid invite';
     return null;
  end if;
  -- Use the invite
  raise log 'Updating invite';
  update public.invites set used = true, who = uid where id = invite;
  -- Create the organization
  raise log 'Creating the org';
  insert into public.orgs (name) values (orgName) returning id into orgid;
  -- Add the user into the profiles for the organization
  raise log 'Adding the profile';
  insert into public.profiles (orgid, personid, name, email, admin) values (orgid, uid, adminName, email, true);
  -- Return the org id
  return orgid;
end;
$function$
;

create or replace function path_available(_path text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
    if not exists (select from public.orgs where _path = any(paths))
    then
        return true;
    else
        return false;
    end if;
end;
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles set personid = people.id from public.people where public.people.email = new.email AND new.email = public.profiles.email;
  return new;
end;
$$;

create or replace function public.handle_new_person()
returns trigger 
language plpgsql 
security definer set search_path = ''
as $$
begin
  -- Insert the new user into the people table.
  insert into public.people (id, email)
  values (new.id, new.email);
  -- If any profile has this email address, update the profile's personid.
  update public.profiles set personid = new.id where email = new.email;
  -- Return the new row.
  return new;
end;
$$;

create or replace function getVisibility("_orgid" uuid) 
returns visibility
language sql
security definer set search_path = ''
as $$
  select visibility from public.orgs where id = _orgid;
$$;

create or replace function isMember("_orgid" uuid) 
returns boolean 
language sql
security definer set search_path = ''
as $$
  select exists (
    select personid from public.profiles where 
      public.profiles.orgid = _orgid and 
      public.profiles.personid = auth.uid()
    );
$$;