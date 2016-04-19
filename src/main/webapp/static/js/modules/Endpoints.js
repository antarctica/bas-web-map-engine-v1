/* Deployment location-specific WxS endpoints */

magic.modules.Endpoints = function () {

    return({
        /* Possible WMS endpoints for each projection for each deployment host */
        wms: {
            "default_host": {
                "EPSG:3031": [
                    {"name": "Antarctic Digital Database", "wms": "https://maps.bas.ac.uk/antarctic/wms", "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"], "graticule": "add:antarctic_graticule"},
                    {"name": "Operations GIS", "wms": "http://rolgis.nerc-bas.ac.uk/geoserver/opsgis/wms"},                
                    {"name": "Antarctic Peninsula Information Portal (APIP)", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms"},
                    {"name": "ASPA CIR imagery", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_aspa/wms"},
                    {"name": "ASPA NDVI imagery", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/aspa_ndvi/wms"},
                    {"name": "APC Misc Maps", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms"},
                    {"name": "Continent-wide mosaics", "wms": "http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics"},
                    {"name": "Pan-Antarctic maps", "wms": "http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/PanAntarcticMaps"},
                    {"name": "Scanned maps", "wms": "http://geo.antarctica.ac.uk/geoserver/scanned_maps/wms"},
                    {"name": "Polar View", "wms": "http://geos.polarview.aq/geoserver/wms"},
                    {"name": "CCAMLR GIS", "wms": "http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms"}
                ],
                "EPSG:3995": [
                    {"name": "Arctic Open Data", "wms": "https://maps.bas.ac.uk/arctic/wms", "coast": ["arctic:arctic_coastline"], "graticule": "arctic:arctic_graticule"}
                ],
                "EPSG:3762": [
                    {"name": "South Georgia GIS", "wms": "https://maps.bas.ac.uk/southgeorgia/wms", "coast": ["sggis:sg_coastline"], "graticule": "ol"},
                    {"name": "Antarctic Peninsula Information Portal (APIP)", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms"},
                ],
                "EPSG:3857": [
                    {"name": "OpenStreetMap", "wms": "osm", "coast": "osm"}
                ]
            },
            "rolgis.nerc-bas.ac.uk": {
                "EPSG:3031": [
                    {"name": "Antarctic Digital Database", "wms": magic.config.paths.baseurl + "/geoserver/add/wms", "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"], "graticule": "add:antarctic_graticule"},
                    {"name": "Operations GIS", "wms": magic.config.paths.baseurl + "/geoserver/opsgis/wms"},                              
                    {"name": "Polar View", "wms": "http://geos.polarview.aq/geoserver/wms"}
                ],
                "EPSG:3995": [
                    {"name": "Arctic Open Data", "wms": magic.config.paths.baseurl + "/geoserver/arctic/wms", "coast": ["arctic:arctic_coastline"], "graticule": "arctic:arctic_graticule"}
                ],
                "EPSG:3762": [
                    {"name": "South Georgia GIS", "wms":  magic.config.paths.baseurl + "/geoserver/sggis/wms", "coast": ["sggis:sg_coastline"], "graticule": "ol"},
                    {"name": "Antarctic Peninsula Information Portal (APIP)", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms"},
                ],
                "EPSG:3857": [
                    {"name": "OpenStreetMap", "wms": "osm", "coast": "osm"}
                ]
            },
            "rolgis.rothera.nerc-bas.ac.uk": {
                "EPSG:3031": [
                    {"name": "Antarctic Digital Database", "wms": magic.config.paths.baseurl + "/geoserver/add/wms", "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"], "graticule": "add:antarctic_graticule"},
                    {"name": "Operations GIS", "wms":  magic.config.paths.baseurl + "/geoserver/opsgis/wms"}
                ],
                "EPSG:3995": [
                    {"name": "Arctic Open Data", "wms":  magic.config.paths.baseurl + "/geoserver/arctic/wms", "coast": ["arctic:arctic_coastline"], "graticule": "arctic:arctic_graticule"}
                ],
                "EPSG:3762": [
                    {"name": "South Georgia GIS", "wms":  magic.config.paths.baseurl + "/geoserver/sggis/wms", "coast": ["sggis:sg_coastline"], "graticule": "ol"}
                ],
                "EPSG:3857": [
                    {"name": "Natural Earth Data", "wms": magic.config.paths.baseurl + "/geoserver/opsgis/wms", "coast": "opsgis:natearth_world_10m_land"}
                ]
            }
        },        
        proxy: {
            "https://gis.ccamlr.org/geoserver/wms": true,
            "https://gis.ccamlr.org/geoserver/wfs": true
        },
        /* Default local Geoserver endpoint */
        default_wms: {
            "name": "Local Geoserver WMS",
            "wms": magic.config.paths.baseurl + "/geoserver/wms"
        },
        /**
         * Convenience method to get the allowed endpoint list for host/projection
         * @param {String} projection
         * @returns {Array}
         */
        getWmsEndpoints: function(projection) {
            var wms = this.wms[window.location.hostname] || this.wms["default_host"];
            return(wms[projection] || []);
        },
        /**
         * Get a suitable mid-latitudes coast layer (OSM, except if in a low bandwidth location, in which case default to Natural Earth)
         * @returns {ol.layer}
         */
        getMidLatitudeCoastLayer: function() {            
            var wms = this.wms[window.location.hostname] || this.wms["default_host"];           
            if (wms["EPSG:3857"][0].wms == "osm") {
                /* OpenStreetMap */
                return(new ol.layer.Tile({source: new ol.source.OSM()}));
            } else {
                /* Use locally-hosted Natural Earth data */
                var wmsSource = new ol.source.TileWMS({
                    url: wms["EPSG:3857"][0].wms,
                    params: {
                        "LAYERS": wms["EPSG:3857"][0].coast, 
                        "CRS": "EPSG:3857",
                        "SRS": "EPSG:3857",
                        "VERSION": "1.3.0",
                        "WORKSPACE": "opsgis"   /* NB: needs to be made a parameter somewhere */
                    },            
                    projection: "EPSG:3857"
                });                     
                return(new ol.layer.Tile({source: wmsSource}));        
            } 
        }

    });

}();