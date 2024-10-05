ALTER TABLE processes 
    ALTER short DROP DEFAULT,
    ALTER short TYPE text[] USING array[short],
    ALTER SHORT SET DEFAULT '{}'::text[];

ALTER TABLE roles 
    ALTER short DROP DEFAULT,
    ALTER short TYPE text[] USING array[short],
    ALTER SHORT SET DEFAULT '{}'::text[];

UPDATE processes SET short = '{}' WHERE short = array[''];
UPDATE roles SET short = '{}' WHERE short = array[''];