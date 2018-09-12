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
