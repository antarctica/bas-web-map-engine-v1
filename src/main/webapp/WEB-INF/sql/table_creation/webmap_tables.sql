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
  id character varying(40) NOT NULL, -- UUID identifier for a map
  name character varying(50) NOT NULL, -- Unique map name (forms last part of map URL)
  title character varying(100), -- Human-friendly title for a map
  description text, -- Longer description of map purpose etc
  version character varying(20), -- Version number
  logo character varying(255), -- URL of a logo image
  favicon character varying(255), -- URL of a favicon image
  repository character varying(255), -- URL of a data download repository
  creation_date timestamp without time zone, -- When map was created
  modified_date timestamp without time zone, -- When map was last modified
  owner_name character varying(150), -- Name of the map owner
  owner_email character varying(150), -- Email address of the map owner
  metadata_url character varying(255), -- URL of a metadata catalogue entry for map
  data json, -- The web map context data
  allowed_usage character varying(10), -- public|login|owner
  allowed_download character varying(10), -- public|login|nobody
  allowed_edit character varying(10), -- login|owner
  infolink character varying(255), -- URL of a background information page about this map
  newslink character varying(255), -- URL of a news information page about this map
  watermark character varying(255), -- URL of an image to use a map watermark
  CONSTRAINT maps_pkey PRIMARY KEY (id),
  CONSTRAINT maps_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.maps
  OWNER TO add;
COMMENT ON TABLE webmap.maps
  IS 'Web map configurations';
COMMENT ON COLUMN webmap.maps.id IS 'UUID identifier for a map';
COMMENT ON COLUMN webmap.maps.name IS 'Unique map name (forms last part of map URL)';
COMMENT ON COLUMN webmap.maps.title IS 'Human-friendly title for a map';
COMMENT ON COLUMN webmap.maps.description IS 'Longer description of map purpose etc';
COMMENT ON COLUMN webmap.maps.version IS 'Version number';
COMMENT ON COLUMN webmap.maps.logo IS 'URL of a logo image';
COMMENT ON COLUMN webmap.maps.favicon IS 'URL of a favicon image';
COMMENT ON COLUMN webmap.maps.repository IS 'URL of a data download repository';
COMMENT ON COLUMN webmap.maps.creation_date IS 'When map was created';
COMMENT ON COLUMN webmap.maps.modified_date IS 'When map was last modified';
COMMENT ON COLUMN webmap.maps.owner_name IS 'Name of the map owner';
COMMENT ON COLUMN webmap.maps.owner_email IS 'Email address of the map owner';
COMMENT ON COLUMN webmap.maps.metadata_url IS 'URL of a metadata catalogue entry for map';
COMMENT ON COLUMN webmap.maps.data IS 'The web map context data';
COMMENT ON COLUMN webmap.maps.allowed_usage IS 'public|login|owner';
COMMENT ON COLUMN webmap.maps.allowed_download IS 'public|login|nobody';
COMMENT ON COLUMN webmap.maps.allowed_edit IS 'login|owner';
COMMENT ON COLUMN webmap.maps.infolink IS 'URL of a background information page about this map';
COMMENT ON COLUMN webmap.maps.newslink IS 'URL of a news information page about this map';
COMMENT ON COLUMN webmap.maps.watermark IS 'URL of an image to use a map watermark';

CREATE TABLE webmap.thumbnails
(
  id serial,
  name character varying(50), -- Name of map to associate thumbnail image with
  mime_type character varying(50), -- Type of image (image/jpg|image/jpeg|image/png|image/gif)
  thumbnail bytea, -- Blob containing actual image data
  CONSTRAINT thumbnails_pkey PRIMARY KEY (id),
  CONSTRAINT thumbnails_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.thumbnails
  OWNER TO add;
COMMENT ON TABLE webmap.thumbnails
  IS 'Repository for map thumbnails';
COMMENT ON COLUMN webmap.thumbnails.name IS 'Name of map to associate thumbnail image with';
COMMENT ON COLUMN webmap.thumbnails.mime_type IS 'Type of image (image/jpg|image/jpeg|image/png|image/gif)';
COMMENT ON COLUMN webmap.thumbnails.thumbnail IS 'Blob containing actual image data';

CREATE TABLE webmap.embedded_maps
(
  id character varying(40) NOT NULL, -- UUID identifier for embedded map
  name character varying(50) NOT NULL, -- Embedded map name (unique) - forms last part of URL
  title character varying(100), -- Human-friendly title for embedded map
  description text, -- Longer description of map purpose etc
  creation_date timestamp without time zone, -- When map was created
  modified_date timestamp without time zone, -- When map was last modified
  owner_name character varying(150), -- Name of the map owner
  owner_email character varying(150), -- Their email address
  width integer, -- Intended width of map when embedded
  height integer, -- Intended height of map when embedded
  embed character varying(100), -- Name of div to embed the map inside
  center character varying(100), -- Initial centre co-ordinates of the map
  zoom integer, -- Initial zoom level of the map
  rotation decimal, -- Initial rotation of the map in degrees
  projection character varying(20), -- EPSG code of the map projection
  proj_extent character varying(100), -- Bounding box of the projection extent
  resolutions character varying(255), -- Array of resolutions for the map gridset
  layers json, -- Configurations for individual map layers
  allowed_usage character varying(10), -- public|login|owner
  allowed_edit character varying(10), -- login|owner
  CONSTRAINT embedded_maps_pkey PRIMARY KEY (id),
  CONSTRAINT embedded_maps_name_unique UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.embedded_maps
  OWNER TO add;
COMMENT ON TABLE webmap.embedded_maps
  IS 'Embedded maps table';
COMMENT ON COLUMN webmap.embedded_maps.id IS 'UUID identifier for embedded map';
COMMENT ON COLUMN webmap.embedded_maps.name IS 'Embedded map name (unique) - forms last part of URL';
COMMENT ON COLUMN webmap.embedded_maps.title IS 'Human-friendly title for embedded map';
COMMENT ON COLUMN webmap.embedded_maps.description IS 'Longer description of map purpose etc';
COMMENT ON COLUMN webmap.embedded_maps.creation_date IS 'When map was created';
COMMENT ON COLUMN webmap.embedded_maps.modified_date IS 'When map was last modified';
COMMENT ON COLUMN webmap.embedded_maps.owner_name IS 'Name of the map owner';
COMMENT ON COLUMN webmap.embedded_maps.owner_email IS 'Their email address';
COMMENT ON COLUMN webmap.embedded_maps.width IS 'Intended width of map when embedded';
COMMENT ON COLUMN webmap.embedded_maps.height IS 'Intended height of map when embedded';
COMMENT ON COLUMN webmap.embedded_maps.embed IS 'Name of div to embed the map inside';
COMMENT ON COLUMN webmap.embedded_maps.center IS 'Initial centre co-ordinates of the map';
COMMENT ON COLUMN webmap.embedded_maps.zoom IS 'Initial zoom level of the map';
COMMENT ON COLUMN webmap.embedded_maps.rotation IS 'Initial rotation of the map in degrees';
COMMENT ON COLUMN webmap.embedded_maps.projection IS 'EPSG code of the map projection';
COMMENT ON COLUMN webmap.embedded_maps.proj_extent IS 'Bounding box of the projection extent';
COMMENT ON COLUMN webmap.embedded_maps.resolutions IS 'Array of resolutions for the map gridset';
COMMENT ON COLUMN webmap.embedded_maps.layers IS 'Configurations for individual map layers';
COMMENT ON COLUMN webmap.embedded_maps.allowed_usage IS 'public|login|owner';
COMMENT ON COLUMN webmap.embedded_maps.allowed_edit IS 'login|owner';

CREATE TABLE webmap.preferences
(
  id serial,
  username character varying(150), -- Username
  distance character varying(10), -- Distance unit preference (km|m|mi|nmi)
  area character varying(10), -- Area unit preference (sq km|m|mi|nmi)
  elevation character varying(10), -- Elevation unit preference (m|ft)
  coordinates character varying(10), -- Co-ordinate unit preference (dd|dms|ddm)
  dates character varying(10), -- Date preference (dd-mm-yyyy|yyyy-mm-dd)
  CONSTRAINT preferences_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.preferences
  OWNER TO add;
COMMENT ON TABLE webmap.preferences
  IS 'User unit preferences';
COMMENT ON COLUMN webmap.preferences.username IS 'Username';
COMMENT ON COLUMN webmap.preferences.distance IS 'Distance unit preference (km|m|mi|nmi)';
COMMENT ON COLUMN webmap.preferences.area IS 'Area unit preference (sq km|m|mi|nmi)';
COMMENT ON COLUMN webmap.preferences.elevation IS 'Elevation unit preference (m|ft)';
COMMENT ON COLUMN webmap.preferences.coordinates IS 'Co-ordinate unit preference (dd|dms|ddm)';
COMMENT ON COLUMN webmap.preferences.dates IS 'Date preference (dd-mm-yyyy|yyyy-mm-dd)';

CREATE TABLE webmap.usermaps
(
  id serial,
  name character varying(50) NOT NULL, -- Name of user custom map (forms last part of URL)
  title character varying(100), -- Title for the map
  description text,  -- Longer description of content, purpose etc
  creation_date timestamp without time zone, -- When map was created
  modified_date timestamp without time zone, -- When map was last modified
  owner_name character varying(150), -- Owner username
  owner_email character varying(150), -- Owner email address
  allowed_usage character varying(10), -- public|login|owner
  allowed_edit character varying(10), -- login|owner
  basemap character varying(50), -- Base map (in webmap.maps table) that this view derives from
  data json, -- Map configuration data
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
  IS 'User saved map views, based on available base maps';
COMMENT ON COLUMN webmap.usermaps.name IS 'Name of user custom map (forms last part of URL)';
COMMENT ON COLUMN webmap.usermaps.title IS 'Title for the map';
COMMENT ON COLUMN webmap.usermaps.description IS 'Longer description of content, purpose etc';
COMMENT ON COLUMN webmap.usermaps.creation_date IS 'When map was created';
COMMENT ON COLUMN webmap.usermaps.modified_date IS 'When map was last modified';
COMMENT ON COLUMN webmap.usermaps.owner_name IS 'Owner username';
COMMENT ON COLUMN webmap.usermaps.owner_email IS 'Owner email address';
COMMENT ON COLUMN webmap.usermaps.allowed_usage IS 'public|login|owner';
COMMENT ON COLUMN webmap.usermaps.allowed_edit IS 'login|owner';
COMMENT ON COLUMN webmap.usermaps.basemap IS 'Base map (in webmap.maps table) that this view derives from';
COMMENT ON COLUMN webmap.usermaps.data IS 'Map configuration data';

CREATE TABLE webmap.userlayers
(
  id character varying(40) NOT NULL, -- UUID identifier for layer,
  caption character varying(100), -- Caption in the layer list
  description text, -- Longer description if required
  upload bytea, -- Actual content (for XML) or null for shapefiles
  filetype character varying(10), -- 3 letter type code (shp|csv|kml|gpx)
  service character varying(255), -- Service URL to access data
  store character varying(100), -- Store name (for shapefiles only)
  layer character varying(100), -- Layer name (for shapefiles only)
  owner character varying(150), -- Owning username
  creation_date timestamp without time zone, -- When layer was uploaded
  modified_date timestamp without time zone, -- Last modified date
  allowed_usage character varying(10), -- public|login|owner
  styledef json -- Style configuration
  CONSTRAINT user_data_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.userlayers
  OWNER TO add;
COMMENT ON TABLE webmap.userlayers
  IS 'Persistent user uploaded data';
COMMENT ON COLUMN webmap.userlayers.id IS 'UUID identifier for layer,';
COMMENT ON COLUMN webmap.userlayers.caption IS 'Caption in the layer list';
COMMENT ON COLUMN webmap.userlayers.description IS 'Longer description if required';
COMMENT ON COLUMN webmap.userlayers.upload IS 'Actual content (for XML) or null for shapefiles';
COMMENT ON COLUMN webmap.userlayers.filetype IS '3 letter type code (shp|csv|kml|gpx)';
COMMENT ON COLUMN webmap.userlayers.service IS 'Service URL to access data';
COMMENT ON COLUMN webmap.userlayers.store IS 'Store name (for shapefiles only)';
COMMENT ON COLUMN webmap.userlayers.layer IS 'Layer name (for shapefiles only)';
COMMENT ON COLUMN webmap.userlayers.owner IS 'Owning username';
COMMENT ON COLUMN webmap.userlayers.creation_date IS 'When layer was uploaded';
COMMENT ON COLUMN webmap.userlayers.modified_date IS 'Last modified date';
COMMENT ON COLUMN webmap.userlayers.allowed_usage IS 'public|login|owner';
COMMENT ON COLUMN webmap.userlayers.styledef IS 'Style configuration';