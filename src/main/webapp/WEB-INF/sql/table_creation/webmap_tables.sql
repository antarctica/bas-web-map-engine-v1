CREATE SCHEMA webmap
  AUTHORIZATION add;

COMMENT ON SCHEMA webmap
  IS 'Configuration data for web maps';

CREATE TABLE webmap.endpoints
(
  id serial,
  name character varying(255), -- Name of endpoint
  url character varying(255), -- WMS URL endpoint
  location character varying(10), -- Location of server cambridge|rothera|halley|jcr|es|bi|kep|signy
  low_bandwidth boolean, -- If location is a low bandwidth one
  coast_layers character varying(255), -- Comma-separated list of fully-qualified layer names corresponding to a coastline
  graticule_layer character varying(100), -- Fully-qualified layer name corresponding to graticule ('ol' means use OpenLayers)
  proxied_url character varying(255), -- Original URL which the endpoint proxies, if required (i.e. if CORS not implemented by server)
  admin_user character varying(100), -- Administration/REST username for endpoint
  admin_pass character varying(100), -- Administration/REST password for endpoint
  srs character varying(20), -- Spatial Reference System as an EPSG code
  has_wfs boolean, -- Whether a WFS service is available at the same endpoint (improved user experience on interactive layers possible)
  CONSTRAINT endpoints_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.endpoints
  OWNER TO add;
COMMENT ON TABLE webmap.endpoints
  IS 'WMS endpoints for this server';
COMMENT ON COLUMN webmap.endpoints.name IS 'Name of endpoint';
COMMENT ON COLUMN webmap.endpoints.url IS 'WMS URL endpoint';
COMMENT ON COLUMN webmap.endpoints.location IS 'Location of server cambridge|rothera|halley|jcr|es|bi|kep|signy';
COMMENT ON COLUMN webmap.endpoints.low_bandwidth IS 'If location is a low bandwidth one';
COMMENT ON COLUMN webmap.endpoints.coast_layers IS 'Comma-separated list of fully-qualified layer names corresponding to a coastline';
COMMENT ON COLUMN webmap.endpoints.graticule_layer IS 'Fully-qualified layer name corresponding to graticule (''ol'' means use OpenLayers)';
COMMENT ON COLUMN webmap.endpoints.proxied_url IS 'Original URL which the endpoint proxies, if required (i.e. if CORS not implemented by server)';
COMMENT ON COLUMN webmap.endpoints.admin_user IS 'Administration/REST username for endpoint';
COMMENT ON COLUMN webmap.endpoints.admin_pass IS 'Administration/REST password for endpoint';
COMMENT ON COLUMN webmap.endpoints.srs IS 'Spatial Reference System as an EPSG code';
COMMENT ON COLUMN webmap.endpoints.has_wfs IS 'Whether a WFS service is available at the same endpoint (improved user experience on interactive layers possible)';

CREATE TABLE webmap.maps
(
  id character varying(40) NOT NULL,
  name character varying(50) NOT NULL,
  title character varying(100),
  description text,
  version character varying(20),
  logo character varying(255),
  favicon character varying(255),
  repository character varying(255),
  creation_date timestamp without time zone,
  modified_date timestamp without time zone,
  owner_name character varying(50),
  owner_email character varying(150),
  metadata_url character varying(255),
  data json,
  allowed_usage character varying(10),
  allowed_download character varying(10),
  allowed_edit character varying(10),
  infolink character varying(255),   
  newslink character varying(255),
  watermark character varying(255),
  CONSTRAINT maps_pkey PRIMARY KEY (id),
  CONSTRAINT maps_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.maps
  OWNER TO add;

CREATE TABLE webmap.thumbnails
(
  id serial,
  name character varying(50),
  mime_type character varying(50),
  thumbnail bytea,
  CONSTRAINT thumbnails_pkey PRIMARY KEY (id),
  CONSTRAINT thumbnails_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.thumbnails
  OWNER TO add;
COMMENT ON TABLE webmap.thumbnails
  IS 'Repository for map thumbnails.';

CREATE TABLE webmap.embedded_maps
(
  id character varying(40) NOT NULL,
  name character varying(50) NOT NULL,
  title character varying(100),
  description text, 
  creation_date timestamp without time zone,
  modified_date timestamp without time zone,
  owner_name character varying(50),
  owner_email character varying(150),
  width integer,
  height integer,
  embed character varying(100),
  center character varying(100),
  zoom integer,
  rotation decimal,
  projection character varying(20),
  proj_extent character varying(100),
  resolutions character varying(255),
  layers json,
  allowed_usage character varying(10),
  allowed_edit character varying(10),
  CONSTRAINT embedded_maps_pkey PRIMARY KEY (id),
  CONSTRAINT embedded_maps_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.embedded_maps
  OWNER TO add;

CREATE TABLE webmap.preferences
(
  id serial,
  username character varying(150),
  distance character varying(10),
  area character varying(10),
  elevation character varying(10),
  coordinates character varying(10),
  dates character varying(10),
  CONSTRAINT preferences_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.preferences
  OWNER TO add;
COMMENT ON TABLE webmap.preferences
  IS 'User unit preferences';

CREATE TABLE webmap.usermaps
(
  id serial,
  username character varying(150),
  basemap character varying(50),
  title character varying(100),
  data json,
  modified date,
  permissions character varying(10),
  CONSTRAINT usermaps_pkey PRIMARY KEY (id),
  CONSTRAINT basemap_name_fkey FOREIGN KEY (basemap)
  REFERENCES webmap.maps (name) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.usermaps
  OWNER TO add;
COMMENT ON TABLE webmap.usermaps
  IS 'User saved maps';
