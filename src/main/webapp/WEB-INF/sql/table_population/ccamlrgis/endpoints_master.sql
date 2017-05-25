INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('CCAMLR GIS', 'http://gis2.ccamlr.org/geoserver/gis/wms', 'hobart', FALSE, 'gis:coastline', NULL, NULL, NULL, NULL, 'EPSG:102020', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);
