INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('APC Misc Maps', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('CCAMLR GIS', 'http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms', 'cambridge', FALSE, NULL, NULL, 'https://gis.ccamlr.org/geoserver/wms', NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('South Georgia GIS', 'https://maps.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857');
