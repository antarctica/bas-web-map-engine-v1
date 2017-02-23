/* Cambridge OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Digital Database', 'http://opsgis.web.bas.ac.uk/geoserver/add/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Operations GIS', 'http://opsgis.web.bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Polar View', 'http://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Arctic Open Data', 'https://opsgis.web.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('South Georgia GIS', 'https://opsgis.web.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);

/* Rothera OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Digital Database', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/add/wms', 'rothera', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Operations GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Arctic Open Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/arctic/wms', 'rothera', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('South Georgia GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/sggis/wms', 'rothera', TRUE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);

/* Halley OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Digital Database', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/add/wms', 'halley', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Operations GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Arctic Open Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/arctic/wms', 'halley', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('South Georgia GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/sggis/wms', 'halley', TRUE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);

/* JCR OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Antarctic Digital Database', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/add/wms', 'jcr', TRUE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Operations GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, NULL, NULL, NULL, NULL, NULL, 'EPSG:3031', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Arctic Open Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/arctic/wms', 'jcr', TRUE, 'arctic:arctic_coastline','arctic:arctic_graticule', NULL, NULL, NULL, 'EPSG:3995', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('South Georgia GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/sggis/wms', 'jcr', TRUE, 'sggis:sg_coastline','ol', NULL, NULL, NULL, 'EPSG:3762', TRUE);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, admin_user, admin_pass, srs, has_wfs) 
VALUES('Midlatitude Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, 'opsgis:natearth_world_10m_land', 'ol', NULL, NULL, NULL, 'EPSG:3857', FALSE);