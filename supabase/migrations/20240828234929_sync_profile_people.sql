-- Ensure all profiles have a corresponding personid on matching emails
update profiles
set personid = people.id
from people
where profiles.email = people.email;

-- When a new profile is created, set its person ID to the corresponing person record, if one exists.
create function public.handle_new_profile()
returns trigger as $$
begin
  update profiles set personid = people.id from people where people.email = new.email AND new.email = profiles.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the handler above on profile insert.
create trigger on_profile_create
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();