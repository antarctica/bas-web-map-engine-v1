/* Created 20-12-2018 by David - SQL to add the 'bgcolor' column to webmap.maps */
ALTER TABLE webmap.maps ADD COLUMN bgcolor character varying(10);
COMMENT ON COLUMN webmap.maps.bgcolor IS 'Optional map background colour';
