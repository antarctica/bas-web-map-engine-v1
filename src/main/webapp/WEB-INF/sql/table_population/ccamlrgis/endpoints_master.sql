INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('CCAMLR GIS', 'http://localhost:8080/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', 'gis:graticule', NULL, 'admin', 'cC4M1r615', 'EPSG:102020', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'osm', 'hobart', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);
