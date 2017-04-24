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
            var re = /\/geoserver\/([^\/]+)\/wms/;
            var match = re.exec(url);
            if (match != null) {
                vs = match[1];
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
         * Get proxied endpoint i.e. a /ogc/<service>/<op> type URL for the given one, if a recognised endpoint
         * @param {string} url
         * @param {string} service (wms|wfs|wcs)
         * @returns {int}
         */
        getOgcEndpoint: function(url, service) {
            var proxEp = url;
            matches = this.getEndpointsBy("url", url);
            if (matches.length > 0) {
                proxEp = magic.config.paths.baseurl + "/ogc/" + matches[0]["id"] + "/" + service;
            } else {
                proxEp = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url);
            }
            return(proxEp);
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
                } else if (filterName == "url") {
                    /* Remove wms/wfs from the end of the URL - the endpoints are the same */
                    filterValue = filterValue.replace(/(wms|wfs)$/, "");
                    return(ep[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) == 0);
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