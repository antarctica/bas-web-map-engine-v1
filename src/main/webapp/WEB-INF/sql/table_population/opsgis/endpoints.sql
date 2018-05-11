/* Cambridge OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'http://opsgis.web.bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://opsgis.web.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslbatgis.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Polar View', 'http://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://geos.polarview.aq/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'https://maps.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'https://www.sggis.gov.gs/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'http://opsgis.web.bas.ac.uk/geoserver/user/wms', 'cambridge', FALSE, NULL, NULL, NULL, 'EPSG:3031', TRUE, TRUE, NULL, 'http://opsgis.web.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, NULL);

/* Rothera OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/add/wms', 'rothera', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/arctic/wms', 'rothera', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/sggis/wms', 'rothera', TRUE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

/* Halley OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/add/wms', 'halley', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/arctic/wms', 'halley', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/sggis/wms', 'halley', TRUE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

/* JCR OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/add/wms', 'jcr', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/arctic/wms', 'jcr', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/sggis/wms', 'jcr', TRUE, 'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');