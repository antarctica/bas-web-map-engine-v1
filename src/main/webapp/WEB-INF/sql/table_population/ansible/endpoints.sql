INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('South Georgia GIS', 'https://maps.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);
