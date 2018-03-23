INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, 'https://add.data.bas.ac.uk', 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'http://bslgisa.nerc-bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('ASPA CIR imagery', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_aspa/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL,'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('ASPA NDVI imagery', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/aspa_ndvi/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('APC Misc Maps', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Pan-Antarctic maps', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/PanAntarcticMaps', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Scanned maps', 'http://geo.antarctica.ac.uk/geoserver/scanned_maps/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL, 'http://geo.antarctica.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Polar View', 'http://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://geos.polarview.aq/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('CCAMLR GIS', 'http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms', 'cambridge', FALSE, NULL, NULL, 'https://gis.ccamlr.org/geoserver/wms', 'EPSG:3031', TRUE, FALSE, NULL, 'http://geo.antarctica.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, 'https://add.data.bas.ac.uk', 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'https://maps.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://www.sggis.gov.gs/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Oracle test WMS', 'http://mapengine-dev.nerc-bas.ac.uk:8080/geoserver/oracle/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://mapengine-dev.nerc-bas.ac.uk:8080/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Local Geoserver user data', 'http://mapengine-dev.nerc-bas.ac.uk:8080/geoserver/user/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, TRUE, NULL, 'http://mapengine-dev.nerc-bas.ac.uk:8080/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, NULL);
