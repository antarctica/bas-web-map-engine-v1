/* WxS endpoints */

magic.modules.Endpoints = function () {

    return({
        /* Possible WMS endpoints for each projection for each deployment host */
        wms: {
            "default_host": {
                "EPSG:3031": [
                    {"name": "Antarctic Digital Database", bandwidth: "high", "wms": "https://maps.bas.ac.uk/antarctic/wms", "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"], "graticule": "add:antarctic_graticule"},
                    {"name": "Operations GIS", bandwidth: "high", "wms": "http://bslgisa.nerc-bas.ac.uk/geoserver/opsgis/wms"},                
                    {"name": "Antarctic Peninsula Information Portal (APIP)", bandwidth: "high", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms"},
                    {"name": "ASPA CIR imagery", bandwidth: "high", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_aspa/wms"},
                    {"name": "ASPA NDVI imagery", bandwidth: "high", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/aspa_ndvi/wms"},
                    {"name": "APC Misc Maps", bandwidth: "high", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/iws_apc_misc/wms"},
                    {"name": "Continent-wide mosaics", bandwidth: "high", "wms": "http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/Mosaics"},
                    {"name": "Pan-Antarctic maps", bandwidth: "high", "wms": "http://bslmagb.nerc-bas.ac.uk/erdas-iws/ogc/wms/PanAntarcticMaps"},
                    {"name": "Scanned maps", bandwidth: "high", "wms": "http://geo.antarctica.ac.uk/geoserver/scanned_maps/wms"},
                    {"name": "Polar View", bandwidth: "high", "wms": "http://geos.polarview.aq/geoserver/wms"},
                    {"name": "CCAMLR GIS", bandwidth: "high", "wms": "http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms"},
                    {"name": "Antarctic Digital Database", bandwidth: "low", "wms": magic.config.paths.baseurl + "/geoserver/add/wms", "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"], "graticule": "add:antarctic_graticule"},
                    {"name": "Operations GIS", bandwidth: "low", "wms":  magic.config.paths.baseurl + "/geoserver/opsgis/wms"}
                ],
                "EPSG:3995": [
                    {"name": "Arctic Open Data", bandwidth: "high", "wms": "https://maps.bas.ac.uk/arctic/wms", "coast": ["arctic:arctic_coastline"], "graticule": "arctic:arctic_graticule"},
                    {"name": "Arctic Open Data", bandwidth: "low", "wms":  magic.config.paths.baseurl + "/geoserver/arctic/wms", "coast": ["arctic:arctic_coastline"], "graticule": "arctic:arctic_graticule"}
                ],
                "EPSG:3762": [
                    {"name": "South Georgia GIS", bandwidth: "high", "wms": "https://maps.bas.ac.uk/southgeorgia/wms", "coast": ["sggis:sg_coastline"], "graticule": "ol"},
                    {"name": "South Georgia GIS", bandwidth: "low", "wms":  magic.config.paths.baseurl + "/geoserver/sggis/wms", "coast": ["sggis:sg_coastline"], "graticule": "ol"},
                    {"name": "Antarctic Peninsula Information Portal (APIP)", bandwidth: "high", "wms": "http://bslbatgis.nerc-bas.ac.uk/geoserver/apip/wms"},
                ],
                "EPSG:3857": [
                    {"name": "Midlatitude Data", bandwidth: "high", "wms": "osm", "coast": "osm"},
                    {"name": "Midlatitude Data", bandwidth: "low", "wms": magic.config.paths.baseurl + "/geoserver/opsgis/wms", "coast": "opsgis:natearth_world_10m_land"}
                ]
            }
        },
        proxy: {
            "http://geo.antarctica.ac.uk/geoserver/ccamlr_gis/wms": "https://gis.ccamlr.org/geoserver/wms"
        },
        /* Default local Geoserver endpoint */
        default_wms: {
            "name": "Local Geoserver WMS",
            "wms": magic.config.paths.baseurl + "/geoserver/wms"
        },
        /**
         * Queries hostname to decide whether this is a low-bandwidth (i.e. self-contained from a data point of view) location
         * @returns {Boolean}
         */
        lowBandwidthLocation: function() {
            var lb = ["rothera", "halley", "jcr", "es", "kep", "bi", "signy"];                            
            var host = window.location.hostname;
            for (var i = 0; i < lb.length; i++) {
                if (host.indexOf("." + lb[i] + ".") >= 0) {
                    return(true);
                }
            }
            return(false);
        },
        /**
         * Convenience method to get the allowed endpoint list for host/projection
         * @param {String} projection
         * @returns {Array}
         */
        getWmsEndpoints: function(projection) {
            var filteredEps = [];
            var wmsEps = this.wms["default_host"][projection] || [];
            if (wmsEps.length > 0) {
                var lb = this.lowBandwidthLocation();
                filteredEps = jQuery.grep(wmsEps, function(ep, idx) {
                    return((ep.bandwidth == "low" && lb) || (ep.bandwidth == "high" && !lb));
                });
            }
            return(filteredEps);
        }, 
        /**
         * Get a suitable service WMS endpoint depending on location bandwidth
         * @param {String} service
         * @param {String} projection
         * @returns {String}
         */
        getWmsServiceUrl: function(service, projection) {
            var lb = this.lowBandwidthLocation() ? "low" : "high";
            var candidates = jQuery.grep(this.getWmsEndpoints(projection), function(ep, idx) {
                return(ep.bandwidth == lb && ep.name.toLowerCase() == service.toLowerCase());
            });
            return((candidates.length > 0) ? candidates[0].wms : "");            
        },
        /**
         * Get a suitable mid-latitudes coast layer (OSM, except if in a low bandwidth location, in which case default to Natural Earth)
         * @returns {ol.layer}
         */
        getMidLatitudeCoastLayer: function() {   
            var lb = this.lowBandwidthLocation();
            if (lb) {
                var lb3857 = jQuery.grep(this.wms["default_host"]["EPSG:3857"], function(ep, idx) {
                   return(ep.bandwidth == "low");
                });
                if (lb3857.length > 0) {
                    /* Use locally-hosted Natural Earth data */
                    var wmsSource = new ol.source.TileWMS({
                        url: lb3857[0].wms,
                        params: {
                            "LAYERS": lb3857[0].coast, 
                            "CRS": "EPSG:3857",
                            "SRS": "EPSG:3857",
                            "VERSION": "1.3.0",
                            "WORKSPACE": "opsgis"   /* NB: needs to be made a parameter somewhere */
                        },            
                        projection: "EPSG:3857"
                    });                     
                    return(new ol.layer.Tile({source: wmsSource}));
                } else {
                    return(null);
                }
            } else {
                /* High bandwidth locations can use OpenStreetMap */
                return(new ol.layer.Tile({source: new ol.source.OSM()}));
            }            
        },
        getMidLatitudeCoastSource: function() {
            var wms = this.getWmsServiceUrl("Midlatitude Data", "EPSG:3857");            
            return({
               "id": null,
               "name": "Mid-latitude data",
               "source": {
                    "wms_source": wms || "osm", 
                    "feature_name": (wms != "osm" ? "opsgis:natearth_world_10m_land" : "osm"), 
                    "is_base": true
               },
               "is_visible": true
            });
            
        }

    });

}();