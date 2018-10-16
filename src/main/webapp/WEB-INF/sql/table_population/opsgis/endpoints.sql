/* Cambridge OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', FALSE, 'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', 
    NULL, 'EPSG:3031', TRUE, FALSE, 'https://add.data.bas.ac.uk/geoserver/add/wms,http://add.antarctica.ac.uk/geoserver/add/wms', 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Bedmap GIS', 'https://add.data.bas.ac.uk/geoserver/bedmap/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, 'http://add.antarctica.ac.uk/geoserver/bedmap/wms', 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('iStar GIS', 'http://gis.istar.ac.uk/geoserver/istar/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslmagj.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Operations GIS', 'https://opsgis.web.bas.ac.uk/geoserver/opsgis/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, 'http://bslgisa.nerc-bas.ac.uk/geoserver/opsgis/wms', 'http://bslgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Antarctic Peninsula Information Portal (APIP)', 'https://apip.data.bas.ac.uk/geoserver/apip/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, 'http://bslbatgisa.nerc-bas.ac.uk/geoserver/apip/wms,http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms', 'http://bslbatgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('ASPA CIR imagery', 'https://apip.data.bas.ac.uk/geoserver/iws_aspa/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, 'http://bslbatgisa.nerc-bas.ac.uk/geoserver/iws_aspa/wms,http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_aspa/wms','http://bslbatgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('ASPA NDVI imagery', 'https://apip.data.bas.ac.uk/geoserver/aspa_ndvi/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, 'http://bslbatgisa.nerc-bas.ac.uk/geoserver/aspa_ndvi/wms,http://bslbatgis.nerc-bas.ac.uk/geoserver/aspa_ndvi/wms', 'http://bslbatgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('APC Misc Maps', 'https://apip.data.bas.ac.uk/geoserver/iws_apc_misc/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, 'http://bslbatgisa.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms,http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms', 'http://bslbatgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Continent-wide mosaics', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, NULL, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Pan-Antarctic maps', 'http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/PanAntarcticMaps', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, NULL, NULL);

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Scanned maps', 'https://geo.web.bas.ac.uk/geoserver/scanned_maps/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', FALSE, FALSE, 'http://geo.antarctica.ac.uk/geoserver/scanned_maps/wms', 'http://bslmaga.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Polar View', 'https://geos.polarview.aq/geoserver/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, 'http://geos.polarview.aq/geoserver/wms', 'http://bslmagq.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Polar Code', 'https://polarcode.data.bas.ac.uk/geoserver/polarcode/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslmagl.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Thwaites GIS', 'https://thwaitesgis.data.bas.ac.uk/geoserver/gis/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://bslmagr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('CCAMLR GIS', 'https://geo.web.bas.ac.uk/geoserver/ccamlr_gis/wms', 'cambridge', FALSE, NULL, NULL, 
    'https://gis.ccamlr.org/geoserver/wms', 'EPSG:3031', TRUE, FALSE, 'http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms', 'http://bslmaga.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Arctic Open Data', 'https://maps.bas.ac.uk/arctic/wms', 'cambridge', FALSE, 'arctic:arctic_coastline','arctic:arctic_graticule', 
    NULL, 'EPSG:3995', TRUE, FALSE, 'https://add.data.bas.ac.uk/geoserver/arctic/wms,http://add.antarctica.ac.uk/geoserver/arctic/wms', 'https://add.data.bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('South Georgia GIS', 'https://maps.bas.ac.uk/southgeorgia/wms', 'cambridge', FALSE, 'sggis:sg_coastline','ol', 
    NULL, 'EPSG:3762', TRUE, FALSE, 'https://www.sggis.gov.gs/geoserver/sggis/wms,http://www.sggis.gov.gs/geoserver/sggis/wms' , 'https://www.sggis.gov.gs/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Local Geoserver user data', 'http://opsgis.web.bas.ac.uk/geoserver/user/wms', 'cambridge', FALSE, NULL, NULL, 
    NULL, 'EPSG:3031', TRUE, TRUE, 'http://bslgisa.nerc-bas.ac.uk/geoserver/user/wms', 'http://bslgisa.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
VALUES('Midlatitude Data', 'osm', 'cambridge', FALSE, 'osm', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, NULL);

/* Rothera OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Antarctic Digital Database', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/add/wms', 'rothera', TRUE, 
    'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Operations GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, 
    NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Arctic Open Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/arctic/wms', 'rothera', TRUE, 
    'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('User uploaded data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/user/wms', 'rothera', TRUE, 
    NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('South Georgia GIS', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/sggis/wms', 'rothera', TRUE, 
    'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Midlatitude Data', 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver/opsgis/wms', 'rothera', TRUE, 
    'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://rolgis.rothera.nerc-bas.ac.uk/geoserver');

/* Halley OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Antarctic Digital Database', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/add/wms', 'halley', TRUE, 
    'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Operations GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, 
    NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Arctic Open Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/arctic/wms', 'halley', TRUE, 
    'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('South Georgia GIS', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/sggis/wms', 'halley', TRUE, 
    'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Midlatitude Data', 'http://halgis.halley.nerc-bas.ac.uk/geoserver/opsgis/wms', 'halley', TRUE, 
    'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://halgis.halley.nerc-bas.ac.uk/geoserver');

/* JCR OpsGIS */

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Antarctic Digital Database', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/add/wms', 'jcr', TRUE, 
    'add:antarctic_coastline,add:sub_antarctic_coastline','add:antarctic_graticule', NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Operations GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, 
    NULL, NULL, NULL, 'EPSG:3031', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Arctic Open Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/arctic/wms', 'jcr', TRUE, 
    'arctic:arctic_coastline','arctic:arctic_graticule', NULL, 'EPSG:3995', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('South Georgia GIS', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/sggis/wms', 'jcr', TRUE, 
    'sggis:sg_coastline','ol', NULL, 'EPSG:3762', TRUE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');

INSERT INTO webmap.endpoints ("name", url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) 
    VALUES('Midlatitude Data', 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver/opsgis/wms', 'jcr', TRUE, 
    'opsgis:natearth_world_10m_land', 'ol', NULL, 'EPSG:3857', FALSE, FALSE, NULL, 'http://jrlgis.jcr.nerc-bas.ac.uk/geoserver');