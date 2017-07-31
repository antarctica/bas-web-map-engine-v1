INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('CCAMLR GIS', 'http://localhost:8080/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', 'gis:graticule', NULL, 'admin', 'cC4M1r615', 'EPSG:102020', TRUE, FALSE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('User uploaded data', 'http://localhost:8080/geoserver/user/wms', 'hobart', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:102020', TRUE, TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service) 
VALUES('Midlatitude Data', 'osm', 'hobart', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE, FALSE);