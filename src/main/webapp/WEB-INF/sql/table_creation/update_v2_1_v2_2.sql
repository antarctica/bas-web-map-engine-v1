/* Created 17-01-2019 by David - SQL to add the 'bs_theme' column to webmap.maps */
ALTER TABLE webmap.maps ADD COLUMN bs_theme character varying(30);
COMMENT ON COLUMN webmap.maps.bs_theme IS 'Optional bootstrap theme name';
