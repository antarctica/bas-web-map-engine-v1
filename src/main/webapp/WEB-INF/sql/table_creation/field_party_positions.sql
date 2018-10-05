CREATE TABLE opsgis2.ops_field_deployments
(
  id serial,
  sledge varchar(20),
  season varchar(4),
  fix_date timestamp without time zone,
  updated timestamp without time zone DEFAULT now(),
  people_count integer,
  updater varchar(10),
  lat numeric,
  lon numeric,
  height numeric,
  notes text,
  geometry geometry(POINT, 3031),
  CONSTRAINT fpp_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

ALTER TABLE opsgis2.ops_field_deployments
  OWNER TO add;

COMMENT ON TABLE opsgis2.ops_field_deployments
  IS 'Operations field deployments per season';
COMMENT ON COLUMN opsgis2.ops_field_deployments.sledge IS 'Name of sledge (phonetic alphabet, or a custom name)';
COMMENT ON COLUMN opsgis2.ops_field_deployments.season IS 'E.g. 1819 for the 2018-19 season';
COMMENT ON COLUMN opsgis2.ops_field_deployments.fix_date IS 'When the fix was taken';
COMMENT ON COLUMN opsgis2.ops_field_deployments.updated IS 'Automatic recording of update time, potentially different from the fix date';
COMMENT ON COLUMN opsgis2.ops_field_deployments.people_count IS 'Number of people at the location';
COMMENT ON COLUMN opsgis2.ops_field_deployments.updater IS 'Initials or easily identifiable name for the person doing the update';
COMMENT ON COLUMN opsgis2.ops_field_deployments.lat IS 'Latitude of fix, in decimal degrees';
COMMENT ON COLUMN opsgis2.ops_field_deployments.lon IS 'Longitude of fix, in decimal degrees';
COMMENT ON COLUMN opsgis2.ops_field_deployments.height IS 'Height of fix, in feet';
COMMENT ON COLUMN opsgis2.ops_field_deployments.notes IS 'Other relevant description';

-- FUNCTION: opsgis2.ofd_populate_geometry()

-- DROP FUNCTION opsgis2.ofd_populate_geometry();

CREATE FUNCTION opsgis2.ofd_populate_geometry()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
BEGIN		
    IF NEW.geometry IS NULL THEN
        -- Try to populate the_geom from lat,lon fields
        IF NEW.lat IS NULL AND NEW.lon IS NULL THEN				
            RAISE EXCEPTION 'Lat and lon may not be null';			
        ELSE
            -- Update geometry to match lat,lon
            NEW.geometry := st_transform(st_setsrid(st_makepoint(NEW.lon, NEW.lat),4326), 3031);				
        END IF;		
    END IF;
    RETURN NEW;
END
$BODY$;

ALTER FUNCTION opsgis2.ofd_populate_geometry()
    OWNER TO add;


CREATE TRIGGER populate_geometry_from_lat_lon
    BEFORE INSERT OR UPDATE 
    ON opsgis2.ops_field_deployments
    FOR EACH ROW
    EXECUTE PROCEDURE opsgis2.ofd_populate_geometry();