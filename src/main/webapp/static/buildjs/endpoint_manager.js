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
    },
    
    /* Instantiable classes */
    classes: {
        endpoint_manager: {}
    },
    
    /* Runtime objects */
    runtime: {        
        pingSession: function() {
            jQuery.get(magic.config.paths.baseurl + "/ping");
        }
    }
    
};

/* Activate session keepalive by application request every 50 mins */
setInterval("magic.runtime.pingSession()", 50*60*1000);


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
            if (!value) {
                return("");
            }
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
/* Prototype custom form input class */

magic.classes.CustomFormInput = function(options) {

    this.id = options.id;
    this.tipText = options.tipText;
    this.tipPosition = options.tipPosition;
    this.defaultValue = options.defaultValue;
	this.required = options.required;
    
    this.element = jQuery("#" + this.id);

};

magic.classes.CustomFormInput.prototype.getElement = function() {
    return(this.element);
};

/* Custom input based on Bootstrap tagsinput class */

magic.classes.TagsInput = function(options) {

    options = jQuery.extend({}, {
        tipText: "",
        tipPosition: "left",
        required: false,
        defaultValue: "",
        tagValidator: function(value) {
            return(true);
        }
    }, options);
    
    magic.classes.CustomFormInput.call(this, options);
    
    this.tagValidator = options.tagValidator;
    
    this.tipText = this.tipText || this.element.data("original-title");
        
    if (this.element.length > 0) {
        this.element.tagsinput({
            trimValue: true,
            allowDuplicates: false,
            cancelConfirmKeysOnEmpty: false
        });        
        if (this.tipText) {
            /* Locate the input added by the tagsInput plugin to attach tooltip */
            var btInput = this.element.closest("div").find(".bootstrap-tagsinput :input");
            if (btInput) {
                btInput.attr("data-toggle", "tooltip");
                btInput.attr("data-placement", this.tipPosition);
                btInput.attr("title", this.tipText);
            }
        }
    }
    
    this.setValue(this.defaultValue);

};

magic.classes.TagsInput.prototype = Object.create(magic.classes.CustomFormInput.prototype);
magic.classes.TagsInput.prototype.constructor = magic.classes.TagsInput;

/**
 * Reset the input
 */
magic.classes.TagsInput.prototype.reset = function() {
    this.element.tagsinput("removeAll");
};

/**
 * Set tags input to the given input value (supplied as a comma-separated string or an array)
 * @param {String|Array} value
 */
magic.classes.TagsInput.prototype.setValue = function(value) {
    if (!value) {
        this.reset();
    } else {
        if (!jQuery.isArray(value)) {
            value = value.split(",");
        }
        if (value.length > 0) {
            jQuery.each(value, jQuery.proxy(function(idx, v) {
                this.element.tagsinput("add", v);
            }, this));
        }
    }
};

/**
 * Retrieve the set value as a comma-separated string or array
 * @param {boolean} requireArray
 * @return {String|Array}
 */
magic.classes.TagsInput.prototype.getValue = function(requireArray) {
    if (requireArray === true) {
        return(this.element.tagsinput("items"));
    } else {
        return(this.element.val());
    }
};

/**
 * Validate the input
 * @return {boolean}
 */
magic.classes.TagsInput.prototype.validate = function() {
    var valid = this.required ? this.getValue(false) != "" : true;
    var outerDiv = this.element.closest("div.form-group");
    if (valid) {
        var tagArr = this.getValue(true);
        if (tagArr.length > 0) {
            var validArr = jQuery.grep(tagArr, jQuery.proxy(function(tag) {
                return(this.tagValidator(tag));
            }, this));
            valid = validArr.length == tagArr.length;
        }        
    }
    if (valid) {
        outerDiv.removeClass("has-error");
    } else {
        outerDiv.addClass("has-error");
    }
    return(valid);
};
/* Custom input based on Bootstrap multiple select class */

magic.classes.MultiSelectInput = function(options) {

    options = jQuery.extend({}, {
        tipText: "",
        tipPosition: "left",
        required: false,
        defaultValue: ""
    }, options);
    
    magic.classes.CustomFormInput.call(this, options);
    
    /* Capture tooltip specification from original element */
    this.tipText = this.tipText || this.element.data("original-title");
            
    this.element.attr("multiple", "multiple");
    this.element.addClass("selectpicker");
    this.element.selectpicker({
        iconBase: "fa",
        tickIcon: "fa-check"
    });
    
    this.element.closest("div.bootstrap-select").tooltip({
        title: this.tipText,
        placement: this.tipPosition,
        container: "body"
    });
    
    if (this.defaultValue == "") {
        this.reset();
    } else {
        this.setValue(this.defaultValue);
    }

};

magic.classes.MultiSelectInput.prototype = Object.create(magic.classes.CustomFormInput.prototype);
magic.classes.MultiSelectInput.prototype.constructor = magic.classes.MultiSelectInput;

/**
 * Reset the input
 */
magic.classes.MultiSelectInput.prototype.reset = function() {
    this.element.selectpicker("deselectAll");
};

/**
 * Set tags input to the given input value (supplied as a comma-separated string or an array)
 * @param {String|Array} value
 */
magic.classes.MultiSelectInput.prototype.setValue = function(value) {
    if (!value) {
        this.reset();
    } else {
        if (!jQuery.isArray(value)) {
            value = value.split(",");
        }
        if (value.length > 0) {
            this.element.selectpicker("val", value);
        }
    }
};

/**
 * Retrieve the set value as a comma-separated string or array
 * @param {boolean} requireArray
 * @return {String|Array}
 */
magic.classes.MultiSelectInput.prototype.getValue = function(requireArray) {
    if (requireArray) {
        return(this.element.val());
    } else {
        return(this.element.val().join(","));
    }
};

/**
 * Validate the input
 * @return {boolean}
 */
magic.classes.MultiSelectInput.prototype.validate = function() {
    var outerDiv = this.element.closest("div.form-group");
    var valid = this.required ? this.getValue(false) != "" : true;
    if (!valid) {
        outerDiv.addClass("has-error");
    } else {
        outerDiv.removeClass("has-error");
    }
    return(valid);
};


/* WMS Endpoint Manager panel */

magic.classes.endpoint_manager.EndpointManagerPanel = function () {
    
    this.prefix = "endpoint-manager";
       
    this.searchForm = jQuery("#" + this.prefix + "-searchform");
    this.searchSelect = jQuery("#" + this.prefix + "-search");
    
    this.updateForm = jQuery("#" + this.prefix + "-update-form");
    
    /* Update form fields */
    this.updateFormFields = [
        {"field": "id", "default": ""}, 
        {"field": "coast_layers", "default": ""},
        {"field": "graticule_layer", "default": ""}, 
        {"field": "low_bandwidth", "default": false}, 
        {"field": "name", "default": ""},
        {"field": "url", "default": ""},
        {"field": "proxied_url", "default": ""},
        {"field": "rest_endpoint", "default": ""},
        {"field": "url_aliases", "default": "", "plugin": "tagsinput"},
        {"field": "location", "default": ""}, 
        {"field": "srs", "default": "", "plugin": "multiselect"}, 
        {"field": "has_wfs", "default": true}, 
        {"field": "is_user_service", "default": false}
    ];
    
    this.pluginFields = {};
    jQuery.each(
        jQuery.grep(this.updateFormFields, function(elt) {
            return("plugin" in elt);
        }, false), 
        jQuery.proxy(function(idx, fdef) {
            switch(fdef.plugin) {
                case "tagsinput":
                    this.pluginFields[fdef.field] = new magic.classes.TagsInput({
                        id: this.prefix + "-" + fdef.field,
                        tagValidator: function(value) {
                            return(magic.modules.Common.isUrl(value));
                        }
                    });
                    break;
                case "multiselect":
                    this.pluginFields[fdef.field] = new magic.classes.MultiSelectInput({
                        id: this.prefix + "-" + fdef.field,
                        required: true
                    });
                    break;
                default:
                    break;
            }
        }, this)
    );
    
    this.buttons = {
        "create": jQuery("#" + this.prefix + "-btn-create"),
        "update": jQuery("#" + this.prefix + "-btn-update"),
        "delete": jQuery("#" + this.prefix + "-btn-delete"),
        "cancel": jQuery("#" + this.prefix + "-btn-cancel")
    };
    
    /* ID of the currently selected endpoint */
    this.selectedEndpointId = null;
    
    /* If user has made any changes to the form (for confirmation) */
    this.formDirty = false;
    
    /* Determine when there has been a form change */
    this.updateForm.find(":input:not(:button)").on("change keyup", jQuery.proxy(function() {
        this.buttons["update"].prop("disabled", false);
        this.formDirty = true;
    }, this)); 
    
    /* Search selection handler */
    this.searchSelect.on("change", jQuery.proxy(function(evt) {
        if (this.formDirty) {
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">You have unsaved changes - proceed?</div>', jQuery.proxy(function (result) {
                if (result) {
                    this.getEndpointData(this.searchSelect.val());
                }
            }, this));
        } else {
            this.getEndpointData(this.searchSelect.val());
        }
    }, this));
    
    this.buttons["create"].on("click", jQuery.proxy(this.createHandler, this));
    this.buttons["update"].on("click", jQuery.proxy(this.updateHandler, this));
    this.buttons["delete"].on("click", jQuery.proxy(this.deleteHandler, this));
    this.buttons["cancel"].on("click", jQuery.proxy(this.cancelHandler, this));
    
    this.loadEndpoints(jQuery.proxy(this.resetForm, this));
    
};

/**
 * Get data for endpoint by id
 * @param {int} id
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.getEndpointData = function(id) {
    jQuery.getJSON(magic.config.paths.baseurl + "/endpoints/get/" + id, jQuery.proxy(function(data) {
        this.resetForm();
        this.payloadToForm(data);
        this.setButtonStatuses({
            "create": true,
            "update": false,
            "delete": true,
            "cancel": true
        });
        this.selectedEndpointId = data.id;
    }, this))
    .fail(jQuery.proxy(function(xhr) {
        magic.modules.Common.showAlertModal("Failed to load endpoint with id " + id + " : " + this.alertResponse(xhr), "warning");        
    }, this));
};

/**
 * Handle create
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.createHandler = function(evt) {
    jQuery(evt.currentTarget).tooltip("hide");
    if (this.formDirty) {
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">You have unsaved changes - proceed?</div>', jQuery.proxy(function (result) {
            if (result) {
                this.resetForm(true);
            }
        }, this));
    } else {
        this.resetForm(true);
    }
};

/**
 * Handle create/update of endpoint data
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.updateHandler = function(evt) {
    jQuery(evt.currentTarget).tooltip("hide");  /* Seems to get stuck on the page otherwise */
    var saveUrl = magic.config.paths.baseurl + "/endpoints/" + (this.selectedEndpointId == null ? "save" : "update/" + this.selectedEndpointId);
    if (this.validate()) {
        console.log(JSON.stringify(this.formToPayload()));
        jQuery.ajax({
            url: saveUrl, 
            data: JSON.stringify(this.formToPayload()), 
            method: "PUT",
            dataType: "json",
            contentType: "application/json",
            headers: {
                "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
            },
            success: jQuery.proxy(function(data) {
                this.buttonClickFeedback("update", true, "ok");
                this.resetForm(true);
            }, this),
            fail: jQuery.proxy(function(xhr) {
                this.buttonClickFeedback("delete", false, this.alertResponse(xhr));  
            }, this)
        });
    }
};

/**
 * Handle cancel
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.cancelHandler = function(evt) {
    jQuery(evt.currentTarget).tooltip("hide");
    this.resetForm();
};

/**
 * Handle deletion of an endpoint
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.deleteHandler = function(evt) {
    jQuery(evt.currentTarget).tooltip("hide");
    if (this.selectedEndpointId != null) {
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Really delete this endpoint?</div>', jQuery.proxy(function (result) {
            if (result) {
                /* Do the thumbnail removal */
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/endpoints/delete/" + this.selectedEndpointId,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                        var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(jQuery.proxy(function() {
                    this.buttonClickFeedback("delete", true, "Successfully deleted endpoint");
                    this.loadEndpoints(jQuery.proxy(this.resetForm, this));
                }, this))
                .fail(jQuery.proxy(function(xhr) {
                    this.buttonClickFeedback("delete", false, this.alertResponse(xhr));
                }, this));
            }
        }, this));
    }
};

/**
 * Load the endpoints into the search list
 * @param {Function} callback
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.loadEndpoints = function(callback) {
    jQuery.getJSON(magic.config.paths.baseurl + "/endpoints/dropdown", jQuery.proxy(function (data) {
        if (jQuery.isArray(data)) {
            magic.modules.Common.populateSelect(this.searchSelect, data, "id", "name", "", true);            
        } else {
            magic.modules.Common.showAlertModal("Malformed data received while loading endpoints - server may be down?", "warning");            
        }        
        if (jQuery.isFunction(callback)) {
            callback();
        }
    }, this))
    .fail(jQuery.proxy(function(xhr) {
        magic.modules.Common.showAlertModal("Error loading endpoints : " + this.alertResponse(xhr), "warning");        
    }, this));
};

/**
 * Reset the form and zero settings
 * @param {boolean} resetSearch
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.resetForm = function(resetSearch) {
    resetSearch = resetSearch || false;
    this.selectedEndpointId = null;
    if (resetSearch) {
        this.searchForm.get(0).reset();
    }
    this.updateForm.get(0).reset();
    /* Reset above doesn't zero this one for some reason */
    jQuery("#" + this.prefix + "-location").val("");
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        pf.reset();
    }, this));
    magic.modules.Common.resetFormIndicators();
    this.setButtonStatuses();
    this.formDirty = false;
};

/**
 * JSON payload to form
 * @param {Object} payload
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.payloadToForm = function(payload) {
    magic.modules.Common.jsonToForm(jQuery.grep(this.updateFormFields, function(elt) {
        return("plugin" in elt);
    }, true), payload, this.prefix);
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        pf.setValue(payload[key]);
    }, this));
    this.formDirty = false;
};

/**
 * Form to JSON payload
 * @return {Object}
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.formToPayload = function() {
    var payload = magic.modules.Common.formToJson(jQuery.grep(this.updateFormFields, function(elt) {
        return("plugin" in elt);
    }, true), this.prefix);
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        payload[key] = pf.getValue(false);
    }, this));
    /* Low bandwidth option */
    payload["low_bandwidth"] = payload["location"] != "cambridge";
    return(payload);
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.validate = function() {
    var valid = true;
    magic.modules.Common.resetFormIndicators();
    jQuery.each(this.updateFormFields, jQuery.proxy(function(idx, fld) {
        var fldValid = false;
        if ("plugin" in fld) {
            /* Plugin field => specific validator */
            fldValid = this.pluginFields[fld.field].validate();
        } else {
            /* Use native checkValidity() */
            var inputEl = jQuery("#" + this.prefix + "-" + fld.field);
            fldValid = inputEl.get(0).checkValidity();
            if (!fldValid) {
                magic.modules.Common.flagInputError(inputEl);
            }
        }
        if (!fldValid) {         
            valid = false;
        }
    }, this));    
    return(valid);
};

/**
 * Set the button disabled statuses
 * @param {Object} settings
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.setButtonStatuses = function(settings) {
    if (!settings || jQuery.isEmptyObject(settings)) {
        settings = {
            "create": true,
            "update": false, 
            "delete": false,
            "cancel": true
        };
    }
    jQuery.each(this.buttons, jQuery.proxy(function(btnKey, btn) {
        this.buttons[btnKey].prop("disabled", settings[btnKey] !== true);
    }, this));
};

/**
 * Assemble an alert message for an Ajax fail
 * @param {XmlHttpRequest} xhr
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.alertResponse = function(xhr) {
    var detail = xhr.responseText;
    try {
        detail = JSON.parse(xhr.responseText)["detail"];                    
    } catch(e) {                    
    }
    return(detail);
};

/**
 * Give feedback about success or otherwise of a CRUD operation
 * @param {String} key
 * @param {boolean} success
 * @param {String} msg
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.buttonClickFeedback = function(key, success, msg) {
    var effect;
    this.buttons[key].hide();
    /* See https://api.jquery.com/promise/ for queuing up animations like this */
    var fbBtn = jQuery("#" + this.buttons[key].attr("id") + (success ? "-ok" : "-fail"));
    fbBtn.attr("data-original-title", msg).tooltip("fixTitle");
    effect = function() {
        return(fbBtn.fadeIn(300).delay(1200).fadeOut(300));
    };                                                          
    jQuery.when(effect()).done(jQuery.proxy(function() {
        this.buttons[key].show();                            
    }, this));                        
};