/* Global "magic" namespace */

var magic = {
    
    /* Layer and view configuration */
    config: {
        paths: {
            baseurl: (window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port: "")))
        }
    },        
    
    /* Static modules */
    modules: {
        creator: {}
    },
    
    /* Instantiable classes */
    classes: {
        creator: {},
        console: {}
    },
    
    /* Runtime objects */
    runtime: {
        creator: {
            catalogues: {}
        }, 
        capabilities: {            
        },
        filters: {            
        },
        pingSession: function() {
            jQuery.get(magic.config.paths.baseurl + "/ping");
        },
        /* Courtesy of https://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method, Andrei's answer */
        getScripts: function(scripts, callback) {
            var progress = 0;
            scripts.forEach(function(script) { 
                jQuery.getScript(script, function () {
                    if (++progress == scripts.length) callback();
                }); 
            });
        },
        /* Eventually per-user */
        preferences: {
            coordinate: "dd",
            elevation: "m",
            date: "Y-m-d"
        }
    }
    
};

/* Activate session keepalive by application request every 50 mins */
setInterval("magic.runtime.pingSession()", 50*60*1000);



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
            if (jQuery.isArray(matches) && matches.length > 0) {
                if (matches[0]["is_user_service"] === true) {
                    proxEp = magic.config.paths.baseurl + "/ogc/user/" + service;
                } else {
                    proxEp = magic.config.paths.baseurl + "/ogc/" + matches[0]["id"] + "/" + service;
                }
            } else {
                console.log(url + " does not correspond to a known endpoint - need to proxy");
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
/* Static low-level common methods module */

magic.modules.Common = function () {

    return({       
        /* Taken from OL2 Util.js */
        inches_per_unit: {
            "ins": 1.0,
            "ft": 12.0,
            "mi": 63360.0,
            "m": 39.37,
            "km": 39370,
            "dd": 4374754,
            "yd": 36,
            "nmi": 1852 * 39.37
        },
        /* Default styles, as plain objects to avoid problems with cloning OL objects */
        default_styles: {
            "Point": {
                image: "circle",
                radius: 5,
                fill: "rgba(255,255,0,0.5)",                               
                stroke: "#ff0",                        
                width: 1                
            },
            "LineString": {
                stroke: "#f00",
                width: 3
            },
            "Polygon": {
                fill: "rgba(0,255,255,0.5)",                
                stroke: "#0ff",
                width: 1                
            },
            "MultiPoint": {
                image: "circle",
                radius: 5,
                fill: "rgba(255,0,255,0.5)",                                 
                stroke: "#f0f",
                width: 1
            },
            "MultiLineString": {
                stroke: "#0f0",
                width: 3
            },
            "MultiPolygon": {
                fill: "rgba(0,0,255,0.5)",
                stroke: "#00f",
                width: 1
            }
        },
        /* Colour palette for distinctive styling of drag/drop layers 
         * Based on https://en.wikipedia.org/wiki/List_of_software_palettes#Apple_Macintosh_default_16-color_palette 
         * leaving out white and light grey for obvious reasons */
        color_palette: [            
            "#FF6403",  /* orange */
            "#800000",  /* dark red */
            "#DD0907",  /* red */
            "#F20884",  /* magenta */
            "#4700A5",  /* purple */
            "#0000D3",  /* blue */
            "#02ABEA",  /* cyan */
            "#1FB714",  /* green */
            "#006412",  /* dark green */
            "#562C05",  /* brown */
            "#90713A",  /* tan */
            "#808080",  /* medium grey */
            "#404040",  /* dark grey */
            "#000000"   /* black */
        ],
        /**
         * Convert hex RGB in form #ffffff to decimal
         * http://stackoverflow.com/questions/8468855/convert-a-rgb-colour-value-to-decimal
         * @param {string} rgb
         * @returns {string}
         */
        rgbToDec: function(rgb, opacity) {
            rgb = rgb || "#000000";
            opacity = jQuery.isNumeric(opacity) ? opacity : 1.0;
            rgb = eval("0x" + rgb.replace(/#/, ""));
            var components = {
                r: (rgb & 0xff0000) >> 16, 
                g: (rgb & 0x00ff00) >> 8, 
                b: (rgb & 0x0000ff)
            };
            return("rgba(" + components.r + "," + components.g + "," + components.b + "," + opacity + ")");
        },
        /**
         * Scroll target into view if needed
         * http://stackoverflow.com/questions/5685589/scroll-to-element-only-if-not-in-view-jquery
         * @param {object} target
         */
        scrollViewportToElement: function(target) {
            var rect = target.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
                target.scrollIntoView(false);
            }
            if (rect.top < 0) {
                target.scrollIntoView();
            } 
        },
        /**
         * Create a set of buttons suitable for giving feedback on a POST/PUT/DELETE operation
         * @param {string} btnBaseId
         * @param {string} msg
         * @param {string} size lg|sm|xs
         * @param {string} btnCaption
         * @param {boolean} cancel 
         * @returns {String}
         */
        buttonFeedbackSet: function(btnBaseId, msg, size, btnCaption, cancel) {
            if (!size) {
                size = "sm";
            }
            if (!btnCaption) {
                btnCaption = "Save";
            }
            return(
                '<div class="btn-toolbar col-' + size + '-12" role="toolbar" style="margin-bottom:10px">' +
                    '<div class="btn-group btn-group-' + size + '">' + 
                        '<button id="' + btnBaseId + '-go" class="btn btn-' + size + ' btn-primary" type="button" ' + 
                            'data-toggle="tooltip" data-trigger="hover" data-placement="top" title="' + msg + '">' + 
                            '<span class="fa fa-floppy-o"></span> ' + btnCaption + 
                        '</button>' +
                    '</div>' + 
                    '<div class="btn-group btn-group-' + size + '">' +
                        '<button id="' + btnBaseId + '-fb-ok" class="btn btn-' + size + ' btn-success" style="display:none" type="button" ' + 
                            'data-toggle="tooltip" data-trigger="hover" data-placement="top" title="Ok">' + 
                            '<span class="fa fa-check post-ok"></span> Ok' + 
                        '</button>' +
                    '</div>' + 
                    '<div class="btn-group btn-group-' + size + '">' +
                        '<button id="' + btnBaseId + '-fb-error" class="btn btn-' + size + ' btn-danger" style="display:none" type="button" ' + 
                            'data-toggle="tooltip" data-trigger="hover" data-placement="top" title="Error">' + 
                            '<span class="fa fa-times post-error"></span> Error' + 
                        '</button>' + 
                    '</div>' + 
                    (cancel === true ?
                    '<div class="btn-group btn-group-' + size + '">' + 
                        '<button id="' + btnBaseId + '-cancel" class="btn btn-' + size + ' btn-danger" type="button" ' + 
                            'data-toggle="tooltip" data-trigger="hover" data-placement="right" title="Cancel">' + 
                            '<span class="fa fa-times-circle"></span> Cancel' + 
                        '</button>' +      
                    '</div>' : '') + 
                '</div>'
            );
        },
        /**
         * Give success/failure feedback by animating a button set
         * Assumes three buttons, the first was clicked, the other two are initially hidden 
         * @param {string} btnBaseId       
         * @param {boolean} success 
         * @param {string} msg      
         */
        buttonClickFeedback: function(btnBaseId, success, msg) {
            var btnGo = jQuery("#" + btnBaseId + "-go"),
                btnFbOk = jQuery("#" + btnBaseId + "-fb-ok"),
                btnFbError = jQuery("#" + btnBaseId + "-fb-error"),
                effect;
            btnGo.hide();
            /* See https://api.jquery.com/promise/ for queuing up animations like this */
            if (success) {                            
                btnFbOk.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function(){return(btnFbOk.fadeIn(300).delay(1200).fadeOut(300))};                                                      
            } else {
                btnFbError.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function(){return(btnFbError.fadeIn(600).delay(6000).fadeOut(600))};
            }
            jQuery.when(effect()).done(function() {
                btnGo.show();                            
            });                        
        },        
        /**
         * Put together a suitable style for an uploaded layer, distinct from the rest
         * @param {string} geomType
         * @param {int} paletteEntry
         * @param {string} label
         * @returns {Array<ol.Style>}
         */
        fetchStyle: function(geomType, paletteEntry, label) {
            var style = this.default_styles[geomType];
            if (style) {
                var styling = {};
                if (geomType.toLowerCase().indexOf("point") >= 0) {
                    /* Create image */
                    styling.image = this.getPointImageStyle(paletteEntry);                 
                } else if (geomType.toLowerCase().indexOf("linestring") >= 0) {
                    styling.stroke = new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: style.width || 1
                    });
                } else {
                    styling.fill = new ol.style.Fill({
                        color: this.rgbToDec(this.color_palette[paletteEntry], 0.5),                               
                    });
                    styling.stroke = new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: style.width || 1
                    });                  
                } 
                if (label) {
                    styling.text = new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 10,
                        text: label,
                        textAlign: "left",
                        fill: new ol.style.Fill({
                            color: this.rgbToDec(this.color_palette[paletteEntry])
                        }),
                        stroke: new ol.style.Stroke({
                            color: "#ffffff",
                            width: 1
                        })
                    });
                }
                return([new ol.style.Style(styling)]);
            } else {
                return(null);
            }            
        },
        /**
         * Create a style with the given opacity
         * @param {float} opacity
         * @param {String} icon
         * @param {Array} anchor
         * @returns {ol.style.Style}
         */
        getIconStyle: function(opacity, icon, anchor) {
            return(new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: anchor || [0.5, 1],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction",
                    opacity: opacity,
                    src: magic.config.paths.baseurl + "/static/images/" + icon + ".png"
                })
            }));
        },
        /**
         * Make some different choices for icon style for points to allow more distinction between layers on the map
         * Supports:
         * - circle
         * - star
         * - square
         * - triangle
         * @param {int} paletteEntry
         * @returns {ol.style.<Circle|RegularShape>}
         */
        getPointImageStyle: function(paletteEntry) {
            var idx = paletteEntry % 4;
            if (idx == 0) {
                return(new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: this.rgbToDec(this.color_palette[paletteEntry], 0.5)
                    }),
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: 1
                    })
                }));       
            } else if (idx == 1) {
                return(new ol.style.RegularShape({
                    rotation: 0,
                    points: 5,
                    radius1: 7,
                    radius2: 2,
                    fill: new ol.style.Fill({
                        color: this.rgbToDec(this.color_palette[paletteEntry], 0.5)
                    }),
                    stroke: new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: 1
                    })
                }));
            } else if (idx == 2) {
                return(new ol.style.RegularShape({
                    points: 4,
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: this.rgbToDec(this.color_palette[paletteEntry], 0.5)
                    }),
                    stroke: new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: 1
                    })
                }));
            } else if (idx == 3) {
                return(new ol.style.RegularShape({
                    points: 3,
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: this.rgbToDec(this.color_palette[paletteEntry], 0.5)
                    }),
                    stroke: new ol.style.Stroke({
                        color: this.rgbToDec(this.color_palette[paletteEntry]),
                        width: 1
                    })
                }));
            }
        },
        /**
         * Set a vector feature label visibility to 'vis'
         * @param {ol.Feature} feat
         * @param {ol.Layer} layer
         * @param {boolean} vis
         * @param {int} fcount number of features at this pixel location
         */
        labelVisibility: function(feat, layer, vis, fcount) {
            if (feat.get("_ignoreHovers")) {
                return;
            }
            var style = null;
            if (feat.getStyleFunction()) {
                style = (jQuery.proxy(feat.getStyleFunction(), feat))()[0];
            } else if (feat.getStyle()) {
                style = feat.getStyle();
            } else if (jQuery.isFunction(layer.getStyleFunction) && layer.getStyleFunction()) {
                var styleFnRet = layer.getStyleFunction()(feat, 0);
                if (jQuery.isArray(styleFnRet)) {
                    style = styleFnRet[0];
                } else {
                    style = styleFnRet;
                }
            } else if (jQuery.isFunction(layer.getStyle) && layer.getStyle()) {
                style = layer.getStyle();
            }            
            if (style && style.getText()) {            
                var sclone = style.clone();
                var label = sclone.getText();
                if (label && label.getText()) {
                    /* Found a feature whose label needs to be hovered => make text opaque */
                    var text = label.getText();
                    if (vis) {
                        label.setText(text + (fcount > 1 ? " (+" + (fcount-1) + ")" : ""));
                    } else {
                        label.setText(text.replace(/\s+\(\+\d+\)$/, ""));
                    }
                    var stroke = label.getStroke();
                    var scolor = stroke.getColor(); 
                    if (!jQuery.isArray(scolor)) {
                        /* Will be of form rgba(255, 255, 255, 0.0) */
                        stroke.setColor(scolor.substring(0, scolor.lastIndexOf(",")+1) + (vis ? "1.0" : "0.0") + ")");
                    } else {
                        /* [R, G, B, OP] */
                        scolor[3] = (vis ? "1.0" : "0.0");
                        stroke.setColor(scolor);
                    }                   
                    var fill = label.getFill();
                    var fcolor = fill.getColor();
                    if (!jQuery.isArray(fcolor)) {
                        /* Will be of form rgba(255, 255, 255, 0.0) */
                        fill.setColor(fcolor.substring(0, fcolor.lastIndexOf(",")+1) + (vis ? "1.0" : "0.0") + ")"); 
                    } else {
                        /* [R, G, B, OP] */
                        fcolor[3] = (vis ? "1.0" : "0.0");
                        fill.setColor(fcolor);
                    }                                    
                    feat.setStyle(sclone);
                    feat.changed();           
                }                
            }
        },        
        /**
         * Apply proxying to a URL (e.g. a vector feed) unless it's from the same host
         * @param {String} url
         * @returns {String}
         */
        proxyUrl: function(url) {
            var proxyUrl = url;
            if (url.indexOf(window.location.protocol + "//" + window.location.hostname) != 0) {
                proxyUrl = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url);
            }
            return(proxyUrl);
        },
        /**
         * Construct a WxS URL for the specified operation from a WMS URL
         * @param {String} wmsUrl
         * @param {String} operation GetCapabilities|DescribeFeatureType|GetFeature
         * @param {String} feature
         * @returns {String}
         */
        getWxsRequestUrl: function(wmsUrl, operation, feature) {
            var requestUrl = "";
            switch(operation.toLowerCase()) {
                case "getcapabilities":
                    /* Watch out for UMN Mapserver URLs which alrady contain the '?' */
                    requestUrl = magic.modules.Endpoints.getOgcEndpoint(wmsUrl, "wms") + (wmsUrl.indexOf("?") != -1 ? "&" : "?") + "request=GetCapabilities&service=wms";
                    break;
                case "describefeaturetype":
                    /* Note: version set to 1.0.0 here as certain attributes do NOT get picked up by later versions - is a Geoserver bug - note that the 
                     * layer parameter is 'typename' singular, not 'typenames' as in version 2.0.0 */
                    requestUrl = magic.modules.Endpoints.getOgcEndpoint(wmsUrl, "wfs") + "?version=1.0.0&request=DescribeFeatureType&typename=" + feature;                    
                    break;
                default:
                    break;
            }
            return(requestUrl);
        },
        /**
         * Retrieve a WMS GetCapabilities document for the URL, calling the given callback with the supplied arguments
         * @param {string} url
         * @param {Function} callback
         * @param {string} typename
         */
        getCapabilities: function(url, callback, typename) {
            if (magic.runtime.map_context.capabilities[url]) {
                callback(magic.runtime.map_context.capabilities[url], typename);
            } else {
                var parser = new ol.format.WMSCapabilities();                
                jQuery.get(this.getWxsRequestUrl(url, "GetCapabilities"), jQuery.proxy(function(response) {
                    try {
                        var capsJson = jQuery.parseJSON(JSON.stringify(parser.read(response)));
                        if (capsJson) {
                            var ftypes = null;
                            if ("Capability" in capsJson && "Layer" in capsJson.Capability && "Layer" in capsJson.Capability.Layer && jQuery.isArray(capsJson.Capability.Layer.Layer)) {
                                var layers = capsJson.Capability.Layer.Layer;
                                ftypes = {};
                                this.getFeatureTypes(ftypes, layers);                                
                            }
                            if (ftypes != null) {
                                magic.runtime.map_context.capabilities[url] = ftypes;
                                callback(magic.runtime.map_context.capabilities[url], typename);
                            } else {
                                callback(null, typename, "No feature types found in GetCapabilities response from " + url);
                            }                            
                        } else {
                            callback(null, typename, "Malformed GetCapabilities response from " + url);
                        }
                    } catch(e) {
                        callback(null, typename, "Parsing GetCapabilities response from " + url + " failed with error " + e.message);
                    }
                }, this)).fail(function(xhr, status, errMsg) {
                    var message = "Failed to WMS GetCapabilities document from " + url + ", error was : " + errMsg;
                    if (status == 401) {
                        message = "Not authorised to retrieve WMS GetCapabilities document from " + url;
                    }
                    callback(null, typename, message);
                });
            }
        },
        /**
         * Default labelling mouseover for vectors
         * @param {ol.Event} evt
         * @return {Object} highlighted feature/layer object
         */
        defaultMouseover: function(evt) {
            var fcount = 0;
            var customHandled = false;
            var highlighted = null;        
            evt.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
                if (layer != null && feat.get("_ignoreHovers") !== true) {
                    if (feat.get("_customHover") === true) {
                        /* Feature has a custom mouseover behaviour */
                        highlighted = null;
                        customHandled = true;                   
                    } else if (fcount == 0) {
                        /* Record the first feature that should receive a default name label */
                        highlighted = {
                            feature: feat, 
                            layer: layer
                        };                    
                    }
                    fcount++; 
                    return(customHandled);
                }
            }, this));
            if (!customHandled && fcount > 0) {
                /* Show default label on the highlighted feature */            
                this.labelVisibility(highlighted.feature, highlighted.layer, true, fcount);
            }
            jQuery("#" + evt.map.getTarget()).css("cursor", highlighted ? "pointer" : "help");
            return(highlighted);
        },
        /**
         * Default labelling mouseout for vectors
         * @param {Object} highlighted feature/layer object
         */
        defaultMouseout: function(highlighted) {
            if (highlighted && highlighted.feature && highlighted.feature.get("_customHover") !== true) { 
                /* No custom behaviour defined */
                this.labelVisibility(highlighted.feature, highlighted.layer, false, 1);            
            }
        },
        /**
         * Get all vector features at the given pixel (e.g. from Geosearch or user GPX/KML layers)
         * @param {ol.Event} click event
         */
        featuresAtPixel: function(evt) {
            var fprops = [];
            evt.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                if (layer != null) {
                    /* This is not a feature overlay i.e. an artefact of presentation not real data */
                    var clusterMembers = feature.get("features");
                    if (clusterMembers && jQuery.isArray(clusterMembers)) {
                        /* Unpack cluster features */
                        jQuery.each(clusterMembers, function(fi, f) {
                            if (!f.get("ignoreClicks") && f.getGeometry()) {
                                var exProps = f.getProperties();
                                fprops.push(jQuery.extend({}, exProps, {"layer": layer}));                           
                            }                    
                        });
                    } else {
                        if (!feature.get("_ignoreClicks") && feature.getGeometry()) {
                            var exProps = feature.getProperties();
                            fprops.push(jQuery.extend({}, exProps, {"layer": layer}));
                        }          
                    }
                }
            }, {layerFilter: function(candidate) {
                return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
            }}, this);
            return(fprops);
        },
        /**
         * Helper method for getCapabilities above - recursive trawler through GetCaps document
         * @param {Object} ftypes
         * @param {Array} layers
         */
        getFeatureTypes: function(ftypes, layers) {
            jQuery.each(layers, jQuery.proxy(function(idx, layer) {
                if ("Name" in layer) {
                    /* Leaf node - a named layer */
                    ftypes[layer.Name] = layer;
                } else if ("Layer" in layer && jQuery.isArray(layer["Layer"])) {
                    /* More trawling to do */
                    this.getFeatureTypes(ftypes, layer["Layer"]);
                }        
            }, this));
        },
        /**
         * Populate a select list from given array of option objects
         * @param {Element} select
         * @param {Array} optArr
         * @param {string} valAttr
         * @param {string} txtAttr
         * @param {string} defval
         * @param {boolean} prependInvite whether to add a "Please select" entry at the beginning
         */
        populateSelect: function(select, optArr, valAttr, txtAttr, defval, prependInvite) {
            var selOpt = null;
            select.find("option").remove();
            if (prependInvite === true) {
                select.append(jQuery("<option>", {
                    value: "", 
                    selected: (defval == "" ? " selected" : ""),
                    text: "Please select"
                }));
            }
            /* Sort by txtAttr */
            optArr.sort(function(a, b) {
                var lca = a[txtAttr] ? a[txtAttr].toLowerCase() : a[valAttr].toLowerCase();
                var lcb = b[txtAttr] ? b[txtAttr].toLowerCase() : b[valAttr].toLowerCase();
                return((lca < lcb ) ? -1 : (lca > lcb) ? 1 : 0);
            });
            jQuery.each(optArr, function(idx, optObj) {
                var opt = jQuery("<option>", {value: optObj[valAttr]});
                var text = optObj[txtAttr] || optObj[valAttr];               
                opt.text(text);            
                select.append(opt);
                if (defval && optObj[valAttr] == defval) {
                    selOpt = opt;
                }
            });
            if (selOpt != null) {
                selOpt.prop("selected", "selected");
            }
        },
        /**
         * Populate a form with the specified fields from the data object
         * Form input names/ids should be derivable from <prefix>-<field>
         * @param {Array} fields array of objects of form {"field": <name>, "default": <defaultvalue>}
         * @param {object} data
         * @param {string} prefix
         */
        jsonToForm: function(fields, data, prefix) { 
            jQuery.each(fields, function(idx, fo) {
                var name = fo["field"];
                var defval = fo["default"];
                var input = jQuery("#" + prefix + "-" + name);
                var value = typeof data[name] == "object" ? JSON.stringify(data[name]) : data[name];
                if (input.attr("type") == "checkbox" || input.attr("type") == "radio") {
                    /* Set the "checked" property */
                    input.prop("checked", !data ? defval : (name in data ? (value === true ? true : false) : defval));
                } else if (input.attr("type") == "url") {
                    /* Fiddly case of URLs - use an empty default */
                    input.val(!data ? defval : (name in data ? value : ""));
                } else {
                    /* Simple case */
                    input.val(!data ? defval : (name in data ? value : defval));
                }
            });            
        },
        /**
         * Populate the data object with values from the given form
         * Form input names/ids should be derivable from <prefix>-<field>
         * @param {Array} fields
         * @param {string} prefix
         * @return {Object} json
         */
        formToJson: function(fields, prefix) {
            var json = {};
            jQuery.each(fields, function(idx, fo) {
                var name = fo["field"];
                var input = jQuery("#" + prefix + "-" + name);                    
                switch(input.attr("type")) {
                    case "checkbox":
                    case "radio":
                        /* Set the "checked" property */
                        json[name] = input.prop("checked") ? true : false;
                        break;                       
                    default:
                        var value = input.val();
                        if (input.attr("type") == "number" && jQuery.isNumeric(value)) {
                            /* Make sure numeric values are numbers not strings or will fail schema validation */
                            value = Math.floor(value) == value ? parseInt(value) : parseFloat(value);
                        }
                        if (input.attr("required") && value == "") {
                            json[name] = fo["default"];
                        } else {
                            json[name] = value;
                        }
                        break;                       
                }                    
            });
            return(json);
        },
        /**
         * Add an input error indicator to the given field
         * @param {Object} inputEl
         */
        flagInputError: function(inputEl) {
             var fg = inputEl.closest("div.form-group");
             if (fg) {
                 fg.addClass("has-error");
             }
        },
        /**
         * Show a bootbox alert
         * @param {String} message
         * @param {String} type info|warning|error
         */
        showAlertModal: function(message, type) {
            message = message || "An unspecified error occurred";
            type = type || "error";
            var alertClass = type, divStyle = "margin-bottom:0";
            if (type == "error") {
                alertClass = "danger";
                divStyle = "margin-top:10px";
            }
            bootbox.hideAll();
            bootbox.alert(
                '<div class="alert alert-' + alertClass + '" style="' + divStyle + '">' + 
                    '<p>A problem occurred - more details below:</p>' + 
                    '<p>' + message + '</p>' + 
                '</div>'
            );
        },
        /**
         * Remove all success/error indications on all form inputs on a page
         */
        resetFormIndicators: function() {
            jQuery("div.form-group").removeClass("has-error");
        },
        /**
         * Get JavaScript dynamically and cache
         * @param {String} url
         * @param {Function} callback
         */
        getScript: function(url, callback) {
            jQuery.ajax({
                 type: "GET",
                 url: url,
                 success: callback,
                 dataType: "script",
                 cache: true
             });    
        },
        /**
         * Parse CSV string to an array of strings
         * https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data, answer by niry
         * @param {String} text
         * @return {Array}
         */
        csvToArray: function (text) {
            var p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
            for (l in text) {
                l = text[l];
                if ('"' === l) {
                    if (s && l === p) {
                        row[i] += l;
                    }
                    s = !s;
                } else if (',' === l && s) {
                    l = row[++i] = '';
                } else if ('\n' === l && s) {
                    if ('\r' === p) {
                        row[i] = row[i].slice(0, -1);
                    }
                    row = ret[++r] = [l = '']; i = 0;
                } else {
                    row[i] += l;
                }
                p = l;
            }
            return(ret);
        },
        sortedUniqueArray: function(arr) {
            var suArr = [];
            if (!arr || arr.length == 0) {
                return(suArr);
            }            
            var dupHash = {};
            suArr = jQuery.map(arr, function(elt) {
                if (elt in dupHash) { 
                    return(null);
                } else {
                    dupHash[elt] = 1;
                    return(elt);
                }
            });
            suArr.sort();
            return(suArr);
        },
        /**
         * Is given string a valid URL - from https://stackoverflow.com/questions/19108749/validate-url-entered-by-user/19108825
         * @param {String} str
         * @return {boolean}
         */
        isUrl: function(str) {
            if (typeof str == "string") {
                var regexp = /((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;
                return(str.match(regexp));
            }
            return(false);            
        },
        /**
         * Does the given key name look name-like?
         * @param {String} key
         * @returns {boolean}
         */
        isNameLike: function(key) {
           key = key.toLowerCase();
           var nameKeys = ["^name.*$", "^callsign$", "^[^n]*name$"];
           for (var i = 0; i < nameKeys.length; i++) {
               var patt = new RegExp(nameKeys[i]);
               if (patt.test(key)) {
                   return(true);
               }
           }
           return(false);
        },
        /**
         * Does the given key name look like a longitude?
         * @param {String} key
         * @returns {boolean}
         */
        isLongitudeLike: function(key) {
           key = key.toLowerCase();
           var lonKeys = ["^lon.*$", "^x$", "^xcoord.*$"];
           for (var i = 0; i < lonKeys.length; i++) {
               var patt = new RegExp(lonKeys[i]);
               if (patt.test(key)) {
                   return(true);
               }
           }
           return(false);
        },
        /**
         * Does the given key name look like a latitude?
         * @param {String} key
         * @returns {boolean}
         */
        isLatitudeLike: function(key) {
           key = key.toLowerCase();
           var latKeys = ["^lat.*$", "^y$", "^ycoord.*$"];
           for (var i = 0; i < latKeys.length; i++) {
               var patt = new RegExp(latKeys[i]);
               if (patt.test(key)) {
                   return(true);
               }
           }
           return(false);
        },
        /**
         * Does the given key name look like a date/time?
         * @param {String} key
         * @returns {boolean}
         */
        isDatetimeLike: function(key) {
           key = key.toLowerCase();
           var dateKeys = ["^date.*$", "^time.*$", "^utc$", "^[^u]*update.*$"];
           for (var i = 0; i < dateKeys.length; i++) {
               var patt = new RegExp(dateKeys[i]);
               if (patt.test(key)) {
                   return(true);
               }
           }
           return(false);
        },
        /**
         * Convert date value to format, discarding times
         * @param {string} value
         * @param {string} format (dmy|ymd) which give dd-mm-YYYY and YYYY-mm-dd respectively
         * @returns {string} the date formatted accordingly
         */
        dateFormat: function (value, format) {
            var formattedValue = value;
            var d = new Date(value);
            if (value.toLowerCase().indexOf("invalid") == -1) {
                var dd = d.getDate();
                dd = (dd < 10 ? "0" : "") + dd;
                var mm = d.getMonth()+1;
                mm = (mm < 10 ? "0" : "") + mm;
                var yyyy = d.getFullYear();
                formattedValue = (format == "dmy" ? dd + "-" + mm + "-" + yyyy : yyyy + "-" + mm + "-" + dd);
            }            
            return(formattedValue);
        },
        /**
         * Human readable file size method
         * http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
         * @param {int} bytes
         * @returns {String}
         */
        fileSize: function (bytes) {
            var exp = Math.log(bytes) / Math.log(1024) | 0;
            var result = (bytes / Math.pow(1024, exp)).toFixed(2);
            return result + ' ' + (exp == 0 ? "bytes" : "kMGTPEZY"[exp - 1] + "B");
        },
        /**
         * JSON escape for '&' and '"'
         * @param {String} str
         * @return {String}
         */
        JsonEscape: function(str) {
            var strOut = str.replace(/\&/g, "&amp;");
            strOut = strOut.replace(/\"/g, "&quot;");
            return(strOut);
        },
        /**
         * JSON unescape for '&' and '"'
         * @param {String} str
         * @return {String}
         */
        JsonUnescape: function(str) {
            var strOut = str.replace(/\&quot;/g, '"');
            strOut = strOut.replace(/\&amp;/g, "&");
            return(strOut);
        },        
        /**
         * Replace urls in given value by links
         * Courtesy of http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
         * @param {String} value
         * @param {String} linkText
         * @returns {String}
         */
        linkify: function (value, linkText) {

            if (!value) {
                return("");
            }
            
            if (typeof value == "string") {
                
                if (value.indexOf("<a") != -1) {
                    /* Already deemed to be linkified - don't try again! */
                    return(value);
                } else if (value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/)) {
                    /* Image URL */
                    return('<img src="' + value + '"></img>');
                }
                /* Check for brain-dead Ramadda URLs with ?entryid=<stuff> at the end, disguising the mime type! */
                if (value.match(/^https?:\/\//) && value.indexOf("?") > 0) {
                    /* This is a pure URL with a query string */
                    var valueMinusQuery = value.substring(0, value.indexOf("?"));
                    if (valueMinusQuery.match(/\.(jpg|jpeg|png|gif)$/)) {
                        /* Image URL displayed as inline image */
                        return('<img src="' + value + '"></img>');
                    }
                }

                /* http://, https://, ftp:// */
                var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

                /* www. sans http:// or https:// */
                var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

                /* Email addresses */
                var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;
                
                if (linkText) {
                    return(value
                        .replace(urlPattern, '<a href="$&" title="$&" target="_blank">' + linkText + '</a>')
                        .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">' + linkText + '</a>')
                        .replace(emailAddressPattern, '<a href="mailto:$&">' + linkText + '</a>')
                    );
                } else {
                    return(value
                        .replace(urlPattern, '<a href="$&" title="$&" target="_blank">[external resource]</a>')
                        .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
                        .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>')
                    );
                }   
            } else {
                return(value);
            }
        },
        /**
         * Break long string every 'size' characters with a <br>
         * @param {string} str
         * @param {int} size
         * @returns {string}
         */
        chunk: function (str, size) {
            if (typeof size == "undefined") {
                size = 2;
            }
            return(str.match(RegExp('.{1,' + size + '}', 'g')).join("<br>"));
        },
        /**
         * Break a string longer than size characters at the final space before the size limit (if possible)
         * @param {string} str
         * @param {int} size
         */
        ellipsis: function (str, size) {
            if (str.length <= size) {
                return(str);
            }
            var out = str.substr(0, size),
                    lastSp = out.lastIndexOf(" ");
            if (lastSp == -1 || lastSp < size / 2) {
                /* No space, or too near the beginning to be informative */
                out = out.substr(0, size - 3) + "...";
            } else {
                out = out.substr(0, lastSp) + "...";
            }
            return(out);
        },
        /**
         * For multiline labelling - http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
         * @param {type} string
         * @param {int} width
         * @param {string} spaceReplacer
         * @returns {string}
         */
        stringDivider: function (str, width, spaceReplacer) {
            if (str.length > width) {
                var p = width;
                for (; p > 0 && (str[p] != " " && str[p] != "-"); p--) {
                }
                if (p > 0) {
                    var left;
                    if (str.substring(p, p + 1) == "-") {
                        left = str.substring(0, p + 1);
                    } else {
                        left = str.substring(0, p);
                    }
                    var right = str.substring(p + 1);
                    return(left + spaceReplacer + stringDivider(right, width, spaceReplacer));
                }
            }
            return(str);
        },
        /**
         * Number of keys in an object literal 
         * Thanks to http://stackoverflow.com/questions/5533192/how-to-get-object-length
         * @param {Object} obj
         * @returns {int}
         */
        objectLength: function (obj) {
            var count = 0;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    count++;
                }
            }
            return(count);
        },
        /**
         * Capitalise the first letter of the string
         * @param {string} str
         * @returns {string}
         */
        initCap: function (str) {
            return(str.substring(0, 1).toUpperCase() + str.substring(1));
        },
        /**
         * 
         * @param {string} str
         * @param {string} suffix
         * @returns {boolean}
         */
        endsWith: function (str, suffix) {
            return(str.indexOf(suffix, str.length - suffix.length) !== -1);
        },
        /**
         * Do unit conversion for length and area units
         * @param {float} value
         * @param {string} from units - any key from 'inches_per_unit' for lengths/areas
         * @param {string} to units - any key from 'inches_per_unit' for lengths/areas
         * @param {int} dims 1|2 (length or area)
         * @returns {String}
         */
        unitConverter: function (value, from, to, dims) {
            dims = dims || 1;
            var converted = 0.0, fromUnits = from, toUnits = to;            
            if (fromUnits in this.inches_per_unit && toUnits in this.inches_per_unit && (dims == 1 || dims == 2)) {
                converted = value * Math.pow(this.inches_per_unit[fromUnits] / this.inches_per_unit[toUnits], dims);
                converted = converted.toFixed(3) + " " + toUnits + (dims == 2 ? "<sup>2</sup>" : "");
            }
            return(converted);
        },
        /**
         * Create a UUID
         * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript answer by broofa
         * @returns {string}
         */
        uuid: function() {            
            return('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            }));
        },
        /**
         * Degrees to radians
         * @param {float} degs
         * @returns {float}
         */
        toRadians: function (degs) {
            return(degs * Math.PI / 180.0);
        },
        /**
         * Radians to degrees
         * @param {float} rads
         * @returns {float}
         */
        toDegrees: function (rads) {
            return(rads * 180.0 / Math.PI);
        },
        /**
         * Are two floating point numbers equal to within a supplied tolerance?
         * @param {float} num
         * @param {float} value
         * @param {float} resolution
         * @returns {Boolean}
         */
        floatsEqual: function (num, value, resolution) {
            return(Math.abs(num - value) <= resolution);
        },
        /**
         * Is a floating point number within specified range (including a tolerance at the ends)
         * @param {float} num
         * @param {float} rangeLo
         * @param {float} rangeHi
         * @param {float} resolution
         * @returns {Boolean}
         */
        floatInRange: function (num, rangeLo, rangeHi, resolution) {
            return(
                    (num > rangeLo || Math.abs(num - rangeLo) <= resolution) &&
                    (num < rangeHi || Math.abs(num - rangeHi) <= resolution)
                    );
        }

    });

}();
/* Static geographic utilities module */

magic.modules.GeoUtils = function() {

    return({
        
        /* Distance apart in degrees that two angles have to be in order to be considered different */
        ANGULAR_TOLERANCE: 1e-03,
        
        /* Densification factor (generate this many intermediate points on a line prior to reprojection) */
        N_INTERP: 5,
        
        /* WGS84 ellipsoid */
        WGS84: new ol.Sphere(6378137),
        
        /* Range of units for expressing distance */
        DISTANCE_UNITS: [
            ["km", "kilometres"],
            ["m", "metres"],
            ["mi", "statute miles"],
            ["nmi", "nautical miles"]
        ],

        /* Range of units for expressing areas */
        AREA_UNITS: [
            ["km", "square kilometres"],
            ["m", "square metres"],
            ["mi", "square miles"],
            ["nmi", "square nautical miles"]
        ],

        /* Range of units for expressing elevations */
        ELEVATION_UNITS: [
            ["m", "metres"],
            ["ft", "feet"]
        ],

        /* Supported co-ordinate formats */
        COORDINATE_FORMATS: [
            ["dd", "decimal degrees"],
            ["dms", "degrees, minutes and seconds"],
            ["ddm", "degrees, decimal minutes"]
        ],
        
        /* Default settings for geographical preferences */
        DEFAULT_GEO_PREFS: {
            distance: "km",
            area: "km",
            elevation: "m",
            coordinates: "dd"
        },
        
        /* Default map parameters for different regions */
        DEFAULT_MAP_PARAMS: {
            "antarctic": {
                "projection": "EPSG:3031",
                "proj_extent": [-5000000,-5000000,5000000,5000000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,                
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 56, 28, 14, 5.6, 2.8, 1.4, 0.56]
            },
            /* For CCAMLR */
            "antarctic_laea": {
                "projection": "EPSG:102020",
                "proj_extent": [-5500000,-5500000,5500000,5500000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,               
                "resolutions": [14000, 7000, 2800, 1400, 560, 280, 140]                
            },
            "arctic": {
                "projection": "EPSG:3995",
                "proj_extent": [-4000000,-4000000,4000000,4000000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,               
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140]
            }, 
            "southgeorgia":{
                "projection": "EPSG:3762",
                "proj_extent": [-929362.849,-1243855.108,1349814.294,556833.528],
                "center": [-1000.0, 61900.0],
                "zoom": 4,
                "rotation": 0,                
                "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.12, 0.56, 0.28, 0.14]
            },
            "midlatitudes": {
                "projection": "EPSG:3857",  /* Spherical Mercator as per OSM/Google */
                "proj_extent": [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,                
                "resolutions": []
            }
        },
        
        /**
         * Default embedded map layers for different regions
         * @param {String} region
         * @return {Object}
         */
        defaultEmbeddedLayers: function(region) {
            return(this.getBaseLayers(region, true).concat(this.getTopoLayers(region, true)));
        },
        
        /**
         * Default layers for different regions
         * @param {String} region
         * @return {Object}
         */
        defaultLayers: function(region) {            
            if (region == "antarctic") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",                        
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("antarctic", false)
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("antarctic", false)
                    }
                ]);
            } else if (region == "antarctic_laea") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",                        
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("antarctic_laea", false)
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("antarctic_laea", false)
                    }
                ]);
            } else if (region == "arctic") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("arctic", false)
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("arctic", false)
                    }
                ]);
            } else if (region == "southgeorgia") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("southgeorgia", false)
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("southgeorgia", false)
                    }
                ]);
            } else if (region == "midlatitudes") {
                return([
                    {
                        "id": null,
                        "name": "OpenStreetMap",
                        "expanded": true,
                        "layers": this.getBaseLayers("midlatitudes", false)
                    }
                ]);
            } else {
                return([]);
            }            
        },
        
        /**
         * Get array of base layer definitions for the supplied region
         * @param {String} region antarctic|antarctic_laea|arctic|southgeorgia|midlatitudes
         * @param {boolean} embedded
         * @return {Array}
         */
        getBaseLayers: function(region, embedded) {            
            if (region == "antarctic") {
                return ([this.layerSpecification("Hillshade and bathymetry", {
                    "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                    "feature_name": "add:antarctic_hillshade_and_bathymetry",
                    "is_base": true
                }, embedded)]);               
            } else if (region == "antarctic_laea") {                
                return([this.layerSpecification("Hillshade and bathymetry", {
                    "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                    "feature_name": "gis:hillshade_and_bathymetry",
                    "is_base": true
                }, embedded)]);
            } else if (region == "arctic") {
                return([this.layerSpecification("Hillshade and bathymetry", {
                    "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                    "feature_name": "arctic:arctic_hillshade_and_bathymetry",
                    "is_base": true,
                    "is_dem": true
                }, embedded)]);
            } else if (region == "southgeorgia") {
                return([this.layerSpecification("Hillshade and bathymetry", {
                    "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                    "feature_name": "sggis:sg_hillshade_and_bathymetry",
                    "is_base": true,
                    "is_dem": true
                }, embedded)]);                
            } else if (region == "midlatitudes") {
                return([
                    magic.modules.Endpoints.getMidLatitudeCoastSource(embedded)
                ]);
            } else {             
                return([]);
            }
        },
        
        /**
         * Get array of topo layer definitions for the supplied region
         * @param {String} region antarctic|antarctic_laea|arctic|southgeorgia|midlatitudes
         * @param {boolean} embedded
         * @return {Array}
         */
        getTopoLayers: function(region, embedded) {
            if (region == "antarctic") {
                return ([
                    this.layerSpecification("Coastline", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                        "feature_name": "add:antarctic_coastline"
                    }, embedded),
                    this.layerSpecification("Sub-Antarctic coastline", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                        "feature_name": "add:sub_antarctic_coastline"
                    }, embedded)
                ]);                 
            } else if (region == "antarctic_laea") {
                return ([
                    this.layerSpecification("Coastline", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                        "feature_name": "gis:coastline"
                    }, embedded)
                ]);                
            } else if (region == "arctic") {
                return ([
                    this.layerSpecification("Coastline", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                        "feature_name": "arctic:arctic_coastline"
                    }, embedded)
                ]);                         
            } else if (region == "southgeorgia") {
                return ([
                    this.layerSpecification("Coastline", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                        "feature_name": "sggis:sg_coastline"
                    }, embedded),
                    this.layerSpecification("Surface", {
                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                        "feature_name": "sggis:sg_surface"
                    }, embedded)
                ]);                    
            } else {            
                return([]);
            }
        },
                
        /**
         * Construct layer specification JSON object
         * @param {String} name
         * @param {Object} sourceData
         * @param {boolean} embedded
         * @return {Object}
         */
        layerSpecification: function(name, sourceData, embedded) {
            return(jQuery.extend({
                "id": null,
                "name": name,
                "is_visible": true
            }, embedded ? sourceData : {"source": sourceData}));
        },
        
        /**
         * Get an approximate asset heading from a COMNAP track
         * @param {ol.geom.LineString} track
         * @returns {double}
         */
        headingFromTrackGeometry: function(track) {
            var heading = 0;
            var coords = track.getCoordinates();
            if (jQuery.isArray(coords) && coords.length >= 2) {
                /* This is a simple linestring with enough points to do the calculation */
                var c0 = coords[coords.length-2];
                var c1 = coords[coords.length-1];
                var v01 = new Vector(c1[0]-c0[0], c1[1]-c0[1]);
                var v0n = new Vector(0, 1);
                heading = Math.acos(v01.unit().dot(v0n));
            }
            return(heading);
        },
        /**
         * Get geometry type
         * @param {ol.Geometry} geom
         * @returns {String point|line|polygon|collection}
         */
        getGeometryType: function(geom) {
            var geomType = "point";
            if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
                geomType = "line";
            } else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
                geomType = "polygon";
            } else if (geom instanceof ol.geom.GeometryCollection) {
                geomType = "collection";
            }  
            return(geomType);
        },
        
        /**
         * Format a lon/lat coordinate according to global preference
         * @param {float} coordinate
         * @param {string} destFormat (dms|ddm|dd)
         * @param {string} axis (lon|lat)
         * @param {int} dp
         * @returns {String}
         */
        formatCoordinate: function(coordinate, destFormat, axis, dp) {
            var formattedValue = null;
            if (!dp && dp != 0) {
                dp = 4;
            }                   
            if (this.validCoordinate(coordinate, axis == "lat", false)) {
                /* Quick sanity check that it's a sensible number passes */
                var dd = this.toDecDegrees(coordinate);
                if (!isNaN(dd)) {
                    dd = parseFloat(dd.toFixed(dp));
                    switch (destFormat) {
                        case "dms":
                            formattedValue = this.toDMS(dd, axis, "dms");
                            break;
                        case "ddm":
                            formattedValue = this.toDDM(dd, axis);
                            break;
                        default:
                            formattedValue = dd;
                            break;
                    }
                } else {
                    formattedValue = coordinate;
                }
            } else {
                formattedValue = coordinate;
            }
            return(formattedValue);
        },
        
        /**
         * Format a latitude/longitude co-ordinate according to a DMS scheme
         * @param {float} coordinate
         * @param {string} axis (lon|lat)
         * @returns {string}
         */
        toDMS: function(coordinate, axis) {
            var out = "";
            if (axis == "lon") {
                var sourceCoord = [coordinate, 0.1];
                var destCoord = ol.coordinate.toStringHDMS(sourceCoord);
                var divider = "N";
                out = destCoord.substring(destCoord.indexOf(divider)+2);
            } else {
                var sourceCoord = [0.0, coordinate];
                var destCoord = ol.coordinate.toStringHDMS(sourceCoord);
                var divider = coordinate < 0 ? "S" : "N";
                out = destCoord.substring(0, destCoord.indexOf(divider)+1);
            }
            return(out);
        },
        
        /**
         * Format a latitude/longitude according to a degrees decimal minutes scheme
         * @param {float} coordinate
         * @param {string} axis
         * @returns {string}
         */
        toDDM: function(coordinate, axis) {
            var ddm = "";
            var dms = this.toDMS(coordinate, axis);
            var dmsParts = dms.split(/[^A-Za-z0-9.]+/);
            if (dmsParts.length == 4) {
                var dmins = parseFloat(dmsParts[1]) + parseFloat(dmsParts[2] / 60.0);
                ddm = dmsParts[3] + dmsParts[0] + " " + (dmins.toFixed(3));
            }
            return(ddm);
        },
        
        /**
         * Take a co-ordinate value which might be in decimal degrees, DMS (dd mm ss.ssH) or degrees, decimal minutes, and convert to decimal degrees
         * @param {string} value
         * @return {float|NaN}
         */
        toDecDegrees: function(value) {
            var res = value;
            if (!jQuery.isNumeric(value)) {
                /* Try DMS */
                res = Number.NaN;
                value = value.trim().toUpperCase();
                var hh = "X";
                var dd = 0.0, mm = 0.0, ss = 0.0;
                var c1 = value.charAt(0), cn = value.charAt(value.length-1);
                if (c1 == "N" || c1 == "S" || c1 == "E" || c1 == "W") {
                    hh = c1;
                    value = value.substring(1);
                } else if (cn == "N" || cn == "S" || cn == "E" || cn == "W") {
                    hh = cn;
                    value = value.substring(0, value.length-1);
                }
                if (hh != "X") {
                    value = value.replace(/[^0-9.]{1,}/g, " ");
                    value = value.trim();
                    var parts = value.split(" ");
                    dd = parseFloat(parts[0]);
                    if (parts.length > 1) {
                        mm = parseFloat(parts[1]);
                    }
                    if (parts.length > 2) {
                        ss = parseFloat(parts[2]);
                    }
                    res = (dd + mm / 60.0 + ss / 3600.0) * ((hh == "S" || hh == "W") ? -1.0 : 1.0); 
                }                
            }
            return(isNaN(res) ? Number.NaN : parseFloat(res));
        },
        
        /**
         * Validate a co-ordinate value (lon/lat)
         * @param {string} value
         * @param {boolean} isLat
         * @param {boolean} allowBlank
         * @return boolean
         */
        validCoordinate: function (value, isLat, allowBlank) {
            var ok = false;
            if (!value && allowBlank) {
                ok = true;
            } else {
                var rangeLo = isLat ? -90.0 : -180.0;
                var rangeHi = isLat ? 90.0 : 180.0;
                var conversion = this.toDecDegrees(value);
                if (!isNaN(conversion)) {
                    ok = magic.modules.Common.floatInRange(conversion, rangeLo, rangeHi, 1e-08);
                }
            }
            return(ok);
        },
        
        /**
         * Check a hemisphere specification is one character and is N|S|E|W
         * @param {string} h
         * @return boolean
         */
        validHemisphere: function(h) {
            return(h.length == 1 && h.match(/N|E|S|W|n|e|s|w/));
        },
                          
        /**
         * Format a distance, area or elevation value
         * @param {float} value
         * @param {int} dims 1|2
         * @param {string} destFormat
         * @param {string} sourceFormat
         * @param {int} dp
         * @returns {String}
         */
        formatSpatial: function(value, dims, destFormat, sourceFormat, dp) {
            if (!jQuery.isNumeric) {
                return("");
            }
            if (!dp && dp != 0) {
                dp = 1;
            }
            var formattedValue = value;
            if (sourceFormat != destFormat) {
                var multipliers = {
                    "m": 1.0,
                    "ft": 3.2808399,
                    "km": 0.001,
                    "mi": 0.000621371192,
                    "nm": 0.000539956803
                };                
                value = parseFloat(value);
                if (sourceFormat != "m") {
                    /* Convert first to metres */
                    for (var i = 0; i < dims; i++) {
                        value *= 1/multipliers[sourceFormat];
                    }
                }
                /* Metres to destination format step */
                if (destFormat != "m") {
                    for (var i = 0; i < dims; i++) {
                        value *= multipliers[destFormat];
                    }
                }                
                formattedValue = value.toFixed(dp) + destFormat;           
            } else {
                formattedValue += destFormat;
            }
            return(formattedValue);
        },
        
        /**
         * Format a bounding box received as [[x0, y0], [x1, y1]] or as a flat array
         * @param {Array} bbox
         * @param {int} dp
         * @returns {String}
         */
        formatBbox: function(bbox, dp) {
            if (!bbox) {
                return("");
            }
            if (!dp && dp != 0) {
                dp = 1;
            }
            var flattened = jQuery.map(bbox, function(n) {return(n)}),
                captions = ["minx", "miny", "maxx", "maxy"],                       
                values = [];
            jQuery.each(flattened, function(idx, item) {
                values.push(captions[idx] + " : " + parseFloat(item).toFixed(dp));
            });
            return(values.join("<br>"));
        },
        
        /**
         * Create a suitable display extent from the given data extent (basically set a minimum size in case where the latter is very small)
         * @param {Array} dataExtent
         * @param {int} buffer size in metres
         * @returns {Array}
         */
        bufferExtent: function(dataExtent, buffer) {
            var extentOut = dataExtent.slice(0);
            var DEFAULT_BUFFER = 10000;
            buffer = buffer || DEFAULT_BUFFER;
            var dataCentroid = [0.5*(dataExtent[2] - dataExtent[0]), 0.5*(dataExtent[3] - dataExtent[1])];
            if (dataExtent[2] - dataExtent[0] < buffer) {
                extentOut[0] = dataCentroid[0] - 0.5*buffer;
                extentOut[2] = dataCentroid[0] + 0.5*buffer;
            }
            if (dataExtent[3] - dataExtent[1] < buffer) {
                extentOut[1] = dataCentroid[1] - 0.5*buffer;
                extentOut[3] = dataCentroid[1] + 0.5*buffer;
            }
            return(extentOut);
        },
        /**
         * Format a projection received as e.g. EPSG:3031
         * @param {string} proj
         * @returns {string}
         */
        formatProjection: function(proj) {
            var formattedValue = "";
            var code = proj.split(":").pop();
            if (!isNaN(parseInt(code)) && (code < 32768 || code == 102020)) {
                formattedValue = '<a href="http://epsg.io/?q=' + code + '" target="_blank">' + proj + '</a>';
            } else {
                formattedValue = proj;
            } 
            return(formattedValue);
        },
        
        /**
         * Apply unit preferences to a value
         * @param {string} name coordinates|distance|area|elevation
         * @param {string|double|int} value
         * @param {string} coord (lon|lat)
         * @param {string} setting value of the user's preference for the above                  
         * @param {string} sourceFormat to help conversion where the source format is unknown
         * @return {string|number}
         */
        applyPref: function(name, value, coord, setting, sourceFormat) {
            var out = value;
            if (!coord && name == "coordinates") {
                coord = "lon";
            }
            if (!setting) {
                setting = magic.runtime.preferences[name];
            }
            if (!sourceFormat && (name == "distance" || name == "area" || name == "elevation")) {
                sourceFormat = "m";
            }            
            switch(name) {
                case "coordinates":
                    out = this.formatCoordinate(value, setting, coord);
                    break;                
                case "distance":
                    out = this.formatSpatial(value, 1, setting, sourceFormat, 2);
                    break;
                case "area":
                    out = this.formatSpatial(value, 2, setting, sourceFormat, 2);
                    break;
                case "elevation":
                    out = this.formatSpatial(value, 1, setting, sourceFormat, 1);
                    break;
                default:
                    break;
            }
            return(out);
        },
        
        /**
         * Is projection with given EPSG code a polar one?
         * @param {string} proj
         * @return {Boolean}
         */
        isPolarProjection: function(proj) {
            switch(proj) {
                case "EPSG:3031":                
                case "EPSG:3995":
                case "EPSG:102020": 
                    return(true);
                default:
                    return(false);
            }
        },
        
        /**
         * Get the lat/lon extent of a projection
         * @param {string} proj
         * @returns {ol.Extent}
         */
        projectionLatLonExtent: function(proj) {
            var extent = [];
            switch(proj) {
                case "EPSG:3031":
                    extent = [-180.0, -90.0, 180.0, -50.0];
                    break;
                case "EPSG:3995":
                    extent = [-180.0, 60.0, 180.0, 90.0];
                    break;
                case "EPSG:3762":
                    extent = [-50.0, -65.0, -18.0, -50.0];
                    break;
                case "EPSG:102020": 
                    extent = [-180.0, -89.0, 180.0, -30.0];
                    break;
                default:
                    extent = [-180.0, -85.06, 180.0, 85.06];
                    break;
            }
            return(extent);
        },
        
        /**
         * 
         * @param {ol.Coordinate} coordinate
         * @param {ol.Extent} extent
         * @returns {boolean}
         */
        withinExtent: function(coordinate, extent) {
            return(
                magic.modules.Common.floatInRange(coordinate[0], extent[0], extent[2], this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatInRange(coordinate[1], extent[1], extent[3], this.ANGULAR_TOLERANCE)
            );
        },
        
        /**
         * Detect if two longitudes representing a segment are equal and coincide with the dateline 
         * (+/- 180 to within tolerance)
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        alongDateline: function(lon0, lon1) {
            return(
                magic.modules.Common.floatsEqual(lon0, lon1, this.ANGULAR_TOLERANCE) &&
                (
                    magic.modules.Common.floatsEqual(lon0, -180.0, this.ANGULAR_TOLERANCE) ||
                    magic.modules.Common.floatsEqual(lon0, 180.0, this.ANGULAR_TOLERANCE)
                )
            );
        },
        
        /**
         * Detect if a segment crosses the dateline, assuming the given longitudes are to be interpreted
         * as increasing in the clockwise direction		 
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        crossesDateline: function(lon0, lon1) {
            return(lon0 > 0 && lon1 < 0 && !magic.modules.Common.floatsEqual(lon0, lon1, this.ANGULAR_TOLERANCE));
        },
        
        /**
         * Detect if two latitudes representing a segment are equal and coincide with the a pole (+/-90 to within tolerance)
         * @param {float} lat0
         * @param {float} lat1
         * @param {string} hemi N|S
         * @return {boolean}
         */
        atPole: function(lat0, lat1, hemi) {
            var poleLat = !hemi ? -90.0 : (hemi == "S" ? -90.0 : 90.0);
            return(
                magic.modules.Common.floatsEqual(lat0, lat1, this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatsEqual(lat0, poleLat, this.ANGULAR_TOLERANCE)
            );
        },
        
        /**
         * Detect if longitudes are circumpolar 
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        isCircumpolar: function(lon0, lon1) {
            return(
                magic.modules.Common.floatsEqual(lon0, -180.0, this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatsEqual(lon1, 180.0, this.ANGULAR_TOLERANCE)
            );
        },
        
        /**
         * Compute geodesic length of linestring
         * @param {ol.geom.linestring} geom
         * @param {ol.Map} map
         * @returns {float}
         */
        geodesicLength: function(geom, map) {
            map = map || magic.runtime.map;
            var geodesicLength = 0.0;
            var coords = geom.getCoordinates();
            for (var i = 0, ii = coords.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coords[i], map.getView().getProjection().getCode(), "EPSG:4326");
                var c2 = ol.proj.transform(coords[i + 1], map.getView().getProjection().getCode(), "EPSG:4326");
                geodesicLength += this.WGS84.haversineDistance(c1, c2);
            }    
            return(geodesicLength);
        },

        /**
         * Compute geodesic area of polygon
         * @param {ol.geom.polygon} geom
         * @param {ol.Map} map
         * @returns {float}
         */
        geodesicArea: function(geom, map) {    
            var polyClone = geom.clone().transform(map.getView().getProjection().getCode(), "EPSG:4326");    
            return(Math.abs(this.WGS84.geodesicArea(polyClone.getLinearRing[0].getCoordinates())));
        },
        
        /**
         * Compute the sum of all the supplied extents
         * @param {Array<ol.extent>} extents
         * @return {Array}
         */
        uniteExtents: function(extents) {
            if (!extents || (jQuery.isArray(extents) && extents.length == 0)) {
                return(null);
            }
            var minx = null, miny = null, maxx = null, maxy = null;
            for (var i = 0; i < extents.length; i++) {
                minx = (minx == null ? extents[i][0] : Math.min(minx, extents[i][0]));
                miny = (miny == null ? extents[i][1] : Math.min(miny, extents[i][1]));
                maxx = (maxx == null ? extents[i][2] : Math.max(maxx, extents[i][2]));
                maxy = (maxy == null ? extents[i][3] : Math.max(maxy, extents[i][3]));
            }
            return([minx, miny, maxx, maxy]);
        },
        
        /**
         * Compute the minimum enclosing extent in projected co-ordinates of the given EPSG:4326 extent
         * Done by breaking the extent at the dateline if necessary, then densifying and reprojecting
         * @param {ol.extent} extent    
         * @param {String} destProj e.g. EPSG:3031    
         * @return {ol.extent}
         */
        extentFromWgs84Extent: function(extent, destProj) {
            if (!destProj) {
                if (magic.runtime.map) {
                    destProj = magic.runtime.map.getView().getProjection().getCode()
                } else {
                    return(extent);
                }
            }
            var bbox = [];
            var finalExtent = null;
            var lon0 = extent[0], lat0 = extent[1], lon1 = extent[2], lat1 = extent[3];
            var sourceProj = ol.proj.get("EPSG:4326");
            if (this.isCircumpolar(lon0, lon1)) {
                /* Pan-Antarctic request */
                var extPt = new ol.geom.Point([0, lat1]);
                extPt.transform(sourceProj, destProj);
                var ymax = extPt.getCoordinates()[1];
                finalExtent = [-ymax, -ymax, ymax, ymax];
            } else {
                if (this.crossesDateline(lon0, lon1)) {
                    /* Break bounding box at anti-meridian */
                    bbox.push([lon0, lat0, 180.0, lat1]);
                    bbox.push([-180.0, lat0, lon1, lat1]);
                } else {
                    bbox.push([lon0, lat0, lon1, lat1]);
                }
                for (var i = 0; i < bbox.length; i++) {
                    var densifiedPoly = this.densify(bbox[i]);
                    densifiedPoly.transform(sourceProj, destProj);                    
                    if (finalExtent == null) {
                        finalExtent = densifiedPoly.getExtent();
                    } else {
                        finalExtent.extend(densifiedPoly.getExtent());
                    }
                }
            }
            return(finalExtent);
        },
        
        /**
         * Create a polygon from the given box by interpolating points along each segment
         * @param {OpenLayers.Bounds} bbox
         * @return {OpenLayers.Geometry.Polygon}
         */
        densify: function(bbox) {
            var densPts = [];
            var pts = [
                [bbox[0], bbox[1]],
                [bbox[0], bbox[3]],
                [bbox[2], bbox[3]],
                [bbox[2], bbox[1]]
            ];
            for (var i = 0; i < pts.length; i++) {
                var nxti = (i+1) % 4,
                    xDiff = parseFloat(pts[nxti][0] - pts[i][0]), 
                    yDiff = parseFloat(pts[nxti][1] - pts[i][1]);
                for (var j = 0; j <= this.N_INTERP; j++) {
                    var proportion = parseFloat(j) / parseFloat(this.N_INTERP+1);
                    densPts.push([parseFloat(pts[i][0]) + proportion*xDiff, parseFloat(pts[i][1]) + proportion*yDiff]);
                }
            }
            return(new ol.geom.Polygon([densPts], "XY"));
        },
        
        /**
         * Get scale of map
         * https://groups.google.com/forum/#!searchin/ol3-dev/dpi/ol3-dev/RAJa4locqaM/4AzBrkndL9AJ
         * @param {ol.Map} map (defaults to magic.runtime.map)
         * @returns {float}
         */
        getCurrentMapScale: function(map) {
            map = map || magic.runtime.map;   
            var resolution = map.getView().getResolution();
            var units = map.getView().getProjection().getUnits();
            var dpi = 25.4 / 0.28;
            var mpu = ol.proj.METERS_PER_UNIT[units];
            var scale = resolution * mpu * 39.37 * dpi; /* NB magic numbers */
            return(parseFloat(scale));
        },
        
        /**
         * Get resolution corresponding to given scale
         * @param {number} scale
         * @param {Array} resolutions
         * @param {ol.proj.projection} proj
         * @returns {float}
         */
        getResolutionFromScale: function(scale, resolutions, proj) {
            if ((!resolutions || !proj) && !magic.runtime.map) {
                return(0.0);
            }
            resolutions = resolutions || magic.runtime.map.getView().getResolutions();
            proj = proj || magic.runtime.map.getView().getProjection();
            var res = resolutions[0];
            if (!isNaN(scale)) {
                var units = proj.getUnits();
                var dpi = 25.4 / 0.28;
                var mpu = ol.proj.METERS_PER_UNIT[units];
                res = parseFloat(scale)/(mpu * 39.37 * dpi);
            }
            return(res);
        },
        
        /**
         * For a point in projected co-ordinates, translate a heading so it looks plausible on the map
         * @param {ol.geom.Point} p
         * @param {float} heading
         * @return {float}
         */
        headingWrtTrueNorth: function(p, heading) {
            var pcoords = p.getCoordinates();
            var vp = new Vector(pcoords[0], pcoords[1]);
            /* Point towards top of map from P */
            var b = new ol.geom.Point([0, 1]);
            var vb = new Vector(b.x, b.y);		
            var cosAngle = vp.unit().dot(vb);
            return((heading - 180.0*Math.acos(cosAngle)/Math.PI) % 360.0);
        }
        
    });

}();