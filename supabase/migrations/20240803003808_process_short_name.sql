-- Add a short name to processes for use in URLs and in links.
ALTER TABLE processes ADD COLUMN "short" text not null default '';