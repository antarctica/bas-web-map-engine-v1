INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('CCAMLR GIS', 'http://gis2.ccamlr.org/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', 'gis:graticule', NULL, NULL, NULL, 'EPSG:102020', TRUE, FALSE);

/*
For containerised VMs - insert the geoserver URL below and leave everything else.  Run this on local PG server via psql

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('Local GIS', 'http://localhost:8080/geoserver/gis/wms', 'hobart', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:102020', TRUE, FALSE);
*/

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE, FALSE);
