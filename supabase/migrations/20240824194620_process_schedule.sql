ALTER TABLE processes ALTER COLUMN repeat TYPE JSONB USING COALESCE(repeat, '[]'::jsonb);
ALTER TABLE processes ALTER COLUMN repeat SET DEFAULT '[]'::jsonb;
ALTER TABLE processes ALTER COLUMN repeat SET NOT NULL;
