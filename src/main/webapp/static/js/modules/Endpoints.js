/* WxS endpoint utilities */

magic.modules.Endpoints = function () {

    return({
        /** 
         * Parse a URI into components 
         * Downloaded from http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
         * parseUri 1.2.2
         * (c) Steven Levithan <stevenlevithan.com>
         * MIT License
         * @param {String} str
         * @return {Object}
         */       
        parseUri: function(str) {
            var	o = 
                {
                    strictMode: false,
                    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
                    q:   {
                        name:   "queryKey",
                        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
                    },
                    parser: {
                        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
                    }
                },
                m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
                uri = {},
                i   = 14;

            while (i--) uri[o.key[i]] = m[i] || "";

            uri[o.q.name] = {};
            uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
                if ($1) uri[o.q.name][$1] = $2;
            });
            return uri;
        },
        /**
         * Get the virtual endpoint (workspace) for the given WMS
         * NOTE: Geoserver-specific
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
            var matches = this.getEndpointsBy("url", url);            
            if (matches.length > 0) {
                if (matches[0]["is_user_service"] === true) {
                    proxEp = magic.config.paths.baseurl + "/ogc/user/" + service;
                } else {
                    proxEp = magic.config.paths.baseurl + "/ogc/" + matches[0]["id"] + "/" + service;
                }
            } else {
                proxEp = magic.modules.Common.proxyUrl(url);
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
            var matches = this.getEndpointsBy(filterName, filterValue);           
            return(matches.length > 0 ? matches[0] : null);
        },  
        /**
         * Get the endpoint corresponding to the user data service (should only be one or none)  
         * @return {Object}
         */
        getUserDataEndpoint: function() {
            if (!magic.runtime.endpoints) {
                return(null);
            }
            var udes = jQuery.grep(magic.runtime.endpoints, function(ep) {
                return(ep.is_user_service === true);
            });
            return(udes.length == 0 ? null : udes[0]);
        },
        /**
         * Retrieve endpoint data corresponding to the input filter (match occurs if 'filter' found at start of endpoint, case-insensitive)
         * @param {string} filterName
         * @param {string} filterValue
         * @returns {Array}
         */
        getEndpointsBy: function(filterName, filterValue) {
            if (!magic.runtime.endpoints || !filterName || ! filterValue) {
                return(null);
            }
            var parsedUrlFilter = null;
            if (filterName == "url") {
                parsedUrlFilter = this.parseUri(filterValue); 
            }
            return(jQuery.grep(magic.runtime.endpoints, jQuery.proxy(function(ep) {
                if (filterName == "id") {
                    return(ep[filterName] == filterValue);
                } else if (filterName == "url") {
                    /* Check endpoint URL against filter - protocol, host and port must be identical */
                    var parsedEpUrl = this.parseUri(ep[filterName]);
                    var foundUrl = 
                        parsedUrlFilter.protocol == parsedEpUrl.protocol && 
                        parsedUrlFilter.host == parsedEpUrl.host && 
                        parsedUrlFilter.port == parsedEpUrl.port;
                    /* Bugfix 2018-04-16 David - too risky to introduce this for web mapping workshop */
                    if (foundUrl) {
                       /* Protocol, host and port identical - check path starts with endpoint's path */
                        if (parsedUrlFilter.path != "" && parsedEpUrl.path != "") {
                            foundUrl = parsedUrlFilter.path.indexOf(parsedEpUrl.path) == 0;
                        }
                    }
                    if (!foundUrl) {
                        /* Check any of the aliases match in protocol, host and port */
                        if (ep["url_aliases"]) {
                            var aliases = ep["url_aliases"].split(",");
                            for (var i = 0; !foundUrl && i < aliases.length; i++) {
                                var parsedAliasUrl = this.parseUri(aliases[i]);
                                foundUrl = 
                                    parsedUrlFilter.protocol == parsedAliasUrl.protocol && 
                                    parsedUrlFilter.host == parsedAliasUrl.host &&
                                    parsedUrlFilter.port == parsedAliasUrl.port;
                                if (foundUrl) {
                                    /* Protocol, host and port identical - check path starts with endpoint's path */
                                    if (parsedUrlFilter.path != "" && parsedAliasUrl.path != "") {
                                        foundUrl = parsedUrlFilter.path.indexOf(parsedAliasUrl.path) == 0;
                                    }
                                }
                            }                            
                        }
                    }
                    return(foundUrl);
                } else if (filterName == "srs") {
                    /* Projections can be a comma-separated list */
                    var srsList = ep[filterName].toLowerCase().split(",");
                    return(srsList.indexOf(filterValue.toLowerCase()) >= 0);
                } else {
                    return(ep[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) == 0);
                }
            }, this)));
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
                layer = new ol.layer.Tile({source: new ol.source.OSM({
                    wrapX: false    /* Very important - all OSM maps are total nonsense (gratuitously wrapped all over the place) without it! Looks like something's broken in OL4 - David 2018-04-13*/
                })});
            }
            return(layer);            
        },
        /**
         * Construct a mid-latitude coastline source object
         * @param {boolean} embedded 
         * @returns {Object}
         */
        getMidLatitudeCoastSource: function(embedded) {
            var midlats = this.getEndpointBy("name", "midlatitude");  
            var source = {
                "wms_source": (midlats && midlats.url != "osm") ? midlats.url : "osm", 
                "feature_name": (midlats && midlats.url != "osm") ? midlats.coast_layers : "osm", 
                "is_base": true
            };
            return(jQuery.extend({
               "id": null,
               "name": "Mid-latitude data",               
               "is_visible": true
            }, embedded ? source : {"source": source}));            
        }

    });

}();