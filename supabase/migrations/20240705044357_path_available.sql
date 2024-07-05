-- Return true if there's an org with this path
create or replace function path_available(_path text)
returns boolean
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
    if not exists (select from orgs where _path = any(paths))
    then
        return true;
    else
        return false;
    end if;
end;
$$;
