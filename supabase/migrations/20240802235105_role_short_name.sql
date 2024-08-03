-- Add a short name to roles for use in URLs and in links.
ALTER TABLE roles ADD COLUMN "short" text not null default '';