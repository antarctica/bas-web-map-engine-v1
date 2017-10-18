INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('CCAMLR GIS', 'http://gis2.ccamlr.org/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', 'gis:graticule', NULL, NULL, NULL, 'EPSG:102020', TRUE, FALSE, NULL);

/*
For containerised VMs - insert the geoserver URL below and leave everything else.  Run this on local PG server via psql

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Local GIS', 'http://localhost:8080/geoserver/gis/wms', 'hobart', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:102020', TRUE, FALSE, NULL);
*/

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE, FALSE, NULL);
