INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'http://www.sggis.gov.gs/geoserver/sggis/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://www.sggis.gov.gs/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia Science', 'http://www.sggis.gov.gs/geoserver/sg_science/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://www.sggis.gov.gs/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031,EPSG:3762', TRUE, FALSE, NULL, 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031,EPSG:3762', TRUE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('APC Misc Maps', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031,EPSG:3762', FALSE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('CCAMLR GIS', 'http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms', 'cambridge', FALSE, NULL, NULL, 'https://gis.ccamlr.org/geoserver/wms', 'EPSG:3031,EPSG:3762', TRUE, FALSE, NULL, 'http://geo.antarctica.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, NULL);
