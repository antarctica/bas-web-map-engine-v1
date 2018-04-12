/* Created 25-01-2018 by David - SQL to increase the size of all the allowed_<x> columns in existing tables
 * to allow for the new ability to have lists of Geoserver roles, rather than just owner, public, login */

ALTER TABLE webmap.maps ALTER COLUMN allowed_usage TYPE character varying(255);
ALTER TABLE webmap.maps ALTER COLUMN allowed_download TYPE character varying(255);
ALTER TABLE webmap.maps ALTER COLUMN allowed_edit TYPE character varying(255);

ALTER TABLE webmap.embedded_maps ALTER COLUMN allowed_usage TYPE character varying(255);
ALTER TABLE webmap.embedded_maps ALTER COLUMN allowed_edit TYPE character varying(255);

ALTER TABLE webmap.usermaps ALTER COLUMN allowed_usage TYPE character varying(255);
ALTER TABLE webmap.usermaps ALTER COLUMN allowed_edit TYPE character varying(255);

ALTER TABLE webmap.userlayers ALTER COLUMN allowed_usage TYPE character varying(255);

/* Credentials for remote servers are not used - stored in profile files instead */
ALTER TABLE webmap.endpoints DROP COLUMN IF EXISTS admin_user;
ALTER TABLE webmap.endpoints DROP COLUMN IF EXISTS admin_pass;
ALTER TABLE webmap.endpoints ADD COLUMN rest_endpoint character varying(255);
COMMENT ON COLUMN webmap.endpoints.rest_endpoint IS 'Access to Geoserver REST services which may not be accessible via the main URL (e.g. load balanced services)';

