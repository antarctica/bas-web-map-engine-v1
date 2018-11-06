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
        creator: {}
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


/* Prototype class for pop-up editable form tools */

magic.classes.PopupForm = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover selector (can assign to multiple elements) */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Popup edit form";
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || "";
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* Pre-populator */
    this.prePopulator = options.prePopulator || {};
    
    /* Sub-forms */
    this.subForms = {};
    
    /* === Internal properties === */
    this.active = false;

    /* Control callbacks */
    this.controlCallbacks = {
        onActivate: jQuery.proxy(function(payload) {
            this.prePopulator = payload;             
            this.target.popover("show");    
        }, this),
        onDeactivate: jQuery.proxy(function(quiet) {            
            if (!quiet && this.formDirty()) { 
                /* Prompt user about unsaved edits */
                bootbox.confirm({
                    message: "Unsaved edits - save before closing?",
                    buttons: {
                        confirm: {
                            label: "Yes",
                            className: "btn-success"
                        },
                        cancel: {
                            label: "No",
                            className: "btn-danger"
                        }
                    },
                    callback: jQuery.proxy(function (result) {
                        if (result) {                
                            if (jQuery.isFunction(this.saveForm)) {
                                if (!jQuery.isEmptyObject(this.subForms)) {
                                    jQuery.each(this.subForms, function(k, frm) {
                                        if (jQuery.isFunction(frm.saveForm)) {
                                            frm.saveForm();
                                        }                                        
                                    });
                                }                               
                                this.saveForm();
                            }                
                        } else {
                            this.savedState = {};
                            this.cleanForm();
                            this.tidyUp();
                            this.target.popover("hide");
                        }                        
                    }, this)
                });
            } else {                
                this.savedState = {};
                this.cleanForm();
                this.tidyUp();
                this.target.popover("hide");
            }    
        }, this)
    };    
    
    /* Form changed */
    this.formEdited = false; 
    
    /* The state of the form on save */
    this.clearState();
    
    /* Popover template */    
    this.template = 
        '<div class="popover popover-auto-width' + (this.popoverClass ? ' ' + this.popoverClass : '') + '" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title">' + this.caption + '</h3>' +
            '<div class="popover-content' + (this.popoverContentClass ? ' ' + this.popoverContentClass : '') + '"></div>' +
        '</div>';       
};

magic.classes.PopupForm.prototype.getFormValue = function () {
    return(this.savedState);
};

magic.classes.PopupForm.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.PopupForm.prototype.getTemplate = function () {
    return(this.template);
};

magic.classes.PopupForm.prototype.getCaption = function () {
    return(this.caption);
};

magic.classes.PopupForm.prototype.setCaption = function (newCaption) {
    this.caption = newCaption;
};

magic.classes.PopupForm.prototype.isActive = function () {
    return(this.active);
};

magic.classes.PopupForm.prototype.titleMarkup = function() {
    return(
        '<span><big><strong>' + this.caption + '</strong></big>' + 
            '<button type="button" class="close dialog-deactivate" style="margin-left:5px">&times;</button>' +             
        '</span>'
    );
};

/**
 * Set the callbacks to be invoked on tool activate, deactivate and minimise
 * keys:
 *   onActivate
 *   onDeactivate
 * @param {Object} callbacksObj
 */
magic.classes.PopupForm.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};

magic.classes.PopupForm.prototype.assignCloseButtonHandler = function () {
    jQuery("." + this.popoverClass).find("button.dialog-deactivate").off("click").on("click", jQuery.proxy(function () {
        this.deactivate(false);        
    }, this));    
};  

/**
 * Activate the control, optionally populating the form
 * @param {Object} payload
 */
magic.classes.PopupForm.prototype.activate = function (payload) {
    this.active = true; 
    if (jQuery.isFunction(this.controlCallbacks["onActivate"])) {
        this.controlCallbacks["onActivate"](payload);
    }
};

/**
 * Deactivate the control
 * @param {boolean} suppress prompt inform about unsaved edits
 */
magic.classes.PopupForm.prototype.deactivate = function (quiet) {    
    this.active = false;
    if (jQuery.isFunction(this.controlCallbacks["onDeactivate"])) {
        this.controlCallbacks["onDeactivate"](quiet);
    }
};

/**
 * Deactivate the control after n milliseconds
 * @param {int} wait time
 */
magic.classes.PopupForm.prototype.delayedDeactivate = function (millis) {    
    setTimeout(jQuery.proxy(function() {
        this.deactivate(true);
    }, this), millis);
};

/**
 * Clear a saved state
 */
magic.classes.PopupForm.prototype.clearState = function () {
    this.savedState = {};
};

/**
 * Has the form been edited?
 * @return {Boolean}
 */
magic.classes.PopupForm.prototype.formDirty = function() {
    return(this.formEdited);
};

/**
 * Clean the form i.e. reset the edited flag
 * @return {Boolean}
 */
magic.classes.PopupForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

/**
 * Deactivate all sub-forms
 * @param {boolean} quiet to suppress warnings about unsaved edits  
 */
magic.classes.PopupForm.prototype.tidyUp = function(quiet) {
    if (!jQuery.isEmptyObject(this.subForms)) {
        jQuery.each(this.subForms, function(k, frm) {
            if (frm != null && jQuery.isFunction(frm.deactivate)) {
                frm.deactivate(quiet);
            }                                        
        });
    }      
};
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
            return(jQuery.grep(magic.runtime.endpoints, jQuery.proxy(function(ep) {
                if (filterName == "id") {
                    return(ep[filterName] == filterValue);
                } else if (filterName == "url") {
                    /* Note that stored endpoints should be WMS ones, so remove wms|wfs|wcs from end of filter */
                    var serviceNeutralFilter = filterValue.replace(/\/w[cfm]s$/, "");
                    /* Check for REST endpoints and strip everything before /rest */
                    var restIdx = serviceNeutralFilter.indexOf("/rest");
                    if (restIdx != -1) {
                        serviceNeutralFilter = serviceNeutralFilter.substring(0, restIdx);
                    }
                    var foundUrl = ep[filterName].indexOf(serviceNeutralFilter) == 0;                   
                    if (!foundUrl && ep["url_aliases"]) {
                        /* Check any of the aliases match in protocol, host and port */
                        var aliases = ep["url_aliases"].split(",");
                        for (var i = 0; !foundUrl && i < aliases.length; i++) {
                            foundUrl = aliases[i].indexOf(serviceNeutralFilter) == 0;
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
            "#FF6403", /* orange */
            "#800000", /* dark red */
            "#DD0907", /* red */
            "#F20884", /* magenta */
            "#4700A5", /* purple */
            "#0000D3", /* blue */
            "#02ABEA", /* cyan */
            "#1FB714", /* green */
            "#006412", /* dark green */
            "#562C05", /* brown */
            "#90713A", /* tan */
            "#808080", /* medium grey */
            "#404040", /* dark grey */
            "#000000"   /* black */
        ],
        /**
         * Convert hex RGB in form #ffffff to decimal
         * http://stackoverflow.com/questions/8468855/convert-a-rgb-colour-value-to-decimal
         * @param {string} rgb
         * @returns {string}
         */
        rgbToDec: function (rgb, opacity) {
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
        scrollViewportToElement: function (target) {
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
        buttonFeedbackSet: function (btnBaseId, msg, size, btnCaption, cancel) {
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
                    '<span class="fa fa-times-circle post-error"></span> Error' +
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
        buttonClickFeedback: function (btnBaseId, success, msg) {
            var btnGo = jQuery("#" + btnBaseId + "-go"),
                    btnFbOk = jQuery("#" + btnBaseId + "-fb-ok"),
                    btnFbError = jQuery("#" + btnBaseId + "-fb-error"),
                    effect;
            btnGo.hide();
            /* See https://api.jquery.com/promise/ for queuing up animations like this */
            if (success) {
                btnFbOk.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function () {
                    return(btnFbOk.fadeIn(300).delay(1200).fadeOut(300))
                };
            } else {
                btnFbError.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function () {
                    return(btnFbError.fadeIn(600).delay(6000).fadeOut(600))
                };
            }
            jQuery.when(effect()).done(function () {
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
        fetchStyle: function (geomType, paletteEntry, label) {
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
         * Make some different choices for icon style for points to allow more distinction between layers on the map
         * Supports:
         * - circle
         * - star
         * - square
         * - triangle
         * @param {int} paletteEntry
         * @returns {ol.style.<Circle|RegularShape>}
         */
        getPointImageStyle: function (paletteEntry) {
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
        labelVisibility: function (feat, layer, vis, fcount) {
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
                    /* Strip HTML <p> and <br> tags which sometimes occur in KML */
                    text = text.replace(/<p>/g, "\n");
                    text = text.replace(/<br>/g, "\n");
                    if (vis) {
                        label.setText(text + (fcount > 1 ? " (+" + (fcount - 1) + ")" : ""));
                    } else {
                        label.setText(text.replace(/\s+\(\+\d+\)$/, ""));
                    }
                    var stroke = label.getStroke();
                    var scolor = stroke.getColor();
                    if (!jQuery.isArray(scolor)) {
                        /* Will be of form rgba(255, 255, 255, 0.0) */
                        stroke.setColor(scolor.substring(0, scolor.lastIndexOf(",") + 1) + (vis ? "1.0" : "0.0") + ")");
                    } else {
                        /* [R, G, B, OP] */
                        scolor[3] = (vis ? "1.0" : "0.0");
                        stroke.setColor(scolor);
                    }
                    var fill = label.getFill();
                    var fcolor = fill.getColor();
                    if (!jQuery.isArray(fcolor)) {
                        /* Will be of form rgba(255, 255, 255, 0.0) */
                        fill.setColor(fcolor.substring(0, fcolor.lastIndexOf(",") + 1) + (vis ? "1.0" : "0.0") + ")");
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
        proxyUrl: function (url) {
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
        getWxsRequestUrl: function (wmsUrl, operation, feature) {
            var requestUrl = "";
            switch (operation.toLowerCase()) {
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
        getCapabilities: function (url, callback, typename) {
            if (magic.runtime.map_context.capabilities[url]) {
                callback(magic.runtime.map_context.capabilities[url], typename);
            } else {
                var parser = new ol.format.WMSCapabilities();
                jQuery.get(this.getWxsRequestUrl(url, "GetCapabilities"), jQuery.proxy(function (response) {
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
                    } catch (e) {
                        callback(null, typename, "Parsing GetCapabilities response from " + url + " failed with error " + e.message);
                    }
                }, this)).fail(function (xhr, status, errMsg) {
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
        defaultMouseover: function (evt) {
            var fcount = 0;
            var customHandled = false;
            var highlighted = null;
            evt.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function (feat, layer) {
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
        defaultMouseout: function (highlighted) {
            if (highlighted && highlighted.feature && highlighted.feature.get("_customHover") !== true) {
                /* No custom behaviour defined */
                this.labelVisibility(highlighted.feature, highlighted.layer, false, 1);
            }
        },
        /**
         * Get all vector features at the given pixel (e.g. from Geosearch or user GPX/KML layers)
         * @param {ol.Event} click event
         */
        featuresAtPixel: function (evt) {
            var fprops = [];
            evt.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                if (layer != null) {
                    /* This is not a feature overlay i.e. an artefact of presentation not real data */
                    var clusterMembers = feature.get("features");
                    if (clusterMembers && jQuery.isArray(clusterMembers)) {
                        /* Unpack cluster features */
                        jQuery.each(clusterMembers, function (fi, f) {
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
            }, {layerFilter: function (candidate) {
                    return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
                }}, this);
            return(fprops);
        },
        /**
         * Helper method for getCapabilities above - recursive trawler through GetCaps document
         * @param {Object} ftypes
         * @param {Array} layers
         */
        getFeatureTypes: function (ftypes, layers) {
            jQuery.each(layers, jQuery.proxy(function (idx, layer) {
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
        populateSelect: function (select, optArr, valAttr, txtAttr, defval, prependInvite) {
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
            optArr.sort(function (a, b) {
                var lca = a[txtAttr] ? a[txtAttr].toLowerCase() : a[valAttr].toLowerCase();
                var lcb = b[txtAttr] ? b[txtAttr].toLowerCase() : b[valAttr].toLowerCase();
                return((lca < lcb) ? -1 : (lca > lcb) ? 1 : 0);
            });
            jQuery.each(optArr, function (idx, optObj) {
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
        jsonToForm: function (fields, data, prefix) {
            jQuery.each(fields, function (idx, fo) {
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
        formToJson: function (fields, prefix) {
            var json = {};
            jQuery.each(fields, function (idx, fo) {
                var name = fo["field"];
                var input = jQuery("#" + prefix + "-" + name);
                switch (input.attr("type")) {
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
        flagInputError: function (inputEl) {
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
        showAlertModal: function (message, type) {
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
        resetFormIndicators: function () {
            jQuery("div.form-group").removeClass("has-error");
        },
        /**
         * Get JavaScript dynamically and cache
         * @param {String} url
         * @param {Function} callback
         */
        getScript: function (url, callback) {
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
                    row = ret[++r] = [l = ''];
                    i = 0;
                } else {
                    row[i] += l;
                }
                p = l;
            }
            return(ret);
        },
        sortedUniqueArray: function (arr) {
            var suArr = [];
            if (!arr || arr.length == 0) {
                return(suArr);
            }
            var dupHash = {};
            suArr = jQuery.map(arr, function (elt) {
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
        isUrl: function (str) {
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
        isNameLike: function (key) {
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
        isLongitudeLike: function (key) {
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
        isLatitudeLike: function (key) {
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
        isDatetimeLike: function (key) {
            key = key.toLowerCase();
            var dateKeys = ["^date.*$", "^time.*$", "^utc$", "^[^u]*update.*$", "timestamp$"];
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
            if (!value) {
                return("");
            }
            var formattedValue = value;
            var d = new Date(value);
            if (value.toLowerCase().indexOf("invalid") == -1) {
                var dd = d.getDate();
                dd = (dd < 10 ? "0" : "") + dd;
                var mm = d.getMonth() + 1;
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
        JsonEscape: function (str) {
            var strOut = str.replace(/\&/g, "&amp;");
            strOut = strOut.replace(/\"/g, "&quot;");
            return(strOut);
        },
        /**
         * JSON unescape for '&' and '"'
         * @param {String} str
         * @return {String}
         */
        JsonUnescape: function (str) {
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
            if (!str) {
                return("");
            }
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
        uuid: function () {
            return('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
                if (typeof value == "string") {
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
                formattedValue = '<a href="https://epsg.io/?q=' + code + '" target="_blank">' + proj + '</a>';
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
            if (value == null || value == undefined) {
                return("");
            }
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
/* Attribute map editor for embedded maps */

magic.classes.creator.EmbeddedAttributeEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-attr-editor",
        caption: "Edit attribute data",
        popoverClass: "em-attr-editor-popover",
        popoverContentClass: "em-attr-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    /* WMS service for the current feature */
    this.wmsService = options.wms_source;
    
    /* Feature name from above */
    this.featureName = options.feature_name;
    
    this.inputs = ["name", "type", "nillable", "alias", "ordinal", "displayed"];
       
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: '<p><i class="fa fa-spin fa-spinner"></i> Loading attributes...</p>'
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {                                 
        this.assignCloseButtonHandler();
        this.getFeatureAttributes(this.prePopulator);
    }, this));
            
};

magic.classes.creator.EmbeddedAttributeEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedAttributeEditorPopup;

/**
 * Retrieve attribute map for WMS source and feature type (not cached as may change)
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.getFeatureAttributes = function() {
    
    var dftUrl = magic.modules.Common.getWxsRequestUrl(this.wmsService, "DescribeFeatureType", this.featureName);
    if (!dftUrl) {
        jQuery(".em-attr-editor-popover-content").html('<div class="alert alert-info">No attributes found</div>');
    } else if (this.prePopulator && !jQuery.isEmptyObject(this.prePopulator)) {
        /* Restore form and contents from stored attributes */
        jQuery(".em-attr-editor-popover-content").html(this.markup(this.prePopulator, this.computeOgcGeomType(this.prePopulator)));
        this.assignHandlers();        
    } else {
        /* Issue DescribeFeatureType request via WFS */
        jQuery.ajax({
            url: dftUrl,
            method: "GET",
            dataType: "xml"
        })
        .done(jQuery.proxy(function(response) {
            /* Update : 13/09/2017 - As of about version 60, Chrome now suddenly works like everything else... */
            var elts = elts = jQuery(response).find("xsd\\:sequence").find("xsd\\:element");
            var attrList = [];
            jQuery.each(elts, function(idx, elt) {
                var attrs = {};
                jQuery.each(elt.attributes, function(i, a) {
                    if (a.name == "type") {
                        attrs[a.name] = a.value.replace("xsd:", "");
                    } else {
                        attrs[a.name] = a.value;
                    }                 
                });
                attrList.push(attrs);
            });
            jQuery(".em-attr-editor-popover-content").html(this.markup(attrList, this.computeOgcGeomType(attrList)));
            this.assignHandlers();            
        }, this))
        .fail(jQuery.proxy(function(xhr, status, message) {
            if (status == 401) {
                magic.modules.Common.showAlertModal("Not authorised to read data", "warning");                
            } else {
                magic.modules.Common.showAlertModal("Error : " + message + " from server while reading attributes", "warning");                
            }
        }, this));
    }    
};

magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-attr-table :input").off("change").on("change", jQuery.proxy(function() {
        this.formEdited = true;
    }, this));      

    /* Save button handler */
    jQuery("#" + this.id + "-go").off("click").on("click", jQuery.proxy(function() {           
        magic.modules.Common.buttonClickFeedback(this.id, true, "Saved ok");
        if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
            this.controlCallbacks["onSave"](this.formToPayload());
            this.delayedDeactivate(2000); 
        }            
    }, this));

    /* Cancel button */
    jQuery("#" + this.id + "-cancel").off("click").on("click", jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

/**
 * Create form HTML for the attribute map
 * @param {Array} attrList
 * @param {String} geomType
 * @returns {String}
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.markup = function(attrList, geomType) {    
    var html = "";
    if (attrList.length == 0) {
        /* No attributes found */
        html = '<div class="alert alert-info">No attributes found</div>';
    } else {
        /* Show attribute table */
        html += 
            '<div class="alert alert-info">Geometry type is <strong>' + geomType + '</strong></div>' + 
            '<table id="' + this.id + '-attr-table" class="table table-condensed table-striped table-hover table-responsive" style="width:100%">' + 
                '<tr>' + 
                    '<th style="width:200px">Name</th>' + 
                    '<th style="width:60px">Type</th>' + 
                    '<th style="width:120px">' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                    '</th>' +                     
                    '<th style="width:40px">' + 
                        '<i class="fa fa-list-ol" data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up"><i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><i>' + 
                    '</th>' + 
                '</tr>';
        jQuery.each(attrList, jQuery.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + (entry.name || "") + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + (entry.type || "") + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + (entry.nillable || "") + '"></input>';
            if (entry.type && entry.type.indexOf("gml:") != 0) {
                /* This is not the geometry field */                
                html += 
                '<tr>' + 
                    '<td><div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + (entry.name || "") + '</div></td>' +
                    '<td>' + entry.type.replace("xsd:", "") + '</td>' + 
                    '<td><input class="attr-editor-input" type="text" style="width: 120px" id="_amap_alias_' + idx + '" value="' + (entry.alias || "") + '"></input></td>' + 
                    '<td><input class="attr-editor-input" type="number" size="2" style="width: 37px" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + (entry.ordinal || "") + '"></input></td>' +                              
                    '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (entry.displayed === true ? ' checked="checked"' : '') + '></input></td>' +                
                '</tr>';
            }
        }, this));
        html += 
            '</table>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save attributes", "md", "Save", true)                                                       
    }    
    return(html);
};

/**
 * Convert form to attribute object array
 * @return {Array} payload
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.formToPayload = function() {
    var payload = [];
    jQuery("input[id^='_amap_type']").each(jQuery.proxy(function(ti, tval) {
        var type = jQuery(tval).val();
        if (type.indexOf("gml:") != 0) {
            var attrData = {};
            jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
                var fEl = jQuery("#_amap_" + ip + "_" + ti);
                if (fEl.attr("type") == "checkbox") {
                    attrData[ip] = fEl.prop("checked") === true ? true : false;
                } else if (ip == "ordinal") {
                    var ordVal = parseInt(fEl.val());
                    attrData[ip] = isNaN(ordVal) ? null : ordVal;
                } else {
                    attrData[ip] = fEl.val();
                }
            }, this));
            payload.push(attrData);
        }
    }, this));
    return(payload);    
};

/**
 * GML type to simple type (point|line|polygon)
 * @param {String} gmlType
 * @returns {String}
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.computeOgcGeomType = function(attrList) {
    var geomType = "unknown";
    jQuery.each(attrList, function(idx, data){
        if (data.type && data.type.indexOf("gml:") == 0) {
            /* This is the geometry attribute */
            var gmlType = data.type.toLowerCase();
            if (gmlType.indexOf("point") >= 0) {
                geomType = "point";
            } else if (gmlType.indexOf("line") >= 0 || gmlType.indexOf("curve") >= 0) {
                geomType = "line";
            } else if (gmlType.indexOf("polygon") >= 0) {
                geomType = "polygon";
            }
        }
        return(geomType == "unknown");
    });
    return(geomType);
};

/* Layer editor for embedded maps, implemented as a Bootstrap popover */

magic.classes.creator.EmbeddedLayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-layer-editor",
        caption: "Edit layer data",
        popoverClass: "em-layer-editor-popover",
        popoverContentClass: "em-layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);    
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name","default": ""},
        {"field": "attribution", "default": ""},
        {"field": "opacity", "default": 1.0},
        {"field": "is_base", "default": false},            
        {"field": "is_singletile", "default": false},                
        {"field": "is_interactive", "default": false},
        {"field": "is_extent", "default": false},
        {"field": "is_filterable", "default": false}
    ];
    
    /* Linked WMS feature select menus */
    this.wmsSelectors = new magic.classes.creator.WmsFeatureLinkedMenus({
        id: this.id
    });
    
    /* Attribute map editor */
    this.subForms.attributeEditor = null;
    
    /* Repository for layer attributes edited via the above sub-form */
    this.editedAttributes = [];
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-name").focus();
        
        this.editedAttributes = [];
        
        this.assignCloseButtonHandler();                
        this.assignHandlers();                
        this.payloadToForm(this.prePopulator);
    }, this));
       
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedLayerEditorPopup;

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-md-12">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<div class="form-group form-group-md col-md-12">' +                     
                '<label class="col-md-3 control-label" for="' + this.id + '-name"><span class="label label-danger">Name</span></label>' + 
                '<div class="col-md-9">' + 
                    '<input type="text" id="' + this.id + '-name" class="form-control" ' + 
                        'placeholder="Layer name" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            this.wmsSelectors.markup() + 
            '<div class="form-group form-group-md col-md-12">' +                     
                '<label class="col-md-3 control-label" for="' + this.id + '-attribution">Attribution</label>' + 
                '<div class="col-md-9">' + 
                    '<input type="text" id="' + this.id + '-attribution" class="form-control" ' + 
                        'placeholder="Data attribution" maxlength="255" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Data attribution">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-md col-md-12">' + 
                '<label for="' + this.id + '-opacity" class="col-md-3 control-label">Opacity</label>' + 
                '<div class="col-md-9">' + 
                    '<input type="number" class="form-control" id="' + this.id + '-opacity" ' + 
                       'placeholder="Layer opacity (0->1)" ' + 
                       'min="0" max="1" step="0.1" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Layer opacity (0.0 = transparent, 1.0 = opaque)" value="1.0">' + 
                    '</input>' + 
                '</div>' + 
            '</div>' +             
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' +
                    'title="Layer is a base (backdrop) layer">' + 
                    '<label>' +
                        '<input id="' + this.id + '-is_base" type="checkbox">' +                                                        
                         '</input> This is a base (backdrop) layer' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +    
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Layer renders as a single large tile, useful for place-names or rasters where tile edge effects are noticeable">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_singletile" type="checkbox">' + 
                         '</input> Render a single large tile' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +   
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="This layer should display interactive pop-ups on the map">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_interactive" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Layer displays interactive map pop-ups' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +        
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Use this layer to determine the starting extent of the map">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_extent" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Determine map extent from layer data' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +     
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Filter this layer via the \'filter\' URL parameter">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_filterable" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Filter this layer via URL parameters' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +     
            magic.modules.Common.buttonFeedbackSet(this.id, "Save data", "sm", "Save", true) +                 
        '</div>'
    );
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").off("change").on("change", jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Attributes checkbox */
    jQuery("#" + this.id + "-is_interactive").off("change").on("change", jQuery.proxy(function(evt, populator) {
        var checked = jQuery(evt.currentTarget).prop("checked");
        if (this.subForms.attributeEditor && this.subForms.attributeEditor.isActive()) {
            this.subForms.attributeEditor.deactivate();
        }
        if (checked) {            
            this.subForms.attributeEditor = new magic.classes.creator.EmbeddedAttributeEditorPopup({
                target: evt.currentTarget.id,
                wms_source: this.wmsSelectors.getValue("wms_source"),
                feature_name: this.wmsSelectors.getValue("feature_name"),
                onSave: jQuery.proxy(this.saveAttributes, this)
            });
            this.subForms.attributeEditor.activate(this.editedAttributes);
        }
    }, this));
    
    /* Save button */
    jQuery("#" + this.id + "-go").off("click").on("click", jQuery.proxy(function() {
        var valid = this.validate();
        if (valid) {
            magic.modules.Common.buttonClickFeedback(this.id, true, "Saved ok");
            if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                this.controlCallbacks["onSave"](this.formToPayload());
                this.delayedDeactivate(2000); 
            }
        } else {
            magic.modules.Common.buttonClickFeedback(this.id, false, "Failed to save - please correct marked errors");
        }     
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").off("click").on("click", jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.formToPayload = function() {
    return(jQuery.extend(true, {},
        magic.modules.Common.formToJson(this.formSchema, this.id), 
        {attribute_map: this.editedAttributes}, 
        this.wmsSelectors.formToPayload()
    ));
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    /* Initialise the linked WMS menus */
    this.wmsSelectors.init({
        wms_source: populator.wms_source || "",
        feature_name: populator.feature_name || "",
        style_name: populator.style_name || ""
    });
    magic.modules.Common.jsonToForm(this.formSchema, populator, this.id);
    if (populator.is_interactive === true) {
        /* Show attribute editor form */
        this.editedAttributes = populator["attribute_map"];
        jQuery("#" + this.id + "-is_interactive").trigger("change");
    }    
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.validate = function() {
    var ok = true;
    var editFs = jQuery("#" + this.id + "-edit-view-fs");
    jQuery.each(editFs.find("input[required='required']"), function(idx, ri) {
        var riEl = jQuery(ri);
        var fg = riEl.closest("div.form-group");
        var vState = riEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error");
        } else {
            fg.addClass("has-error");
            ok = false;
        }
    });
    return(ok);
};    

/**
 * onSave callback for the attribute editor sub-form
 * @param {Object} attrMap
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.saveAttributes = function(attrMap) {
    this.editedAttributes = attrMap;
};

/* Linked menus for WMS source, feature name and style */

magic.classes.creator.WmsFeatureLinkedMenus = function(options) {
    
    this.id = options.id || "wms-linked-menus";
        
    /* Map projection */
    this.projection = magic.runtime.projection;
    
    /* Controls */
    this.dropdowns = {};
    
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.getValue = function(key) {
    return(this.dropdowns[key].val());
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.formToPayload = function() {
    return({
        "wms_source": this.dropdowns.wms_source.val(),
        "feature_name": this.dropdowns.feature_name.val(),
        "style_name": this.dropdowns.style_name.val() || null
    });
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.markup = function() {
    return(
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-wms_source"><span class="label label-danger">WMS</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-wms_source" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a WMS service from which to fetch data" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-feature_name"><span class="label label-danger">Feature</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-feature_name" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a dataset served by above WMS" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +  
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-style_name"><span class="label label-danger">Style</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-style_name" ' +
                    'data-toggle="tooltip" data-placement="left" title="Choose a style to be used with the feature" required="required">' +
                '</select>' +
            '</div>' +
        '</div>'
    );          
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.sourceSpecified = function() {
    return(this.dropdowns.wms_source.val() != "" && this.dropdowns.feature_name.val() != "");
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.validate = function() {
    var ok = this.sourceSpecified();
    if (!this.dropdowns.wms_source.val()) {
        magic.modules.Common.flagInputError(this.dropdowns.wms_source);
    }
    if (!this.dropdowns.wms_source.val()) {
        magic.modules.Common.flagInputError(this.dropdowns.feature_name);
    }    
    return(ok);
};

/**
 * Initialise the menus
 * @param {Object} data with fields wms_source, feature_name, style_name
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.init = function(data) {
        
    this.dropdowns.wms_source = jQuery("#" + this.id + "-wms_source");
    this.dropdowns.feature_name = jQuery("#" + this.id + "-feature_name");
    this.dropdowns.style_name = jQuery("#" + this.id + "-style_name"); 
    
    /* Need to apply URL aliases here - fix David 2018-10-11 */
    var wmsSource = data.wms_source;
    var equivalentEndpoint = magic.modules.Endpoints.getEndpointsBy("url", wmsSource);
    if (jQuery.isArray(equivalentEndpoint) && equivalentEndpoint[0].url) {
        wmsSource = equivalentEndpoint[0].url;
    }
        
    /* Populate the WMS endpoint dropdown with all those endpoints valid for this projection */
    magic.modules.Common.populateSelect(
        this.dropdowns.wms_source, 
        magic.modules.Endpoints.getEndpointsBy("srs", this.projection), 
        "url", "name", wmsSource, true
    );    
    if (data.feature_name) {
        this.loadFeaturesFromService(wmsSource, data.feature_name, data.style_name);
    }
    
    /* Assign handler for endpoint selection */    
    this.dropdowns.wms_source.off("change").on("change", jQuery.proxy(function() {    
        var wms = this.dropdowns.wms_source.val();
        if (!wms || wms == "osm") {
            /* No WMS selection, or OpenStreetMap */
            this.dropdowns.feature_name.prop("disabled", true).empty();
            this.dropdowns.style_name.prop("disabled", true).empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.feature_name.prop("disabled", false);
            this.loadFeaturesFromService(wms, "", "");
            this.dropdowns.style_name.prop("disabled", true).empty();
        }        
    }, this));
    
    /* Assign handler for feature selection */
    this.dropdowns.feature_name.off("change").on("change", jQuery.proxy(function() {  
        var wms = this.dropdowns.wms_source.val();
        var fname = this.dropdowns.feature_name.val();
        if (!fname) {
            /* No feature selection */
            this.dropdowns.style_name.prop("disabled", true).empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.style_name.prop("disabled", false);
            this.loadStylesForFeature(wms, fname, "");
        }        
    }, this));
        
};

/**
 * Load WMS features from a service endpoint whose URL is given
 * @param {String} serviceUrl
 * @param {Object} selectedFeat
 * @param {String} selectedStyle
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadFeaturesFromService = function(serviceUrl, selectedFeat, selectedStyle) {
    
    if (serviceUrl != "osm") {
        
        selectedStyle = selectedStyle || "";    
        this.dropdowns.feature_name.prop("disabled", false);

        /* Strip namespace if present - removed 2018-02-16 David - caused confusion as things failed through lack of the <namespace>: at the beginning */
        //var selectedFeatNoNs = selectedFeat.split(":").pop();

        /* Examine GetCapabilities list of features */
        var fopts = magic.runtime.creator.catalogues[serviceUrl];    
        if (fopts && fopts.length > 0) {
            /* Have previously read the GetCapabilities document - read stored feature data into select list */
            magic.modules.Common.populateSelect(this.dropdowns.feature_name, fopts, "value", "name", selectedFeat, true);
            this.loadStylesForFeature(serviceUrl, selectedFeat, selectedStyle);
        } else {
            /* Read available layer data from the service GetCapabilities document */
            jQuery.get(magic.modules.Common.getWxsRequestUrl(serviceUrl, "GetCapabilities"), jQuery.proxy(function(response) {
                try {
                    var capsJson = jQuery.parseJSON(JSON.stringify(new ol.format.WMSCapabilities().read(response)));
                    if (capsJson) {
                        magic.runtime.creator.catalogues[serviceUrl] = this.extractFeatureTypes(capsJson);
                        magic.modules.Common.populateSelect(this.dropdowns.feature_name, magic.runtime.creator.catalogues[serviceUrl], "value", "name", selectedFeat, true);
                        this.loadStylesForFeature(serviceUrl, selectedFeat, selectedStyle);
                    } else {
                        magic.modules.Common.showAlertModal("Failed to parse capabilities for WMS " + serviceUrl, "error");                       
                        this.dropdowns.feature_name.prop("disabled", true).empty();
                        this.dropdowns.style_name.prop("disabled", true).empty();
                    }
                } catch(e) {
                    magic.modules.Common.showAlertModal("Failed to parse capabilities for WMS " + serviceUrl, "error");                   
                    this.dropdowns.feature_name.prop("disabled", true).empty();
                    this.dropdowns.style_name.prop("disabled", true).empty();
                }
            }, this)).fail(jQuery.proxy(function() {                
                magic.modules.Common.showAlertModal("Failed to read capabilities for WMS " + serviceUrl, "error");                 
                this.dropdowns.feature_name.prop("disabled", true).empty();
                this.dropdowns.style_name.prop("disabled", true).empty();
            }, this));
        }
    }
};

/**
 * Populate list with the available styles for this feature
 * @param {String} serviceUrl 
 * @param {String} featName
 * @param {Object} selectedStyle
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadStylesForFeature = function(serviceUrl, featName, selectedStyle) {    
    if (featName && jQuery.isArray(magic.runtime.creator.catalogues[serviceUrl])) {
        jQuery.each(magic.runtime.creator.catalogues[serviceUrl], jQuery.proxy(function(idx, lyr) {
            var fnNoWs = featName.toLowerCase().split(":").pop();
            var lvNoWs = lyr.value.toLowerCase().split(":").pop();
            if (lvNoWs == fnNoWs) {
                if (jQuery.isArray(lyr.styles) && lyr.styles.length > 1) {
                    /* There's a choice here */
                    magic.modules.Common.populateSelect(this.dropdowns.style_name, lyr.styles, "Name", "Title", selectedStyle, false);
                } else {
                    magic.modules.Common.populateSelect(this.dropdowns.style_name, [{Name: "", Title: "Default style"}], "Name", "Title", "", false);                    
                }
                return(false);
            }
            return(true);
        }, this));        
    } else {
        magic.modules.Common.populateSelect(this.dropdowns.style_name, [{Name: "", Title: "Default style"}], "Name", "Title", "", false); 
    }
};

/**
 * Extract feature types from GetCapabilities response
 * @param {object} getCaps
 * @returns {Array}
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.extractFeatureTypes = function(getCaps) {
    var ftypes = [];
    if ("Capability" in getCaps && "Layer" in getCaps.Capability && "Layer" in getCaps.Capability.Layer && jQuery.isArray(getCaps.Capability.Layer.Layer)) {
        var layers = getCaps.Capability.Layer.Layer;
        this.getFeatures(ftypes, layers);        
    } else {
        magic.modules.Common.showAlertModal("Malformed GetCapabilities response received from remote WMS", "error");
    }
    return(ftypes);
};

/**
 * Recursive trawl through the GetCapabilities document for named layers
 * @param {Array} ftypes
 * @param {Array} layers
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.getFeatures = function(ftypes, layers) {
    jQuery.each(layers, jQuery.proxy(function(idx, layer) {
        if ("Name" in layer) {
            /* Leaf node - a named layer */
            ftypes.push({
                name: layer.Title,
                value: layer.Name,
                styles: layer.Style
            });
        } else if ("Layer" in layer && jQuery.isArray(layer["Layer"])) {
            /* More trawling to do */
            this.getFeatures(ftypes, layer["Layer"]);
        }        
    }, this));
};

/* Map Creator map region selection dialog */

magic.classes.creator.MapRegionSelector = function(options) {
    
    /* Unpack API options */
    
    /* Callback for loading a map context into the wider application */
    this.loadContextCb = options.contextLoader || null;
    
    /* ID prefix */
    this.prefix = options.prefix || "region-select";
    
    /* Population service for map selector (takes an action REST arg - new|clone|edit */
    this.mapTitleService = options.mapTitleService || magic.config.paths.baseurl + "/maps/dropdown";
    
    /* Population service for full map data (takes a map name REST arg) */
    this.mapDataService = options.mapDataService || magic.config.paths.baseurl + "/maps/name";   
      
    /* Internal */
    this.currentMapId = "";
    
    /* Creator method radio button change handler */
    jQuery("input[name$='action-rb']").click(jQuery.proxy(function (evt) {
        var rb = jQuery(evt.currentTarget);
        jQuery.each(["new", "edit", "clone"], jQuery.proxy(function (idx, action) {
            if (action == rb.val()) {
                /* Checked one */
                var select = jQuery("#" + this.prefix + "-" + action);
                select.prop("disabled", false);                        
                var mapName = "";
                if (action == "edit") {
                    var search = window.location.search;
                    if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                        /* Named map in the location search string */
                        mapName = search.substring(6);
                    }
                } 
                if (action == "edit" || action == "clone") {
                    /* Service returns [{name: <name>, title: <title>},...] */
                    select.find("option").remove();
                    jQuery.getJSON(this.mapTitleService + "/" + action, jQuery.proxy(function (data) {                        
                        magic.modules.Common.populateSelect(select, data, "name", "title", mapName, true); 
                        magic.modules.Common.resetFormIndicators();
                        if (mapName && action == "edit") {
                            /* Check any map name entered in the URL is in fact one this user can work with */
                            var alloweds = jQuery.grep(data, function(elt) {
                                return(elt.name == mapName);
                            });
                            if (alloweds.length > 0) {
                                this.loadContext(action, mapName);
                            } else {
                                magic.modules.Common.showAlertModal("You are not allowed to edit the map " + mapName, "error");                                
                            }
                        }
                    }, this)).fail(function(xhr, status, message) {
                        magic.modules.Common.showAlertModal("Failed to get map titles - error was : " + message, "error");                        
                    });
                }                  
            } else {
                /* Has been unchecked */
                jQuery("#" + this.prefix + "-" + action).prop("disabled", true);
            }
        }, this));
    }, this));
    
    /* Load a map definition depending on the selection */
    jQuery("select.map-select").change(jQuery.proxy(function (evt) {
        var sel = jQuery(evt.currentTarget);
        var action = sel.attr("id").split("-").pop();
        var mapName = sel.val();
        magic.modules.Common.resetFormIndicators();
        this.loadContext(action, mapName);                
    }, this)); 

    /* If there is a search string, assume a map edit */
    var search = window.location.search;
    if (search && search.match(/\?name=[a-z0-9_]+$/)) {
        jQuery("#" + this.prefix + "-edit-rb").trigger("click");                
    }
        
};

/**
 * Load a map context from the appropriate service
 * @param {string} action (new|edit|clone)
 * @param {string} name
 * @param {Function} callback
 */
magic.classes.creator.MapRegionSelector.prototype.loadContext = function(action, name) {
    if (action == "new") {
        /* New blank map context */
        this.currentMapId = "";
        this.loadContextCb(null, jQuery("#" + this.prefix + "-new").val());
    } else if (name) {
        /* Clone or edit implies a fetch of map with id */
        jQuery.getJSON(this.mapDataService + "/" + name, jQuery.proxy(function (data) {          
            if (action == "clone") {
                data.name += "_copy";
            }
            this.currentMapId = action == "edit" ? data.id : "";
            this.loadContextCb(data, null);
        }, this)).fail(function(xhr, status, message) {
            magic.modules.Common.showAlertModal("Failed to get map data for " + name + " - details : " + message, "error");            
        });
    }    
};

magic.classes.creator.MapRegionSelector.prototype.validate = function(action, name) {
    /* Make sure a map source selection has been made */
    var checkRb = jQuery("input[type='radio'][name='_" + this.prefix + "-action-rb']:checked");
    if (!checkRb) {
        return(false);
    }
    var selector = jQuery("#" + this.prefix + "-" + checkRb.val());
    if (selector.length == 0 || (selector.length > 0 && selector.val() == "")) {
        return(false);
    }
    return(true);
};

/* Embedded Map Creator map metadata form class */

magic.classes.creator.MapMetadataForm = function(options) {
    
    /* Unpack API properties from options */
 
    /* Form schema */
    this.formSchema = options.formSchema;
    
    /* ID prefix */
    this.prefix = options.prefix || "map-metadata";
    
};

/**
 * Default form values
 * @param {String} region (not currently used)
 * @return {Object}
 */
magic.classes.creator.MapMetadataForm.prototype.defaultData = function(region) {
    var defaultData = {};
    jQuery.each(this.formSchema, jQuery.proxy(function(idx, elt) {
        defaultData[elt["field"]] = elt["default"];
    }, this));
    return(defaultData);
};

/**
 * Populate the metadata form according to the given data
 * @param {Object} data
 */
magic.classes.creator.MapMetadataForm.prototype.loadContext = function(data) {
    jQuery("#" + this.prefix + "-form").closest("div.row").removeClass("hidden");
    magic.modules.Common.jsonToForm(this.formSchema, data, this.prefix);    
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapMetadataForm.prototype.getContext = function() {
    jQuery("#" + this.prefix + "-form").closest("div.row").removeClass("hidden");
    return(magic.modules.Common.formToJson(this.formSchema, this.prefix));    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapMetadataForm.prototype.validate = function() {               
    var ok = true;
    jQuery.each(this.formSchema, jQuery.proxy(function(idx, attr) {
        var jqFld = jQuery("#" + this.prefix + "-" + attr.field);
        var fg = jqFld.closest("div.form-group");
        if (jqFld[0].checkValidity() === false) {                    
            fg.addClass("has-error");
            ok = false;
        } else {
            fg.removeClass("has-error");
        }
    }, this));            
    return(ok);
};
/* Embedded Map Creator map layer selector class */

magic.classes.creator.MapLayerSelector = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "layer-selector";
   
    /* Internal properties */
    this.layerDataEditor = null;        
    
    /* Repository (keyed by layer id) of saved edits to data layers */
    this.layerEdits = {};
};

/**
 * Default layer specifications for given region
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 * @return {Object}
 */
magic.classes.creator.MapLayerSelector.prototype.defaultData = function(region) {
    return({
        layers: {
            "type": "json",
            "value": JSON.stringify(magic.modules.GeoUtils.defaultEmbeddedLayers(region))
        }
    });
};

/**
 * Populate the layer table according to the given data
 * @param {Object} data
 */
magic.classes.creator.MapLayerSelector.prototype.loadContext = function(data) {
    jQuery("#map-layer-selector").closest("div.row").removeClass("hidden");
    var layers = null;
    var table = jQuery("#" + this.prefix + "-list");
    if (data.layers && data.layers.type == "json" && data.layers.value) {
        layers = JSON.parse(data.layers.value);
    }
    var rows = table.find("tbody tr");
    if (rows.length > 0) {
        rows.remove();
    }
    if (layers && layers.length > 0) {                    
        table.removeClass("hidden");                    
        for (var i = 0; i < layers.length; i++) {            
            this.layerMarkup(table, layers[i]);
        }
        /* Enable sortable layers table */
        sortable(".table-sortable tbody", {
            handle: "td.layerdata-name",
            placeholderClass: "fa fa-caret-right"
        });
    } else {
        table.addClass("hidden");
    }
    
    /* Assign add layer button handler */
    jQuery("#" + this.prefix + "-layer-add").off("click").on("click", jQuery.proxy(function(evt) {     
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate({});
    }, this));
};

/**
 * Retrieve the current context
 * @param {boolean} embedded
 * @return {Object}
 */
magic.classes.creator.MapLayerSelector.prototype.getContext = function(embedded) {
    if (embedded) {
        var layers = jQuery("#" + this.prefix + "-list").find("tr").map(jQuery.proxy(function(idx, tr) {
            return(this.layerEdits[jQuery(tr).data("id")]);
        }, this));
        //console.log(layers);
        return({           
           layers: layers.get() 
        });
    }
    return({});
};

magic.classes.creator.MapLayerSelector.prototype.validate = function() {
    return(true);
};

/**
 * Append data for a map layer to the given table
 * @param {jQuery.object} table
 * @param {object} layerData
 */
magic.classes.creator.MapLayerSelector.prototype.layerMarkup = function(table, layerData) {
    var service = magic.modules.Endpoints.getEndpointBy("url", layerData.wms_source);
    var serviceName = service ? service.name : layerData.wms_source;    
    layerData.id = layerData.id || magic.modules.Common.uuid(); 
    this.layerEdits[layerData.id] = layerData;
    table.find("tbody").append( 
        '<tr data-id="' + layerData.id + '">' +             
            '<td class="layerdata-name">' + 
                '<a style="margin-right:5px" href="Javascript:void(0)" data-toggle="tooltip" data-placement="top" title="Click and drag to re-order layer stack">' + 
                    '<span class="fa fa-arrows"></span>' + 
                '</a>' + 
                layerData.name + 
            '</td>' + 
            '<td>' + serviceName + '</td>' +                     
            '<td>' + 
                '<div class="btn-toolbar" role="toolbar">' + 
                    '<div class="btn-group" role="group">' + 
                        '<button type="button" class="btn btn-sm btn-warning" id="' + this.prefix + '-' + layerData.id + '-layer-edit" ' + 
                            'data-toggle="popover" data-trigger="manual" data-placement="left">' + 
                            '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit/view selected layer data" class="fa fa-pencil"></i>' + 
                        '</button>' +
                        '<button type="button" class="btn btn-sm btn-danger" id="' + this.prefix + '-' + layerData.id + '-layer-del">' +
                            '<i data-toggle="tooltip" data-placement="top" title="Delete selected layer" class="fa fa-trash"></i>' + 
                        '</button>' + 
                    '</div>' + 
                '</div>' + 
            '</td>' + 
        '</tr>'
    );
    
    /* Assign edit layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-edit").off("click").on("click", jQuery.proxy(function(evt) {
        var layerId = evt.currentTarget.id.replace(this.prefix + "-", "").replace("-layer-edit", "");
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate(this.layerEdits[layerId]);
    }, this));
    
    /* Assign delete layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-del").off("click").on("click", jQuery.proxy(function(evt) {
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Ok to remove this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                delete this.layerEdits[layerData.id];
                jQuery(evt.currentTarget).closest("tr").remove();
            }
            bootbox.hideAll();
        }, this));                       
    }, this));
};

/**
 * Update the stored and displayed layer data after an edit
 * @param {Object} layerData
 */
magic.classes.creator.MapLayerSelector.prototype.updateLayerData = function(layerData) {
    if (!layerData.id) {
        /* New data added */
        layerData.id = magic.modules.Common.uuid();
        var table = jQuery("#" + this.prefix + "-list");
        this.layerMarkup(table, layerData);
    }
    this.layerEdits[layerData.id] = layerData;
    /* Enable sortable layers table - now includes the new layer */
    sortable(".table-sortable tbody", {
        handle: "td.layerdata-name",
        placeholderClass: "fa fa-caret-right"
    });
};
/* Map Creator map parameter selection class */

magic.classes.creator.MapParameterSelector = function(options) {
    
    /* Unpack API properties from options */
  
    /* ID prefix */
    this.prefix = options.prefix || "map-parameters";
    
    /* Embedded map context */
    this.embedded = options.embedded;
    
    /* Internal properties */
    this.map = null;   
        
};

/**
 * Default map parameters
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 * @return {Object}
 */
magic.classes.creator.MapParameterSelector.prototype.defaultData = function(region) {
    var defaults = magic.modules.GeoUtils.DEFAULT_MAP_PARAMS[region];
    return(this.embedded ? defaults : {
        data: defaults
    });
};

/**
 * Populate the map-based parameter select according the given data
 * @param {Object} context
 */
magic.classes.creator.MapParameterSelector.prototype.loadContext = function(context) {     
    jQuery("#" + this.prefix + "-selector").closest("div.row").removeClass("hidden");    
    if (!context) {
        magic.modules.Common.showAlertModal("No default map parameters supplied", "error");
        return;
    }
    this.renderMap(this.embedded ? context : context.data);
};

magic.classes.creator.MapParameterSelector.prototype.showContext = function() {
    this.map && this.map.updateSize();
};

/**
 * Actually render the map
 * @param {Object} data
 */
magic.classes.creator.MapParameterSelector.prototype.renderMap = function(data) {
    var resetMap = false;
    if (this.map) {
        /* See if projection has changed => must recreate map */
        var newProj = data.projection;
        var oldProj = this.map.getView().getProjection().getCode();
        resetMap = (newProj != oldProj);
    }            
    if (resetMap || !this.map) {
        this.map = null;
        jQuery("#" + this.prefix + "-selector-map").children().remove();
        var proj = ol.proj.get(data.projection);                               
        var view = null;
        /* Sort out the rotation (saved in degrees - OL needs radians) */
        var rotation = parseFloat(data.rotation);
        if (isNaN(rotation)) {
            rotation = 0.0;
        } else {
            rotation = Math.PI*rotation/180.0;
        }
        /* Values that may be JSON or string depending on where they came from */
        if (typeof data.center === "string") {
            data.center = JSON.parse(data.center);
        }
        if (typeof data.proj_extent === "string") {
            data.proj_extent = JSON.parse(data.proj_extent);
        }
        if (typeof data.resolutions === "string") {
            data.resolutions = JSON.parse(data.resolutions);
        }
        jQuery("#" + this.prefix + "-rotation").val(data.rotation);
        var layers = [];
        var projEp;
        var projEps = magic.modules.Endpoints.getEndpointsBy("srs", data.projection);
        for (var i = 0; i < projEps.length; i++) {
            if (projEps[i].coast_layers) {
                projEp = projEps[i];
                break;
            }
        }
        if (!projEp) {
            magic.modules.Common.showAlertModal("No endpoint service defined for projection " + data.projection, "error");             
            return;
        }
        if (projEp.url == "osm") {
            /* OpenStreetMap is used for mid-latitude maps */
            layers.push(magic.modules.Endpoints.getMidLatitudeCoastLayer());
            view = new ol.View({                        
                center: data.center,
                minZoom: 1,
                maxZoom: 20,
                rotation: rotation,
                zoom: parseInt(data.zoom),
                projection: proj
            });
        } else {
            /* Other WMS */
            proj.setExtent(data.proj_extent);   /* Don't do this for OSM - bizarre ~15km shifts happen! */
            proj.setWorldExtent(data.proj_extent);
            var coasts = projEp.coast_layers.split(",");                    
            jQuery.each(coasts, function(idx, cl) {
                var wmsSource = new ol.source.TileWMS({
                    url: projEp.url,
                    params: {
                        "LAYERS": cl, 
                        "CRS": proj.getCode(),
                        "SRS": proj.getCode(),
                        "VERSION": "1.3.0",
                        "TILED": true
                    },
                    tileGrid: new ol.tilegrid.TileGrid({
                        resolutions: data.resolutions,
                        origin: proj.getExtent().slice(0, 2)
                    }),
                    projection: proj
                });
                layers.push(new ol.layer.Tile({
                    visible: true,
                    opacity: 1.0,
                    source: wmsSource
                }));
            });
            var controls = [
                new ol.control.ZoomSlider(),
                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
                new ol.control.MousePosition({
                    projection: "EPSG:4326",
                    className: "custom-mouse-position",
                    coordinateFormat: function (xy) {
                        return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                    }
                })
            ];
            var olGrat = null;
            var graticule = projEp.graticule_layer;
            if (graticule) {                        
                /* Use prepared data for Polar Stereographic as OL control does not work */
                var wmsSource = new ol.source.ImageWMS(({
                    url: projEp.url,
                    params: {"LAYERS": graticule},
                    projection: proj
                }));
                layers.push(new ol.layer.Image({
                    visible: true,
                    opacity: 1.0,
                    source: wmsSource
                }));
            }
            view = new ol.View({
                center: data.center,
                maxResolution: data.resolutions[0],
                resolutions: data.resolutions,
                rotation: rotation,
                zoom: parseInt(data.zoom),
                projection: proj
            });
        }

        this.map = new ol.Map({
            renderer: "canvas",
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
            layers: layers,
            controls: controls,
            interactions: ol.interaction.defaults(),
            view: view,
            target: this.prefix + "-selector-map"
        });
        if (olGrat != null) {
            olGrat.setMap(this.map);
        }        
    }
    
    /* Set rotation button handler */
    jQuery("#" + this.prefix + "-rotation-set").off("click").on("click", jQuery.proxy(function(evt) {
        var rotationDeg = jQuery("#" + this.prefix + "-rotation").val();
        if (!isNaN(rotationDeg) && this.map) {
            var rotationRad = Math.PI*rotationDeg/180.0;
            this.map.getView().setRotation(rotationRad);
        }
    }, this));
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapParameterSelector.prototype.getContext = function() {    
    var mapView = this.map.getView();
    var rotation = parseFloat(jQuery("#" + this.prefix + "-rotation").val());
    var context = {
        center: mapView.getCenter(),
        zoom: parseInt(mapView.getZoom()),
        projection: mapView.getProjection().getCode(),
        proj_extent: mapView.getProjection().getExtent(),
        resolutions: mapView.getResolutions(),
        rotation: isNaN(rotation) ? 0.0 : rotation
    };
    return(this.embedded ? context : {
        data: context
    });
};

magic.classes.creator.MapParameterSelector.prototype.validate = function() {    
    return(true);
};

/* Embedded Map Creator main class */

magic.classes.creator.EmbeddedAppContainer = function() {
    
    /* Initialise the various form dialogs */
    this.dialogs = {        
        "metadataForm": new magic.classes.creator.MapMetadataForm({
            formSchema: [
                {"field": "id", "default": ""},
                {"field": "name","default": "new_map"},
                {"field": "title", "default": ""},
                {"field": "description", "default": ""},            
                {"field": "owner_email", "default": ""},                
                {"field": "allowed_usage", "default": "public"},
                {"field": "allowed_edit", "default": "login"}
            ]
        }),
        "mapLayerSelector": new magic.classes.creator.MapLayerSelector({}),
        "mapParameterSelector": new magic.classes.creator.MapParameterSelector({embedded: true})
    };
    
    /* Master region selector (may load a map context here if a search string exists) */
    this.regionSelector = new magic.classes.creator.MapRegionSelector({
        "contextLoader": jQuery.proxy(this.loadContext, this),
        "mapTitleService": magic.config.paths.baseurl + "/embedded_maps/dropdown",
        "mapDataService": magic.config.paths.baseurl + "/embedded_maps/name"
    });
    
    /* Tooltips */                    
    jQuery('[data-toggle="tooltip"]').tooltip({trigger: "hover"});
    /* For dynamic tooltips - http://stackoverflow.com/questions/9958825/how-do-i-bind-twitter-bootstrap-tooltips-to-dynamically-created-elements */
    jQuery("body").tooltip({selector: '[data-toggle="tooltip"]', trigger: "hover"});
                      
};

/**
 * Callback to load a map context 
 * @param {Object} mapContext
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes, required if mapContext not set
 */
magic.classes.creator.EmbeddedAppContainer.prototype.loadContext = function(mapContext, region) { 
    
    if (!mapContext) {
        /* Assumed this is a new map, so create default parameter data */
        if (region) {
            /* Assemble default map context */
            mapContext = {};
            jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
                mapContext = jQuery.extend(true, mapContext, dialog.defaultData(region));
            }, this));
        } else {
            magic.modules.Common.showAlertModal("No map context or region data supplied - aborting", "error");
            return;
        }
    }
    
    /* Record global projection */
    magic.runtime.projection = mapContext.projection;
    
    /* Load the context */
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        dialog.loadContext(mapContext);
    }, this));
    
    /* Save map handler */
    var saveBtn = jQuery("#map-save-context");
    saveBtn.closest("div.row").removeClass("hidden");
    saveBtn.off("click").on("click", jQuery.proxy(this.saveContext, this));
    
    /* Delete map handler */
    var delBtn = jQuery("#map-delete");   
    delBtn.off("click").on("click", jQuery.proxy(function() {
        this.deleteMap(mapContext.id);
    }, this));
};

/**
 * Assemble a final map context for saving to database
 */
magic.classes.creator.EmbeddedAppContainer.prototype.saveContext = function() {
    var valid = true;
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        valid = valid && dialog.validate();
    }, this));
    if (valid) {
        /* Forms were valid */
        var context = {};
        jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
            jQuery.extend(true, context, dialog.getContext(true));
        }, this));                
        this.modifyMapExtentByDataLayers(context, jQuery.proxy(function(postData) {
            /* Now validate the assembled map context against the JSON schema in /static/js/json/embedded_web_map_schema.json
             * https://github.com/geraintluff/tv4 is the validator used */            
            jQuery.getJSON("https://cdn.web.bas.ac.uk/magic/json-schemas/embedded_web_map_schema.json", jQuery.proxy(function(schema) {        
                var validated = tv4.validate(postData, schema);               
                if (!validated) {
                    /* Failed to validate the data against the schema - complain */
                    var validationErrors = JSON.stringify(tv4.error, null, 4);
                    magic.modules.Common.showAlertModal(
                        "Failed to validate your map data against the web map schema<br/><br/>" + 
                        "Detailed explanation of the failure below:<br/><br/>" +  
                         validationErrors, "error"
                    );
                } else {
                    /* Schema validation was ok */
                    var existingId = postData.id; 
                    //console.log(postData);
                    var postDataStr = JSON.stringify(postData);
                    jQuery.ajax({
                        url: magic.config.paths.baseurl + "/embedded_maps/" + (existingId != "" ? "update/" + existingId : "save"),                        
                        method: "POST",
                        processData: false,
                        data: postDataStr,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader(
                                jQuery("meta[name='_csrf_header']").attr("content"), 
                                jQuery("meta[name='_csrf']").attr("content")
                            );
                        }
                    })
                    .done(function(response) {
                        /* Load up example finished map into test bed in a new tab */
                        magic.runtime.serviceUrl = magic.config.paths.baseurl + "/embedded_maps/name/" + postData.name;
                        window.open(magic.config.paths.baseurl + "/static/html/test_embed.html");                    
                    })
                    .fail(function(xhr) {
                        var msg;
                        try {
                            msg = JSON.parse(xhr.responseText)["detail"];
                        } catch(e) {
                            msg = xhr.responseText;
                        }
                        magic.modules.Common.showAlertModal("Failed to save your map - details : " + msg, "warning");                        
                    });
                }
            }, this))
            .fail(function(xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                magic.modules.Common.showAlertModal("Failed to retrieve JSON schema for embedded map - details : " + msg, "warning");                
            });  
        }, this));        
    } else {
        /* Validation errors */
        magic.modules.Common.showAlertModal("Please correct the marked fields before resubmitting", "warning");        
    }
};

/** 
 * Check if any data layers had the 'is_extent' attribute set, find their combined extent and modify the map extent accordingly
 * @param {Object} context
 * @param {Function} callback
 */
magic.classes.creator.EmbeddedAppContainer.prototype.modifyMapExtentByDataLayers = function(context, callback) {
    var extents = [];
    var extentRequests = [];
    jQuery.each(context.layers, jQuery.proxy(function(idx, elt) {
        if (elt.is_extent === true && elt.feature_name) {
            var restExtent = magic.config.paths.baseurl + "/gs/extent/" + elt.feature_name;
            var restEndpoint = magic.modules.Endpoints.getEndpointBy("url", elt.wms_source);
            if (restEndpoint != null) {
                restExtent = restExtent + "/" + restEndpoint.id;
            }
            extentRequests.push(jQuery.getJSON(restExtent, 
                jQuery.proxy(function(data) {                   
                    if (jQuery.isArray(data) && data.length == 4) {
                        extents.push(magic.modules.GeoUtils.extentFromWgs84Extent(data, context.projection));
                    }
                }, this))
            );
        }
    }, this));
    if (extentRequests.length > 0) {
        jQuery.when.apply(jQuery, extentRequests)
        .always(jQuery.proxy(function() {
            /* Postprocess to set map centre and zoom level in the event that these must be taken from data layers */
            jQuery.extend(true, context, {
                "data_extent": magic.modules.GeoUtils.uniteExtents(extents)
            });
            if (jQuery.isFunction(callback)) {
                callback(context);
            }
        }, this))
        .fail(function(xhr) {
            var msg;
            try {
                msg = JSON.parse(xhr.responseText)["detail"];
            } catch(e) {
                msg = xhr.responseText;
            }
            magic.modules.Common.showAlertModal("Failed to calculate embedded map extent from data layers - details : " + msg, "warning");            
        });
    } else {
        if (jQuery.isFunction(callback)) {
            delete context.data_extent;
            callback(context);
        }
    }  
};

/**
 * Delete an embedded map
 * @param {String} id
 */
magic.classes.creator.EmbeddedAppContainer.prototype.deleteMap = function(id) {
    bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this map?</div>', jQuery.proxy(function(result) {
        if (result) {
            /* Do the deletion */
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/embedded_maps/delete/" + id,
                method: "DELETE",
                beforeSend: function (xhr) {                        
                    xhr.setRequestHeader(
                        jQuery("meta[name='_csrf_header']").attr("content"), 
                        jQuery("meta[name='_csrf']").attr("content")
                    );
                }
            })
            .done(function() {
                window.location = magic.config.paths.baseurl + "/embedded_creatord";
            })
            .fail(function (xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                magic.modules.Common.showAlertModal("Failed to delete user map view - details : " + msg, "warning");                
            });                   
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }                            
    }, this));  
};