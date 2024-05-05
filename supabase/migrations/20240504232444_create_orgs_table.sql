create table "public"."orgs" (
    "id" uuid not null default uuid_generate_v1(),
    "name" text not null default ''::text,
    "description" text not null default ''::text
);

alter table "public"."orgs" enable row level security;

CREATE UNIQUE INDEX orgs_pkey ON public.orgs USING btree (id);

alter table "public"."orgs" add constraint "orgs_pkey" PRIMARY KEY using index "orgs_pkey";

grant delete on table "public"."orgs" to "anon";
grant insert on table "public"."orgs" to "anon";
grant references on table "public"."orgs" to "anon";
grant select on table "public"."orgs" to "anon";
grant trigger on table "public"."orgs" to "anon";
grant truncate on table "public"."orgs" to "anon";
grant update on table "public"."orgs" to "anon";

grant delete on table "public"."orgs" to "authenticated";
grant insert on table "public"."orgs" to "authenticated";
grant references on table "public"."orgs" to "authenticated";
grant select on table "public"."orgs" to "authenticated";
grant trigger on table "public"."orgs" to "authenticated";
grant truncate on table "public"."orgs" to "authenticated";
grant update on table "public"."orgs" to "authenticated";

grant delete on table "public"."orgs" to "service_role";
grant insert on table "public"."orgs" to "service_role";
grant references on table "public"."orgs" to "service_role";
grant select on table "public"."orgs" to "service_role";
grant trigger on table "public"."orgs" to "service_role";
grant truncate on table "public"."orgs" to "service_role";
grant update on table "public"."orgs" to "service_role";

create policy "Organizations are viewable by everyone."
on "public"."orgs"
as permissive
for select
to public
using (true);

create policy "Anyone can create organizations."
on "public"."orgs"
as permissive
for insert
to public
with check (true);