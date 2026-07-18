-- 1. Commenting should not require permission to EDIT the thing being commented on.
--
-- addComment inserted a comment row, then appended its id to the parent's `comments` array with a
-- plain UPDATE. That UPDATE is gated by the parent table's UPDATE policy -- `isAdmin` for roles and
-- teams, author/lead/admin for suggestions -- so when an ordinary member commented on someone
-- else's change (or on any role), the comment row was created but the link update matched zero
-- rows. PostgREST does not report a zero-row update as an error, so the caller believed the comment
-- posted while it was silently orphaned.
--
-- Do the whole operation in one security definer function that checks membership itself. This also
-- removes a lost-update race: the old code read the comments array on the client and wrote back
-- `[...comments, new]`, so two concurrent comments would clobber each other. array_append is atomic.
create or replace function public.add_comment(_orgid uuid, _what text, _table text, _id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  _commentid uuid;
  _who uuid := (select auth.uid());
  _updated integer;
begin
  if _who is null then
    raise exception 'Must be signed in to comment.' using errcode = '42501';
  end if;

  if not public.ismember(_orgid) then
    raise exception 'Must be a member of the organization to comment.' using errcode = '42501';
  end if;

  -- Guard the identifier before it reaches format(); only these tables have a comments column.
  if _table not in ('orgs', 'roles', 'teams', 'processes', 'suggestions') then
    raise exception 'Cannot comment on %.', _table using errcode = '22023';
  end if;

  insert into public.comments (orgid, what, who)
    values (_orgid, _what, _who)
    returning id into _commentid;

  if _table = 'orgs' then
    -- orgs is the organization itself, so it has an id but no orgid.
    execute 'update public.orgs set comments = array_append(comments, $1) where id = $2'
      using _commentid, _orgid;
  else
    execute format(
      'update public.%I set comments = array_append(comments, $1) where id = $2 and orgid = $3',
      _table
    ) using _commentid, _id, _orgid;
  end if;

  -- Never leave an orphaned comment behind: if the parent did not exist, fail loudly.
  get diagnostics _updated = row_count;
  if _updated = 0 then
    raise exception 'No % with id % in this organization.', _table, _id using errcode = '23503';
  end if;

  return _commentid;
end;
$$;

-- Supabase's default privileges grant execute to anon at creation time, so revoking from PUBLIC is
-- not enough -- anon holds a direct grant. Commenting always requires a signed-in member, so take
-- it away explicitly rather than relying only on the auth.uid() check inside the function.
revoke all on function public.add_comment(uuid, text, text, uuid) from public;
revoke all on function public.add_comment(uuid, text, text, uuid) from anon;
grant execute on function public.add_comment(uuid, text, text, uuid) to authenticated;

-- 1b. Deleting a comment had the mirror-image problem, plus a partial-failure mode.
--
-- deleteComment unlinked the comment from its parent first and only then deleted the row, as two
-- separate statements under the caller's own permissions. Where a member may update the parent but
-- not delete the comment -- a process with no accountable role, for instance -- the unlink
-- succeeded and the delete was denied, so someone else's comment vanished from view while the row
-- survived. Authorize once, then do both steps together.
create or replace function public.delete_comment(_orgid uuid, _table text, _id uuid, _commentid uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  _who uuid := (select auth.uid());
begin
  if _who is null then
    raise exception 'Must be signed in to delete a comment.' using errcode = '42501';
  end if;

  -- Same rule as the comments delete policy: the author, or an admin of the organization.
  if not (
    public.isadmin(_orgid)
    or exists (select 1 from public.comments where id = _commentid and who = _who)
  ) then
    raise exception 'Only the author or an admin can delete a comment.' using errcode = '42501';
  end if;

  if _table not in ('orgs', 'roles', 'teams', 'processes', 'suggestions') then
    raise exception 'Cannot delete comments on %.', _table using errcode = '22023';
  end if;

  if _table = 'orgs' then
    execute 'update public.orgs set comments = array_remove(comments, $1) where id = $2'
      using _commentid, _orgid;
  else
    execute format(
      'update public.%I set comments = array_remove(comments, $1) where id = $2 and orgid = $3',
      _table
    ) using _commentid, _id, _orgid;
  end if;

  delete from public.comments where id = _commentid and orgid = _orgid;
end;
$$;

revoke all on function public.delete_comment(uuid, text, uuid, uuid) from public;
revoke all on function public.delete_comment(uuid, text, uuid, uuid) from anon;
grant execute on function public.delete_comment(uuid, text, uuid, uuid) to authenticated;

-- 2. Anyone in the org could rewrite anyone else's comment.
--
-- The comments UPDATE policy was a bare isMember(orgid), while DELETE was correctly limited to the
-- author or an admin. Match them.
drop policy "allow comments by members" on public.comments;

create policy "Any admin or the person who wrote it can edit a comment." on public.comments
for update to authenticated
using (isAdmin(orgid) or who = (select auth.uid()));

-- 3. Roles were readable by everyone, including anonymous callers, regardless of the
-- organization's visibility. Teams already gate on visibility; roles now match.
--
-- Note this intentionally reverses 20240827235209_public_orgs.sql, which had renamed this policy to
-- "Roles are public." and opened it to `using (true)`. Roles of a private organization describe who
-- does what inside it, which should not be world-readable. Roles of an organization whose
-- visibility is 'public' are still readable anonymously.
drop policy "Roles are public." on public.roles;

create policy "Roles are viewable based on the organization's visibility." on public.roles
for select to anon, authenticated
using (getVisibility(orgid) = 'public' or isMember(orgid));

-- 4. The processes DELETE policy compared `accountable = NULL`, which is always NULL and therefore
-- never true, so the "anyone in the org may delete a process nobody is accountable for" case was
-- dead code. The UPDATE policy on the same table uses `accountable is null` correctly.
drop policy "Any admin, or any person in the org if no one is accountable, or anyone assigned to the accountable role, can delete a process." on public.processes;

create policy "Any admin, or any person in the org if no one is accountable, or anyone assigned to the accountable role, can delete a process." on public.processes
for delete to authenticated
using (
  isAdmin(orgid)
  or (accountable is null and isMember(orgid))
  or exists (
    select assignments.roleid from assignments
    where processes.accountable = assignments.roleid
      and assignments.profileid = getProfileID(assignments.orgid)
  )
);
