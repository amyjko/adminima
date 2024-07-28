-- Add a 'paths' colunm to the 'orgs' table that is an array of vanity paths for URLs
ALTER TABLE suggestions ADD COLUMN "lead" uuid references profiles(id) on delete set null;