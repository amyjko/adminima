-- Add a 'paths' colunm to the 'orgs' table that is an array of vanity paths for URLs
ALTER TABLE orgs ADD COLUMN paths text[] not null default array[]::text[];

-- Create an index on the orgs column for quick retrieval of matching organizations.
CREATE INDEX orgs_paths_idx ON orgs USING GIN (paths);