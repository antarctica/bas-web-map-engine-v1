-- Web Map Engine roles
INSERT INTO webmap.roles (name, parent) VALUES ('bas', null);
INSERT INTO webmap.roles (name, parent) VALUES ('magic', null);

-- Web Map Engine role properties
INSERT INTO webmap.role_props (rolename, propname, propvalue) VALUES ('bas', 'internal', 'yes');
INSERT INTO webmap.role_props (rolename, propname, propvalue) VALUES ('bas', 'type', 'superuser');
INSERT INTO webmap.role_props (rolename, propname, propvalue) VALUES ('magic', 'internal', 'yes');
INSERT INTO webmap.role_props (rolename, propname, propvalue) VALUES ('magic', 'type', 'admin');

-- Web Map Engine users

INSERT INTO webmap.user_roles (username, rolename) VALUES ('admin', 'magic');

-- Web Map Engine endpoints

INSERT INTO webmap.endpoints (id, name, url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) VALUES (60, 'Antarctic Digital Database', 'https://maps.bas.ac.uk/antarctic/wms', 'cambridge', false, 'add:antarctic_coastline,add:sub_antarctic_coastline', 'add:antarctic_graticule', null, 'EPSG:3031', true, false, 'https://add.data.bas.ac.uk/geoserver/add/wms,http://add.antarctica.ac.uk/geoserver/add/wms', 'https://add.data.bas.ac.uk/geoserver');

-- Web Map Engine maps

INSERT INTO webmap.maps (id, name, title, description, version, logo, favicon, repository, creation_date, modified_date, owner_name, owner_email, metadata_url, data, allowed_usage, allowed_download, allowed_edit, infolink, newslink, watermark, bgcolor, bs_theme) VALUES ('1e155678-ae26-4b1e-810a-161fce9ef347', 'test_map', 'Test Map', 'Map for testing', '1.0', '', 'bas.ico', '', '2019-08-14 08:30:58.619735', '2019-08-14 08:30:58.619735', 'admin', 'magic@bas.ac.uk', '', '{"layers":[{"id":"3fbfba27-47f7-47b6-bf59-ae430e3d15e1","name":"Base layers","expanded":true,"base":true,"layers":[{"id":"649b6aea-efb0-49d1-bf45-bcc90e3c42da","name":"Hillshade and bathymetry","is_visible":true,"source":{"wms_source":"https://maps.bas.ac.uk/antarctic/wms","feature_name":"add:antarctic_hillshade_and_bathymetry","is_base":true}}]},{"id":"894e010b-8699-45c7-8ff8-526e5642e3c7","name":"Topo layers","expanded":true,"layers":[{"id":"5fa46c21-f3d2-451b-bc8a-d897290191ad","name":"Coastline","is_visible":true,"source":{"wms_source":"https://maps.bas.ac.uk/antarctic/wms","feature_name":"add:antarctic_coastline"}},{"id":"7820ea9b-96e5-45f2-b2b2-f958e979f504","name":"Sub-Antarctic coastline","is_visible":true,"source":{"wms_source":"https://maps.bas.ac.uk/antarctic/wms","feature_name":"add:sub_antarctic_coastline"}}]}],"controls":["zoom_world","zoom_in","zoom_out","box_zoom","feature_info","graticule"],"center":[0,0],"zoom":0,"projection":"EPSG:3031","proj_extent":[-5000000,-5000000,5000000,5000000],"resolutions":[11200,5600,2800,1400,560,280,140,56,28,14,5.6,2.8,1.4,0.56],"rotation":0}', 'public', 'owner,admin', 'owner,admin', 'http://www.example.com', '', '', '#ffffff', 'inverse');
