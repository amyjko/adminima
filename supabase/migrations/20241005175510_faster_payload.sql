-- Get all of the organization data in a single function call, for efficiency
create or replace function organization_payload(_orgid text)
returns table(payload json)
language plpgsql 
security definer
as $$
declare
    org orgs%ROWTYPE;
begin
    SELECT * INTO org FROM orgs WHERE id::text=_orgid OR _orgid = any(paths);
    IF NOT FOUND THEN 
        RETURN QUERY SELECT json_build_object('payload', null) payload;
        RETURN;
    END IF;
    -- Return a big old payload of data for the organization.
    RETURN QUERY SELECT json_build_object(
        'organization', (SELECT row_to_json(org)),
        'profiles', (SELECT coalesce(json_agg(row_to_json(p)), '[]'::json) FROM profiles p WHERE p.orgid=org.id),
        'roles', (SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) FROM roles r WHERE r.orgid=org.id),
        'assignments', (SELECT coalesce(json_agg(row_to_json(a)), '[]'::json) FROM assignments a WHERE a.orgid=org.id),
        'processes', (SELECT coalesce(json_agg(row_to_json(pr)), '[]'::json) FROM processes pr WHERE pr.orgid=org.id),
        'hows', (SELECT coalesce(json_agg(row_to_json(h)), '[]'::json) FROM hows h WHERE h.orgid=org.id),
        'teams', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM teams t WHERE t.orgid=org.id),
        'suggestions', (SELECT coalesce(json_agg(row_to_json(s)), '[]'::json) FROM suggestions s WHERE s.orgid=org.id)
    ) payload;
    RETURN;
end
$$;