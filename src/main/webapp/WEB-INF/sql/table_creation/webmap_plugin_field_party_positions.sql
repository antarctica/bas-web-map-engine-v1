CREATE SCHEMA IF NOT EXISTS webmap;

COMMENT ON SCHEMA webmap
  IS 'Configuration data for web maps';

SET search_path TO webmap, public;


CREATE TABLE webmap.field_deployments
(
  id serial,
  sledge varchar(20),
  season varchar(4),
  fix_date date,
  updated timestamp without time zone DEFAULT now(),
  people_count integer,
  updater varchar(10),
  lat numeric,
  lon numeric,
  height numeric,
  notes text,
  geometry public.geometry(POINT, 3031),
  CONSTRAINT fpp_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
COMMENT ON TABLE webmap.field_deployments
  IS 'Operations field deployments per season';
COMMENT ON COLUMN webmap.field_deployments.sledge IS 'Name of sledge (phonetic alphabet, or a custom name)';
COMMENT ON COLUMN webmap.field_deployments.season IS 'E.g. 1819 for the 2018-19 season';
COMMENT ON COLUMN webmap.field_deployments.fix_date IS 'When the fix was taken';
COMMENT ON COLUMN webmap.field_deployments.updated IS 'Automatic recording of update time, potentially different from the fix date';
COMMENT ON COLUMN webmap.field_deployments.people_count IS 'Number of people at the location';
COMMENT ON COLUMN webmap.field_deployments.updater IS 'Initials or easily identifiable name for the person doing the update';
COMMENT ON COLUMN webmap.field_deployments.lat IS 'Latitude of fix, in decimal degrees';
COMMENT ON COLUMN webmap.field_deployments.lon IS 'Longitude of fix, in decimal degrees';
COMMENT ON COLUMN webmap.field_deployments.height IS 'Height of fix, in feet';
COMMENT ON COLUMN webmap.field_deployments.notes IS 'Other relevant description';

CREATE FUNCTION webmap.field_deployments_populate_geometry()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE
AS $BODY$
BEGIN
    -- Try to populate the_geom from lat,lon fields
    IF NEW.lat IS NULL AND NEW.lon IS NULL THEN
        RAISE EXCEPTION 'Lat and lon may not be null';
    ELSE
        -- Update geometry to match lat,lon
        NEW.geometry := st_transform(st_setsrid(st_makepoint(NEW.lon, NEW.lat),4326), 3031);
    END IF;
    RETURN NEW;
END
$BODY$;

CREATE TRIGGER populate_geometry_from_lat_lon
    BEFORE INSERT OR UPDATE
    ON webmap.field_deployments
    FOR EACH ROW
    EXECUTE PROCEDURE webmap.field_deployments_populate_geometry();

CREATE TABLE webmap.field_deployments_history
(
  fp_id integer,
  sledge varchar(20),
  season varchar(4),
  fix_date date,
  updated timestamp without time zone DEFAULT now(),
  people_count integer,
  updater varchar(10),
  lat numeric,
  lon numeric,
  height numeric,
  notes text,
  actiontype varchar(10)
)
WITH (
  OIDS=FALSE
);

CREATE FUNCTION webmap.field_deployments_write_undo()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO webmap.field_deployments_history
        (SELECT id, sledge, season, fix_date, CURRENT_TIMESTAMP, people_count, updater, lat, lon, height, notes, 'deleted'
        FROM webmap.field_deployments WHERE id = OLD.id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO webmap.field_deployments_history
        (SELECT id, sledge, season, fix_date, CURRENT_TIMESTAMP, people_count, updater, lat, lon, height, notes, 'updated'
        FROM webmap.field_deployments WHERE id = NEW.id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END
$BODY$;
COMMENT ON FUNCTION webmap.field_deployments_write_undo()
    IS 'Saves the a fix record pre-edit/delete';

CREATE TRIGGER write_to_history
    BEFORE DELETE OR UPDATE
    ON webmap.field_deployments
    FOR EACH ROW
    EXECUTE PROCEDURE webmap.field_deployments_write_undo();
