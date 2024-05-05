create table "public"."roles" (
    "id" uuid not null default uuid_generate_v1() primary key,
    "orgid" uuid not null references orgs(id) on delete cascade not null,
    "title" text not null,
    "description" text not null
);

alter table "public"."roles" enable row level security;

create policy "Roles are viewable by everyone." on roles
  for select using (true);

create policy "Admins can insert." on roles
  for insert with check (true);

create policy "Admins can update" on roles
  for update using (true);

create policy "Admins can delete" on roles
  for delete using (true);

alter table "public"."roles" add constraint "public_roles_orgid_fkey" FOREIGN KEY (orgid) REFERENCES orgs(id) ON DELETE CASCADE not valid;
alter table "public"."roles" validate constraint "public_roles_orgid_fkey";

grant delete on table "public"."roles" to "anon";
grant insert on table "public"."roles" to "anon";
grant references on table "public"."roles" to "anon";
grant select on table "public"."roles" to "anon";
grant trigger on table "public"."roles" to "anon";
grant truncate on table "public"."roles" to "anon";
grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";
grant insert on table "public"."roles" to "authenticated";
grant references on table "public"."roles" to "authenticated";
grant select on table "public"."roles" to "authenticated";
grant trigger on table "public"."roles" to "authenticated";
grant truncate on table "public"."roles" to "authenticated";
grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";
grant insert on table "public"."roles" to "service_role";
grant references on table "public"."roles" to "service_role";
grant select on table "public"."roles" to "service_role";
grant trigger on table "public"."roles" to "service_role";
grant truncate on table "public"."roles" to "service_role";
grant update on table "public"."roles" to "service_role";

create table "public"."assignments" (
    "roleid" uuid references roles(id) on delete cascade not null,
    "personid" uuid references people(id) on delete cascade not null
);

alter table "public"."assignments" enable row level security;

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (roleid, personid);
alter table "public"."assignments" add constraint "assignments_pkey" PRIMARY KEY using index "assignments_pkey";

grant delete on table "public"."assignments" to "anon";
grant insert on table "public"."assignments" to "anon";
grant references on table "public"."assignments" to "anon";
grant select on table "public"."assignments" to "anon";
grant trigger on table "public"."assignments" to "anon";
grant truncate on table "public"."assignments" to "anon";
grant update on table "public"."assignments" to "anon";

grant delete on table "public"."assignments" to "authenticated";
grant insert on table "public"."assignments" to "authenticated";
grant references on table "public"."assignments" to "authenticated";
grant select on table "public"."assignments" to "authenticated";
grant trigger on table "public"."assignments" to "authenticated";
grant truncate on table "public"."assignments" to "authenticated";
grant update on table "public"."assignments" to "authenticated";

grant delete on table "public"."assignments" to "service_role";
grant insert on table "public"."assignments" to "service_role";
grant references on table "public"."assignments" to "service_role";
grant select on table "public"."assignments" to "service_role";
grant trigger on table "public"."assignments" to "service_role";
grant truncate on table "public"."assignments" to "service_role";
grant update on table "public"."assignments" to "service_role";
