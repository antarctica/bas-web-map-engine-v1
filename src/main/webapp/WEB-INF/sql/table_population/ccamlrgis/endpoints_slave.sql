INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('CCAMLR GIS', 'http://gis2.ccamlr.org/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', 'gis:graticule', NULL, NULL, NULL, 'EPSG:102020', TRUE);

/*
For containerised VMs - insert the geoserver URL below and leave everything else.  Run this on local PG server via psql

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Local GIS', 'http://localhost:8080/geoserver/gis/wms', 'hobart', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:102020', TRUE);
*/

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);
