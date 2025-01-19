-- Add an optional column to keep track of the next time at which to review the change.
alter table suggestions
add column review timestamptz default null;