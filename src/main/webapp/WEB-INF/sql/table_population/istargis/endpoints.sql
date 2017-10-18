INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('iStar GIS', 'http://gis.istar.ac.uk/geoserver/istar/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Operations GIS', 'http://bslgisa.nerc-bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Polar View', 'http://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs, is_user_service, url_aliases) 
VALUES('Marine Geoscience Data System', 'http://gmrt.marine-geo.org/cgi-bin/mapserv?map=/public/mgg/web/gmrt.marine-geo.org/htdocs/services/map/wms_sp_mask.map', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', FALSE, FALSE, NULL);
