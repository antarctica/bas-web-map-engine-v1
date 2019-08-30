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

INSERT INTO webmap.endpoints (
  name,
  url,
  location,
  low_bandwidth,
  coast_layers,
  graticule_layer,
  proxied_url,
  srs,
  has_wfs,
  is_user_service,
  url_aliases,
  rest_endpoint
) VALUES (
  'Web Map Engine Local GeoServer',
  'http://localhost:8080/geoserver/wms',
  'cambridge',
  false,
  'add:antarctic-coastline-medium-resolution-polygon',
  '',
  '',
  'EPSG:3031',
  true,
  false,
  '',
  'http://localhost:8080/geoserver'
);

-- Web Map Engine maps

INSERT INTO webmap.maps (
  id,
  name,
  title,
  description,
  version,
  logo,
  favicon,
  repository,
  creation_date,
  modified_date,
  owner_name,
  owner_email,
  metadata_url,
  data,
  allowed_usage,
  allowed_download,
  allowed_edit,
  infolink,
  newslink,
  watermark,
  bgcolor,
  bs_theme
) VALUES (
  '630addca-4100-465e-b175-0a47515ba158',
  'test',
  'Test Map',
  'Map for testing',
  '1.0',
  '',
  'bas.ico',
  '',
  '2019-08-14 08:30:58.619735',
  '2019-08-14 08:30:58.619735',
  'admin',
  'basmagic@bas.ac.uk',
  '',
  '{"layers":[{"id":"c89a8ff0-b176-4c7f-af04-e949ba6d0172","name":"Basemap","expanded":true,"base":true,"autoload":false,"autoload_filter":"","autoload_popups":false,"one_only":false,"layers":[{"id":"0894be6f-1148-42a7-aa9c-fb8f6ef52a1c","name":"Sea Mask (medium resolution, polygon)","refresh_rate":0,"legend_graphic":"","min_scale":100,"max_scale":100000000,"opacity":1,"is_visible":true,"is_interactive":false,"is_filterable":false,"source":{"wms_source":"http://localhost:8080/geoserver/wms","feature_name":"add:antarctic-sea-mask-medium-resolution-polygon","style_name":"add:antarctic-sea-mask--base--default","is_base":true,"is_singletile":false,"is_dem":false,"is_time_dependent":false}}]},{"id":"487a9056-beb7-43b8-9b10-ae027e8b5f71","name":"Topography","expanded":true,"base":false,"autoload":false,"autoload_filter":"","autoload_popups":false,"one_only":false,"layers":[{"id":"d8e15a14-bbd4-49f2-a2fa-1b5ddbd10195","name":"Coastline (medium resolution, polygon)","refresh_rate":0,"legend_graphic":"","min_scale":100,"max_scale":100000000,"opacity":1,"is_visible":true,"is_interactive":false,"is_filterable":false,"source":{"wms_source":"http://localhost:8080/geoserver/wms","feature_name":"add:antarctic-coastline-medium-resolution-polygon","style_name":"add:antarctic-coastline--base--default","is_base":false,"is_singletile":false,"is_dem":false,"is_time_dependent":false}}]},{"id":"0dae87b5-6340-454c-9c86-fc1645ccdf4d","name":"Human activity","expanded":true,"base":false,"autoload":false,"autoload_filter":"","autoload_popups":false,"one_only":false,"layers":[{"id":"96dc2212-54bb-4dd6-9eeb-db5a9a90ee05","name":"COMNAP facilities","refresh_rate":0,"legend_graphic":"","min_scale":100,"max_scale":100000000,"opacity":1,"is_visible":true,"is_interactive":false,"is_filterable":false,"source":{"wms_source":"http://localhost:8080/geoserver/wms","feature_name":"general:antarctic-comnap-facilities","style_name":"general:antarctic-facilities--base--default","is_base":false,"is_singletile":false,"is_dem":false,"is_time_dependent":false}}]}],"controls":["zoom_world","zoom_in","zoom_out","box_zoom","feature_info","graticule"],"center":[0,0],"zoom":0,"projection":"EPSG:3031","proj_extent":[-5000000,-5000000,5000000,5000000],"resolutions":[11200,5600,2800,1400,560,280,140,56,28,14,5.6,2.8,1.4,0.56],"rotation":0}',
  'public',
  'owner,admin',
  'owner,admin',
  '',
  '',
  '',
  '#ffffff',
  'inverse'
);
