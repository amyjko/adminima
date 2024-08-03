-- Define the status enum for processes.
create type state as enum (
  'draft', -- Still being worked on, not yet active
  'active', -- Offical process
  'archived' -- No longer active
);

-- Add a state to processes
ALTER TABLE processes ADD COLUMN "state" state not null default 'draft';