INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('iStar GIS', 'http://gis.istar.ac.uk/geoserver/istar/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Operations GIS', 'http://bslgisa.nerc-bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs) 
VALUES('Polar View', 'http://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031');
