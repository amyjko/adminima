ALTER TABLE processes ALTER COLUMN repeat TYPE JSONB USING to_jsonb(COALESCE(repeat, '[]'::text));
ALTER TABLE processes ALTER COLUMN repeat SET DEFAULT '[]'::jsonb;
ALTER TABLE processes ALTER COLUMN repeat SET NOT NULL;
