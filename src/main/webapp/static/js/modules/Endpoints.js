/* WxS endpoint utilities */

magic.modules.Endpoints = function () {

    return({
        /**
         * Get the virtual endpoint (workspace) for the given WMS
         * @param {string} url
         * @return {string}
         */
        getVirtualService: function(url) {
            var vs = "";
            var parts = url.split("/");
            /* Split up a URL like http://bslmagl.nerc-bas.ac.uk/geoserver/matchups/wms */
            if (parts.length > 3 && parts[parts.length-3] == "geoserver" && parts[parts.length-1] == "wms") {
                vs = parts[parts.length-2];
            }
            return(vs);
        },
        /**
         * Get the service URL proxied by the given one
         * @param {string} url
         * @return {string}
         */
        getWmsProxiedUrl: function(url) {
            var matchEp = this.getEndpointBy("url", url);
            return((matchEp && matchEp.proxied_url ) ? matchEp.proxied_url : null);
        },
        /**
         * Get a suitable service WMS endpoint depending on location bandwidth
         * @param {String} service
         * @returns {String}
         */
        getWmsServiceUrl: function(service) {
            var matchEp = this.getEndpointBy("name", service);
            return(matchEp ? matchEp.url : null);
        },   
        /**
         * Retrieve single endpoint data corresponding to the input filter (match occurs if 'filter' found at start of endpoint, case-insensitive)
         * @param {string} filterName
         * @param {string} filterValue
         * @returns {Object}
         */
        getEndpointBy: function(filterName, filterValue) {
            matches = this.getEndpointsBy(filterName, filterValue);           
            return(matches.length > 0 ? matches[0] : null);
        },        
        /**
         * Retrieve endpoint data corresponding to the input filter (match occurs if 'filter' found at start of endpoint, case-insensitive)
         * @param {string} filterName
         * @param {string} filterValue
         * @returns {Array}
         */
        getEndpointsBy: function(filterName, filterValue) {            
            return(jQuery.grep(magic.runtime.endpoints, function(ep) {
                if (filterName == "id") {
                    return(ep[filterName] == filterValue);
                } else if (filterName == "srs") {
                    /* Projections can be a comma-separated list */
                    var srsList = ep[filterName].toLowerCase().split(",");
                    return(srsList.indexOf(filterValue.toLowerCase()) >= 0);
                } else {
                    return(ep[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) == 0);
                }
            }));
        },        
        /**
         * Get a suitable mid-latitudes coast layer (OSM, except if in a low bandwidth location, in which case default to Natural Earth)
         * @returns {ol.layer}
         */
        getMidLatitudeCoastLayer: function() {
            var layer = null;
            var midlats = this.getEndpointBy("name", "midlatitude");
            if (midlats != null && midlats.url != "osm") {
                /* Custom layer required */
                var ws = null;
                if (midlats.coast_layers.indexOf(":") != -1) {
                    ws = midlats.coast_layers.split(":").shift();
                }
                layer = new ol.layer.Tile({
                    source: new ol.source.TileWMS({
                        url: midlats.url,
                        params: {
                            "LAYERS": midlats.coast_layers, 
                            "CRS": "EPSG:3857",
                            "SRS": "EPSG:3857",
                            "VERSION": "1.3.0",
                            "WORKSPACE": ws
                        },            
                        projection: "EPSG:3857"
                    })
                });
            } else {
                /* Use OpenStreetMap */
                layer = new ol.layer.Tile({source: new ol.source.OSM()});
            }
            return(layer);            
        },
        /**
         * Construct a mid-latitude coastline source object
         * @returns {Object}
         */
        getMidLatitudeCoastSource: function() {
            var midlats = this.getEndpointBy("name", "midlatitude");          
            return({
               "id": null,
               "name": "Mid-latitude data",
               "source": {
                    "wms_source": (midlats && midlats.url != "osm") ? midlats.url : "osm", 
                    "feature_name": (midlats && midlats.url != "osm") ? midlats.coast_layers : "osm", 
                    "is_base": true
               },
               "is_visible": true
            });
            
        }

    });

}();