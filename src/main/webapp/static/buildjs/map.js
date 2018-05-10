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
/* Canned styles for vector layers */

magic.modules.VectorStyles = function () {
    
    var col2Hex = {
        red: "#f20000",
        orange: "#ff776b",
        green: "#5af23f",
        gold: "#ffd700",
        gray: "#777777"
    };
    
    /**
     * Get property key of given object that looks like a name
     * @param {Object} props
     * @return {String}
     */
    function getNameProperty(props) {
        var nameProp = null;
        jQuery.each(props, function(key, value) {
            if (magic.modules.Common.isNameLike(key)) {
                nameProp = value;
                return(false);
            }
        });
        return(nameProp);
    }
    
    /**
     * Canned style for map pin marker of given colour
     * @param {String} col
     * @return {Function}
     */
    function markerStyle(col) {
        return(function() {
            var name = getNameProperty(this.getProperties());
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    scale: 0.8,
                    anchor: [0.5, 1.0],
                    src: magic.config.paths.baseurl + "/static/images/marker_" + col + ".png"
                })
            });
            if (name != null) {
                style.setText(new ol.style.Text({
                    font: "Arial",
                    scale: 1.2,
                    offsetX: 10,
                    offsetY: -10,
                    text: name,
                    textAlign: "left",
                    fill: new ol.style.Fill({color: magic.modules.Common.rgbToDec(col2Hex[col], 0.0)}),
                    stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                }));
            }
            return([style]);
        });
    }

    return({
        
        bas_aircraft: function(proj) {
            return(function() {
                var props = this.getProperties();
                var name = props["callsign"] || "unknown aircraft";
                var speed = props["speed"] || 0;
                var heading = props["heading"] || 0;
                var tstamp = new Date(props["utc"]).getTime();
                var now = new Date().getTime();
                var tstampAge = parseFloat(now - tstamp)/(1000.0*60.0*60.0);
                var colour = (speed >= 10 && tstampAge <= 1) ? "green" : "red";
                var rotateWithView = !(proj == "EPSG:4326" || proj == "EPSG:3857");
                var rotation = rotateWithView ? magic.modules.GeoUtils.headingWrtTrueNorth(this.getGeometry(), heading) : heading;
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: rotateWithView,
                        rotation: magic.modules.Common.toRadians(rotation),
                        src: magic.config.paths.baseurl + "/static/images/airplane_" + colour + "_roundel.png"
                    }),
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 14,
                        text: name,
                        textAlign: "left",
                        fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        bas_ship: function(proj) {
            return(function() {
                var props = this.getProperties();
                var name = props["callsign"] || "unknown ship";
                var speed = props["speed"] || 0;
                var colour = speed > 0 ? "green" : "red"; 
                var heading = props["heading"] || 0;
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: true,
                        rotation: heading,
                        src: magic.config.paths.baseurl + "/static/images/ship_" + colour + "_roundel.png"
                    }),
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 14,
                        text: name,
                        textAlign: "left",
                        fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        comnap_asset: function() {
            return(function() {
                var styles = [];                
                var props = this.getProperties();
                var name = props["name"] || "unknown asset";
                var speed = props["speed"] || 0;
                var colour = speed > 0 ? "green" : "red";
                var rotation = 0;
                var geoms = this.getGeometry().getGeometries();
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.GeoUtils.getGeometryType(geoms[i]);
                    if (gtype == "line") {
                        rotation = magic.modules.GeoUtils.headingFromTrackGeometry(geoms[i]);
                    }
                }
                var type = "unknown";
                switch(props["type"].toLowerCase()) {
                    case "ship": type = "ship"; break;
                    case "aeroplane": type = "airplane"; break;
                    case "helicopter": type = "helicopter"; break;
                    default: break;
                }
                if (name != "unknown asset" && props["description"]) {
                    name = props["description"] + " (" + name + ")";
                }
                var roundel = magic.config.paths.baseurl + "/static/images/" + type + "_" + colour + "_roundel.png";
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.GeoUtils.getGeometryType(geoms[i]);
                    if (gtype == "point") {
                        styles.push(new ol.style.Style({
                            geometry: geoms[i],
                            image: new ol.style.Icon({
                                rotateWithView: true,
                                rotation: rotation,
                                src: roundel
                            }),
                            text: new ol.style.Text({
                                font: "Arial",
                                scale: 1.2,
                                offsetX: 14,
                                text: name,
                                textAlign: "left",
                                fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                                stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                            })
                        }));                        
                    } else {
                        /* This is the track geometry which should have a transparent style */
                        styles.push(new ol.style.Style({
                            geometry: geoms[i],
                            fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.0)"}),
                            stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                        }));
                    }
                }
                return(styles);
            });
        },
        antarctic_facility: function() {
            return(function() {
                var props = this.getProperties();
                var fillColor = "rgba(255, 0, 0, 0.4)";
                if (!props["current_status"] || props["current_status"].toLowerCase() == "seasonal") {
                    fillColor = "rgba(255, 255, 255, 0.8)";
                }
                return([new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4.5, 
                        fill: new ol.style.Fill({color: fillColor}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 0, 0, 1.0)", width: 1.5})
                    }),                    
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 7,
                        text: props["facility_name"],
                        textAlign: "left",
                        fill: new ol.style.Fill({color: "rgba(255, 0, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        red_map_pin: function() {
            return(markerStyle("red"));
        },
        orange_map_pin: function() {
            return(markerStyle("orange"));
        },
        green_map_pin: function() {
            return(markerStyle("green"));
        },
        gold_map_pin: function() {
            return(markerStyle("gold"));
        },
        gray_map_pin: function() {
            return(markerStyle("gray"));
        }

    });

}();
/* Prototype class for asset positional buttons offered as map tools */

magic.classes.AssetPositionButton = function (name, ribbon, options) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = (options.title || "Asset") + " positions";
    this.iconClass = options.iconClass || "fa fa-circle";
    
    this.inactiveTitle = "Show latest " + this.title + " positions";
    this.activeTitle = "Hide " + this.title + " positions";
    
    /* Display layer within main map */
    this.active = false;
    this.timer = null;    
    this.geoJson = null;
    this.layer = null;
    this.insetLayer = null;
    this.data = {
        inside: [],
        outside: []
    };
    
    /* Dummy attribute map, usually overridden by subclasses */
    this.attribute_map = [
        {name: "name", alias: "Name", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true}
    ];
        
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="' + this.iconClass + '"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));                     
    jQuery(document).on("insetmapopened", jQuery.proxy(function(evt) {
        if (magic.runtime.inset) {
            this.insetLayer = new ol.layer.Vector({
                name: this.title + "_inset",
                visible: this.isActive(),
                source: new ol.source.Vector({
                    features: []
                }),
                metadata: {
                    is_interactive: true,
                    attribute_map: this.attribute_map
                }
            });            
            magic.runtime.inset.addLayer(this.insetLayer); 
            if (this.data.outside.length > 0) {
                var osClones = jQuery.map(this.data.outside, function(f) {
                    return(f.clone());
                });                        
                this.insetLayer.getSource().addFeatures(osClones);
            }
        }
    }, this));
    jQuery(document).on("insetmapclosed", jQuery.proxy(function(evt) {
        this.insetLayer = null;
    }, this));
};

magic.classes.AssetPositionButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.AssetPositionButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.AssetPositionButton.prototype.activate = function () {
    this.active = true;
    this.timer = window.setInterval(jQuery.proxy(this.getData, this), 600000);
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: this.title,
            visible: true,
            source: new ol.source.Vector({
                features: []
            }),
            metadata: {
                is_interactive: true,
                attribute_map: this.attribute_map
            }
        });
        this.layer.setZIndex(500);
        magic.runtime.map.addLayer(this.layer);
    } else {
        this.layer.setVisible(true);
    }  
    if (this.insetLayer) {
        this.insetLayer.setVisible(true);
    }
    this.getData();
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");   
};

/**
 * Deactivate the control
 */
magic.classes.AssetPositionButton.prototype.deactivate = function () {
    this.active = false;
    if (this.timer == null) {
        window.clearInterval(this.timer);
        this.timer = null;
    }
    this.layer.setVisible(false);
    if (this.insetLayer) {
        this.insetLayer.setVisible(false);
        this.insetLayer.getSource().clear();
    }
    if (jQuery.isFunction(magic.runtime.layer_visibility_change_callback)) {
        magic.runtime.layer_visibility_change_callback();
    }
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
    magic.runtime.inset.deactivate();
};
    
/* Overriden by subclasses */
magic.classes.AssetPositionButton.prototype.getData = function() {
    return;
};
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

/* Prototype class for map DEM aware tools */

magic.classes.DemAwareTool = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* === End of API properties === */
    
    /* List of DEMs in current map */
    this.demLayers = this.getDemLayers();
    
    /* Units in which to express elevations */
    this.units = "m";
    
    /* Target (invocation button) */
    this.target = options.target || null;
    
    /* Target activate/deactivate tooltips */
    this.activeTooltip = "Deactivate tool";
    this.inactiveTooltip = "Activate tool";
    
};

magic.classes.DemAwareTool.prototype.getUnits = function() {
    return(this.units);
};

magic.classes.DemAwareTool.prototype.setUnits = function(units) {
    this.units = units;
};

magic.classes.DemAwareTool.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.DemAwareTool.prototype.setTarget = function(targetId, activeTooltip, inactiveTooltip) {
    this.target = jQuery("#" + targetId);
    this.activeTooltip = activeTooltip || "Deactivate tool";
    this.inactiveTooltip = inactiveTooltip || "Activate tool";
};

/**
 * Get DEM layers within the current map
 * @returns {Array<ol.Layer>}
 */
magic.classes.DemAwareTool.prototype.getDemLayers = function() {
    var dems = [];
    if (this.map) {
        this.map.getLayers().forEach(function (layer) {
            var md = layer.get("metadata");
            if (md && md.source) {
                if (md.source.is_dem === true) {
                    dems.push(layer);
                }
            }
        });
    }
    return(dems);
};

/**
 * Get WMS feature names for all visible DEM layers
 * @return {Array} feature types
 */
magic.classes.DemAwareTool.prototype.currentlyVisibleDems = function() {
    var visibleDems = [];
    if (this.demLayers.length > 0) {                
        visibleDems = jQuery.map(this.demLayers, function(l, idx) {
            if (l.getVisible()) {
                return(l.get("metadata").source.feature_name);
            }
        });       
    }
    return(visibleDems);
};

/**
 * Map click handler to query DEM elevation at a point
 * @param {jQuery.Event} evt
 * @param {Function} successCb - callback on success of the query
 * @param {Function} failCb
 */
magic.classes.DemAwareTool.prototype.queryElevation = function(evt, successCb, failCb) {    
    var clickPoint = evt.coordinate;
    var gfiUrl = this.getGfiUrl(clickPoint);
    if (gfiUrl) {            
        jQuery.ajax({
            url: magic.modules.Common.proxyUrl(gfiUrl),
            method: "GET"
        })
        .done(jQuery.proxy(function(data) {
            /* Expect a feature collection with one feature containing a properties object */
            var clickPointWgs84 = ol.proj.transform(clickPoint, this.map.getView().getProjection().getCode(), "EPSG:4326");
            var lon = magic.modules.GeoUtils.applyPref("coordinates", parseFloat(clickPointWgs84[0]).toFixed(2), "lon");
            var lat = magic.modules.GeoUtils.applyPref("coordinates", parseFloat(clickPointWgs84[1]).toFixed(2), "lat");
            var elevation = this.getDemValue(data);
            successCb(clickPoint, lon, lat, elevation);                
        }, this))
        .fail(jQuery.proxy(function(xhr) {
            failCb(clickPoint, xhr);                
        }, this));
    }
};

/**
 * Construct a WMS GetFeatureInfo URL
 * @param {ol.coordinate} clickPoint
 * @return {String}
 */
magic.classes.DemAwareTool.prototype.getGfiUrl = function(clickPoint) {
    var url = null;
    var demFeats = this.currentlyVisibleDems();    
    if (demFeats.length > 0) {
        /* May need a proxy in some cases */
        url = this.demLayers[0].getSource().getGetFeatureInfoUrl(
            clickPoint, this.map.getView().getResolution(), this.map.getView().getProjection().getCode(),
            {
                "LAYERS": demFeats.join(","),
                "QUERY_LAYERS": demFeats.join(","),
                "INFO_FORMAT": "application/json",
                "FEATURE_COUNT": this.demLayers.length
            }
        );
    }
    return(url);
};

/**
 * Extract the DEM value from the GFI feature collection
 * @param {Object} json FeatureCollection
 * @returns {number|NaN}
 */
magic.classes.DemAwareTool.prototype.getDemValue = function(json) {
    var demValue = Number.NaN;
    if (jQuery.isArray(json.features) && json.features.length > 0) {
        /* Look for a sensible number */    
        jQuery.each(json.features, function(idx, f) {
            if (f.properties) {
                jQuery.each(f.properties, function(key, value) {
                    var fval = parseFloat(value);
                    if (!isNaN(fval) && Math.abs(fval) < 9000 && (isNaN(demValue) || fval > demValue)) {
                        demValue = Math.ceil(fval);
                    }
                });
            }
        });        
    }
    return(demValue);
};
/* Base class for a map control ribbon button */

magic.classes.MapControlButton = function (options) {

    /* API properties */
    this.name = options.name;
    this.ribbon = options.ribbon;
    this.inactiveTitle = options.inactiveTitle;
    this.activeTitle = options.activeTitle;
    this.activeBtnClass = options.activeBtnClass;
    this.inactiveBtnClass = options.inactiveBtnClass;
    this.startActive = options.startActive === true || false;
    
    this.map = options.map || magic.runtime.map;
    
    /* Callbacks */
    this.onActivate = options.onActivate;
    this.onDeactivate = options.onDeactivate;

    /* Internal properties */
    this.active = this.startActive;
   
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool" + (this.startActive ? " active" : ""),
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": (this.startActive ? this.activeTitle : this.inactiveTitle),
        "html": '<span class="' + (this.startActive ? this.activeBtnClass : this.inactiveBtnClass) + '"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
    
};

magic.classes.MapControlButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.MapControlButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.MapControlButton.prototype.activate = function () {
    this.active = true;
    this.btn.addClass("active");
    this.btn.children("span").removeClass(this.inactiveBtnClass).addClass(this.activeBtnClass);
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
    if (jQuery.isFunction(this.onActivate)) {
        this.onActivate();
    }
};

/**
 * Deactivate the control
 */
magic.classes.MapControlButton.prototype.deactivate = function () {
    this.active = false;    
    this.btn.removeClass("active");
    this.btn.children("span").removeClass(this.activeBtnClass).addClass(this.inactiveBtnClass);
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
    if (jQuery.isFunction(this.onDeactivate)) {
        this.onDeactivate();
    }
};
    
/* Prototype class for navigation bar tools */

magic.classes.NavigationBarTool = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover target */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Untitled";
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || "";
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* Name for the results layer */
    this.layername = options.layername;
    
    /* Map to add layer to */
    this.map = options.map || magic.runtime.map;    
    
    /* === Internal properties === */
    this.active = false;

    /* Corresponding layer */
    if (this.layername == null) {
        this.layer = null;
    } else {
        this.layer = new ol.layer.Vector({
            name: this.layername,
            visible: false,
            source: new ol.source.Vector({features: []}),
            style: null,
            metadata: {}
        });
    }
    
    /* Control callbacks */
    this.controlCallbacks = {};
    
    /* Don't add layer to map at creation time - other map layers may not have finished loading */
    this.layerAdded = false;    

    /* Popover template */    
    this.template = 
        '<div class="popover popover-auto-width' + (this.popoverClass ? ' ' + this.popoverClass : '') + '" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title">' + this.caption + '</h3>' +
            '<div class="popover-content' + (this.popoverContentClass ? ' ' + this.popoverContentClass : '') + '"></div>' +
        '</div>';       
};

magic.classes.NavigationBarTool.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.NavigationBarTool.prototype.getTemplate = function () {
    return(this.template);
};

magic.classes.NavigationBarTool.prototype.isActive = function () {
    return(this.active);
};

magic.classes.NavigationBarTool.prototype.titleMarkup = function() {
    return(
        '<span><big><strong>' + this.caption + '</strong></big>' + 
            '<button type="button" class="close dialog-deactivate" style="margin-left:5px">&times;</button>' + 
            '<button type="button" class="close dialog-minimise" data-toggle="tooltip" data-placement="bottom" ' + 
                'title="Minimise pop-up to see the map better - does not reset dialog"><i class="fa fa-caret-up"></i>' + 
            '</button>' + 
        '</span>'
    );
};

/**
 * Set the callbacks to be invoked on tool activate, deactivate and minimise
 * keys:
 *   onActivate
 *   onDeactivate
 *   onMinimise
 * @param {Object} callbacksObj
 */
magic.classes.NavigationBarTool.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};

magic.classes.NavigationBarTool.prototype.assignCloseButtonHandler = function () {
    jQuery("." + this.popoverClass).find("button.dialog-deactivate").click(jQuery.proxy(function () {
        this.deactivate();        
    }, this));
    jQuery("." + this.popoverClass).find("button.dialog-minimise").click(jQuery.proxy(function () {
        if (jQuery.isFunction(this.controlCallbacks["onMinimise"])) {
            this.controlCallbacks["onMinimise"]();
        }
        this.target.popover("hide");
    }, this));
};  

/**
 * Activate the control 
 */
magic.classes.NavigationBarTool.prototype.activate = function () {    
    if (this.layer != null && !this.layerAdded) {
        this.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    if (this.interactsMap()) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);
    }
    this.active = true;
    if (this.layer != null) {
        this.layer.setVisible(true);
    }
    this.assignCloseButtonHandler();
    if (jQuery.isFunction(this.controlCallbacks["onActivate"])) {
        this.controlCallbacks["onActivate"]();
    }
};

/**
 * Deactivate the control
 */
magic.classes.NavigationBarTool.prototype.deactivate = function () {
    this.active = false;
    if (this.layer != null) {
        this.layer.getSource().clear();
        this.layer.setVisible(false);
    }
    if (this.interactsMap()) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);
    }
    if (jQuery.isFunction(this.controlCallbacks["onDeactivate"])) {
        this.controlCallbacks["onDeactivate"]();
    }
};

/**
 * Set template for a 'further info' link button
 * @param {string} helpText
 */
magic.classes.NavigationBarTool.prototype.infoLinkButtonMarkup = function (helpText) {
    return(
        '<div style="display:inline-block;float:right">' +
            '<a href="JavaScript:void(0)" class="fa fa-info-circle further-info" data-toggle="tooltip" data-placement="bottom" title="' + helpText + '">&nbsp;' +
                '<span class="fa fa-caret-down"></span>' +
            '</a>' +
        '</div>'
    );
};

/**
 * Set template for a 'further info' text area
 */
magic.classes.NavigationBarTool.prototype.infoAreaMarkup = function () {
    return('<div id="' + this.id + '-further-info" class="alert alert-info hidden"></div>');
};

/**
 * Assign handler for info button click
 * @param {string} caption
 * @para, {string} text
 */
magic.classes.NavigationBarTool.prototype.infoButtonHandler = function (caption, text) {
    jQuery("a.further-info").click(jQuery.proxy(function (evt) {
        var attribArea = jQuery("#" + this.id + "-further-info");
        attribArea.toggleClass("hidden");
        if (!attribArea.hasClass("hidden")) {
            attribArea.html(text);
            jQuery(evt.currentTarget).children("span").removeClass("fa-caret-down").addClass("fa-caret-up");
            jQuery(evt.currentTarget).attr("data-original-title", "Hide " + caption).tooltip("fixTitle");
        } else {
            jQuery(evt.currentTarget).children("span").removeClass("fa-caret-up").addClass("fa-caret-down");
            jQuery(evt.currentTarget).attr("data-original-title", "Show " + caption).tooltip("fixTitle");
        }
    }, this));
};

/**
 * Format error messages about problem fields from validation
 * @param {Object} errors
 * @return {String}
 */
magic.classes.NavigationBarTool.prototype.formatErrors = function (errors) {
    var html = "";
    for (var errkey in errors) {
        html += '<p>' + errkey + ' - ' + errors[errkey] + '</p>';
    }
    return(html);
};

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
/* Gazetteer search input control */

magic.classes.GazetteerSearchInput = function(containerId, baseId, suggestionCallbacks, gazetteers, minLength) {
    
    /* Constants */
    this.LOCATIONS_API = "https://api.bas.ac.uk/locations/v1/gazetteer";
    
    /* div to contain the composite input */
    this.container = jQuery("#" + containerId);
        
    /* Identifier stem for id-ing the inputs */
    this.baseId = baseId || "geosearch";
    
    /* Suite of callbacks for typeahead suggestions
     * Valid keys are:
     *  mouseover(event)
     *  mouseout(event)
     *  select(event)
     *  search(event)
     */
    this.suggestionCallbacks = suggestionCallbacks || {};
    
    /* List of gazetteer names to query */
    this.gazetteers = gazetteers || ["cga"];
    
    /* Minimum length of string before typeahead kicks in */
    this.minLength = minLength || 4;
    
    /* Internals */
    
    /* Temporary list of suggestions for working the mouseover overlays */
    this.searchSuggestions = {};
    
    /* The selected suggestion */
    this.currentSearch = null;
    
    /* Get metadata about gazetteers, keyed by name, and set source information for typeahead */
    this.sources = null;
    this.gazetteerData = {};
    jQuery.getJSON(this.LOCATIONS_API, jQuery.proxy(function (payload) {
        /* Get gazetteer metadata keyed by gazetteer name */
        jQuery.map(payload.data, jQuery.proxy(function (gd) {
            this.gazetteerData[gd.gazetteer] = gd;
        }, this));
        /* Set up sources for typeahead input */
        this.sources = jQuery.map(this.gazetteers, jQuery.proxy(function (gaz) {
            return({
                source: jQuery.proxy(function (query, syncResults, asyncResults) {
                    jQuery.getJSON(this.LOCATIONS_API + "/" + gaz + "/" + query + "/brief", function (json) {
                        asyncResults(json.data);
                    });
                }, this),
                name: gaz,
                display: jQuery.proxy(function (value) {                    
                    return(value.placename + (this.gazetteerData[gaz].composite ? " (" + value.gazetteer + ")" : ""));
                }, this),
                limit: 100,
                templates: {
                    notFound: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div><p class="suggestion">No results</p>',
                    header: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div>',
                    suggestion: jQuery.proxy(function (value) {
                        var output = value.placename + (this.gazetteerData[gaz].composite ? " (" + value.gazetteer + ")" : "");                                      
                        this.searchSuggestions[output] = jQuery.extend({}, value, {"__gaz_name": gaz});
                        return('<p class="suggestion">' + output + '</p>');
                    }, this)
                }
            });
        }, this));        
    }, this));        
    
};

/**
 * Set typeahead and search button click handlers 
 */
magic.classes.GazetteerSearchInput.prototype.init = function() {
    jQuery("#" + this.baseId + "-ta").typeahead({minLength: this.minLength, highlight: true}, this.sources)
    .on("typeahead:autocompleted", jQuery.proxy(this.selectHandler, this))
    .on("typeahead:selected", jQuery.proxy(this.selectHandler, this))
    .on("typeahead:render", jQuery.proxy(function () {
        if (jQuery.isFunction(this.suggestionCallbacks.mouseover)) {
            jQuery("p.suggestion").off("mouseover").on("mouseover", {suggestions: this.searchSuggestions}, this.suggestionCallbacks.mouseover);
        }
        if (jQuery.isFunction(this.suggestionCallbacks.mouseout)) {
            jQuery("p.suggestion").off("mouseout").on("mouseout", {suggestions: this.searchSuggestions}, this.suggestionCallbacks.mouseout);
        }            
    }, this));
    jQuery("#" + this.baseId + "-placename-go").click(this.suggestionCallbacks.search);
};

/**
 * Handler for an autocompleted selection of place-name
 * @param {jQuery.Event} evt
 * @param {Object} sugg
 */
magic.classes.GazetteerSearchInput.prototype.selectHandler = function (evt, sugg) {
    var gaz = "";
    jQuery.each(this.searchSuggestions, function (idx, s) {
        if (s.id == sugg.id) {
            gaz = s["__gaz_name"];
            return(false);
        }
    });
    var data = jQuery.extend({}, sugg, {"__gaz_name": gaz});
    this.currentSearch = data;
    if (jQuery.isFunction(this.suggestionCallbacks.select)) {
        this.suggestionCallbacks.select(evt, {suggestions: this.searchSuggestions});
    }
};

magic.classes.GazetteerSearchInput.prototype.getSelection = function() {
    return(this.currentSearch);
};

magic.classes.GazetteerSearchInput.prototype.getSearch = function(value) {
    return(jQuery("#" + this.baseId + "-ta").val());
};

magic.classes.GazetteerSearchInput.prototype.setSearch = function(value) {
    jQuery("#" + this.baseId + "-ta").val(value);
};

magic.classes.GazetteerSearchInput.prototype.markup = function() {
    return(
        '<div class="form-group form-group-sm">' +
            '<div class="input-group">' +
                '<input id="' + this.baseId + '-ta" class="form-control typeahead border-lh-round" type="text" placeholder="Search for place-name" ' +
                    'required="required" autofocus="true"></input>' +
                '<span class="input-group-btn">' +
                    '<button id="' + this.baseId + '-placename-go" class="btn btn-primary btn-sm" type="button" ' +
                        'data-toggle="tooltip" data-placement="right" title="Search gazetteer">' +
                        '<span class="fa fa-search"></span>' +
                    '</button>' +
                '</span>' +
            '</div>' +
        '</div>' 
    );
};

/**
 * Returns the attribution HTML for all gazetteers used in this application
 * @returns {string}
 */
magic.classes.GazetteerSearchInput.prototype.getAttributions = function () {
    var attrArr = jQuery.map(this.gazetteers, jQuery.proxy(function (gaz) {
        return(
                '<strong>' + this.gazetteerData[gaz].title + '</strong>' +
                '<p style="font-size:smaller">' + magic.modules.Common.linkify(this.gazetteerData[gaz].attribution + '. ' + this.gazetteerData[gaz].website) + '</p>'
                );
    }, this));
    return(attrArr.join(""));
};



/* Layer edit/upload, implemented as a Bootstrap popover */

magic.classes.LayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "layer-editor-popup-tool",
        caption: "Edit layer data",
        popoverClass: "layer-editor-popover",
        popoverContentClass: "layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "caption", "description", "allowed_usage", "styledef"];
    
    this.subForms.styler = null;
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-layer-caption").focus();
        
        this.savedState = {};
        this.assignCloseButtonHandler();
        
        /* Create the styler popup dialog */
        this.subForms.styler = new magic.classes.StylerPopup({
            target: this.id + "-layer-style-edit",
            onSave: jQuery.proxy(this.writeStyle, this)                    
        });
        
        this.payloadToForm(this.prePopulator);
        this.assignHandlers(this.prePopulator);
        this.restoreState();
        this.initDropzone();
    }, this));
       
};

magic.classes.LayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.LayerEditorPopup.prototype.constructor = magic.classes.LayerEditorPopup;

magic.classes.LayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm">' +
            '<input type="hidden" id="' + this.id + '-layer-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-layer-styledef"></input>' +
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-caption"><span class="label label-danger">Name</span></label>' + 
                '<div class="col-sm-8">' + 
                    '<input type="text" id="' + this.id + '-layer-caption" class="form-control" ' + 
                        'placeholder="Layer caption" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-description">Description</label>' + 
                '<div class="col-sm-8">' + 
                    '<textarea id="' + this.id + '-layer-description" class="form-control" ' + 
                        'style="height:8em !important" ' + 
                        'placeholder="Detailed layer description, purpose, content etc" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Longer description of the layer">' +                                           
                    '</textarea>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-mode">Style</label>' + 
                '<div class="form-inline col-sm-8">' + 
                    '<select id="' + this.id + '-layer-style-mode" class="form-control" style="width:80%" ' + 
                        'data-toggle="tooltip" data-placement="top" ' + 
                        'title="Layer styling">' +
                        '<option value="default" default>Default</option>' + 
                        '<option value="file">Use style in file</option>' +
                        '<option value="point">Point style</option>' +
                        '<option value="line">Line style</option>' +
                        '<option value="polygon">Polygon style</option>' +
                    '</select>' + 
                    '<button id="' + this.id + '-layer-style-edit" style="width:20%" data-trigger="manual" data-container="body" data-toggle="popover" data-placement="left" ' + 
                        ' type="button" role="button"class="btn btn-sm btn-primary"><span class="fa fa-pencil"></span></button>' +
                '</div>' + 
            '</div>' +                    
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-allowed_usage">Share</label>' + 
                '<div class="col-sm-8">' + 
                    '<select name="' + this.id + '-layer-allowed_usage" id="' + this.id + '-layer-allowed_usage" class="form-control" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Sharing permissions">' +
                        '<option value="owner" default>no</option>' + 
                        '<option value="public">with everyone</option>' +
                        '<option value="login">with logged-in users only</option>' +
                    '</select>' + 
                '</div>' + 
            '</div>' + 
            '<div id="publish-files-dz" class="dropzone col-sm-12">' +                        
            '</div>' +                    
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<label class="col-sm-4 control-label">Modified</label>' + 
                '<div class="col-sm-8">' + 
                    '<p id="' + this.id + '-layer-last-mod" class="form-control-static"></p>' + 
                '</div>' + 
            '</div>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Publish layer", "sm", "Publish", true) +                                                            
        '</div>'
    );
};

magic.classes.LayerEditorPopup.prototype.assignHandlers = function(context) {
    
    var ddStyleMode = jQuery("#" + this.id + "-layer-style-mode");
    var btnStyleEdit = jQuery("#" + this.id + "-layer-style-edit");
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Change handler for style mode */
    ddStyleMode.change(jQuery.proxy(function(evt) {
        var mode = jQuery(evt.currentTarget).val();
        jQuery("#" + this.id + "-layer-styledef").val("{\"mode\":\"" + mode + "\"}");
        btnStyleEdit.prop("disabled", (mode == "file" || mode == "default"));
    }, this));
    
    /* Style edit button */
    btnStyleEdit.click(jQuery.proxy(function(evt) {
        var styledef = jQuery("#" + this.id + "-layer-styledef").val();
        if (typeof styledef == "string") {
            styledef = JSON.parse(styledef);
        } else if (!styledef) {
            styledef = {"mode": (ddStyleMode.val() || "default")};
        }
        this.subForms.styler.activate(styledef);
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
    
    /* Set the style mode appropriately */
    ddStyleMode.val("default");
    btnStyleEdit.prop("disabled", true);        
    context.styledef = this.subForms.styler.convertLegacyFormats(context.styledef);
    var mode = context.styledef.mode;
    ddStyleMode.val(mode);
    btnStyleEdit.prop("disabled", mode == "predefined" || mode == "default" || mode == "file");
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.LayerEditorPopup.prototype.writeStyle = function(styledef) {
    styledef = styledef || {"mode": "default"};
    jQuery("#" + this.id + "-layer-styledef").val(JSON.stringify(styledef));    
};

magic.classes.LayerEditorPopup.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

magic.classes.LayerEditorPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.LayerEditorPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.LayerEditorPopup.prototype.formToPayload = function() {
    var payload = {};
    var mode = jQuery("#" + this.id + "-layer-style-mode").val();
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        if (ip == "styledef" && (mode == "default" || mode == "file")) {            
            payload[ip] = "{\"mode\": \"" + mode + "\"}";
        } else {
            payload[ip] = jQuery("#" + this.id + "-layer-" + ip).val();
        }
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.LayerEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    var styledef = this.subForms.styler.convertLegacyFormats(populator["styledef"]);
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        if (ip == "styledef") {
            jQuery("#" + this.id + "-layer-" + ip).val(JSON.stringify(styledef));
        } else {
            jQuery("#" + this.id + "-layer-" + ip).val(populator[ip] || "");
        }
    }, this));        
    /* Last modified */
    var lastMod = jQuery("#" + this.id + "-layer-last-mod");
    if (populator.modified_date) {
        lastMod.closest("div.form-group").removeClass("hidden");
        lastMod.text(magic.modules.Common.dateFormat(populator.modified_date, "dmy"));
    } else {
        lastMod.closest("div.form-group").addClass("hidden");
    }
    /* Set styling mode */
    jQuery("#" + this.id + "-layer-style-mode").val(styledef.mode);
    jQuery("#" + this.id + "-layer-style-edit").prop("disabled", (styledef.mode == "file" || styledef.mode == "default"));
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.LayerEditorPopup.prototype.validate = function() {
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
 * Prevent duplication of dropzone allocation
 */
magic.classes.LayerEditorPopup.prototype.destroyDropzone = function() {
    try {
        Dropzone.forElement("div#publish-files-dz").destroy();
    } catch(e) {}
};

/**
 * Initialise the dropzone for uploading files
 */
magic.classes.LayerEditorPopup.prototype.initDropzone = function() {
    var previewTemplate =             
        '<div class="row col-sm-12">' + 
            '<div class="row col-sm-12">' +
                '<p class="name" data-dz-name style="font-weight:bold"></p>' +                
            '</div>' +
            '<div class="row">' + 
                '<div class="col-sm-4">' +
                    '<p class="size" data-dz-size=""></p>' +
                '</div>' +
                '<div class="col-sm-6 publish-feedback">' +
                    '<div class="progress progress-striped active show" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                        '<div class="progress-bar progress-bar-success" style="width:0%;" data-dz-uploadprogress></div>' +
                    '</div>' +
                    '<div class="publish-feedback-msg hidden">' + 
                    '</div>' + 
                '</div>' +
                '<div class="col-sm-2">' +
                    '<button data-dz-remove class="btn btn-xs btn-danger publish-delete show">' +
                        '<i class="fa fa-trash-o"></i>' +
                        '<span>&nbsp;Delete</span>' +
                    '</button>' +
                    '<button class="btn btn-xs btn-success publish-success hidden">' +
                        '<i class="fa fa-check"></i>' +
                        '<span>&nbsp;Publish ok</span>' +
                    '</button>' +
                    '<button class="btn btn-xs btn-warning publish-error hidden">' +
                        '<i class="fa fa-times"></i>' +
                        '<span>&nbsp;Publish failed</span>' +
                    '</button>' +
                '</div>' +   
            '</div>' + 
            '<div class="row col-sm-12">' + 
                '<strong class="error text-danger" data-dz-errormessage></strong>' + 
            '</div>' + 
        '</div>';
    var lep = this;
    var saveBtn = jQuery("#" + this.id + "-go");
    this.destroyDropzone();    
    new Dropzone("div#publish-files-dz", {
        url: magic.config.paths.baseurl + "/userlayers/save",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 100,  /* Maximum file size, in MB */
        uploadMultiple: false,        
        autoProcessQueue: false,
        maxFiles: 1,
        parallelUploads: 1,
        previewTemplate: previewTemplate,
        headers: {
            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
        },
        init: function () {
            this.on("complete", jQuery.proxy(function(file) {
                var response = JSON.parse(file.xhr.responseText);                
                if (response.status < 400) {
                    /* Successful save */
                    this.lep.cleanForm();
                    magic.modules.Common.buttonClickFeedback(this.lep.id, true, response.detail);
                    if (jQuery.isFunction(this.lep.controlCallbacks["onSave"])) {
                        this.lep.controlCallbacks["onSave"]();
                    }
                    this.lep.delayedDeactivate(2000);
                } else {
                    /* Failed to save */
                    magic.modules.Common.showAlertModal("Failed to save user layer data - details : " + response.detail, "warning");                    
                }
                this.pfdz.removeAllFiles();
            }, {pfdz: this, lep: lep})); 
            this.on("maxfilesexceeded", function(file) {
                this.removeAllFiles();
                this.addFile(file);
            });
            this.on("addedfile", function(file) {
                jQuery("div#publish-files-dz").find("p.name").html(file.name);
            });
            this.on("error", jQuery.proxy(function() {
                window.setTimeout(jQuery.proxy(this.removeAllFiles, this), 3000);
            }, this));
            /* Save button */
            saveBtn.off("click").on("click", jQuery.proxy(function() {            
                /* Indicate any invalid fields */                
                if (this.lep.validate()) {                   
                    var formdata = this.lep.formToPayload();                    
                    if (!jQuery.isArray(this.pfdz.files) || this.pfdz.files.length == 0) {
                        /* No upload file, so assume only the other fields are to change and process form data */
                        if (formdata["id"]) {
                            /* Do an update of user layer data */
                            jQuery.ajax({
                                url: magic.config.paths.baseurl + "/userlayers/update/" + formdata["id"], 
                                data: JSON.stringify(formdata), 
                                method: "POST",
                                dataType: "json",
                                contentType: "application/json",
                                headers: {
                                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                                }
                            })
                            .done(jQuery.proxy(function(response) {
                                this.cleanForm();
                                magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail); 
                                if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                                    this.controlCallbacks["onSave"]();
                                }
                                this.delayedDeactivate(2000);                                  
                            }, this.lep))
                            .fail(function (xhr) {
                                var msg;
                                try {
                                    msg = JSON.parse(xhr.responseText)["detail"];
                                } catch(e) {
                                    msg = xhr.responseText;
                                }
                                magic.modules.Common.showAlertModal("Failed to save user layer data - details : " + msg, "warning");                                 
                            });    
                        } else {
                            magic.modules.Common.showAlertModal("No uploaded file found - please specify the data to upload", "warning");                            
                        }
                    } else {
                        /* Uploaded file present, so process via DropZone */
                        /* Add the other form parameters to the dropzone POST */                    
                        this.pfdz.on("sending", function(file, xhr, data) { 
                            jQuery.each(formdata, function(key, val) {
                                data.append(key, val);
                            });      
                        });
                        this.pfdz.processQueue();
                    }
                } else {
                    magic.modules.Common.showAlertModal("Please correct the marked errors in your input and try again", "error");
                }            
            }, {pfdz: this, lep: lep}));
        },
        accept: function (file, done) {
            switch (file.type) {
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/gpx+xml":
                case "application/vnd.google-earth.kml+xml":
                case "application/zip":
                case "application/x-zip-compressed":
                    break;
                case "":
                    /* Do some more work - GPX (and sometimes KML) files routinely get uploaded without a type */
                    if (file.name.match(/\.gpx$/) != null) {
                        file.type = "application/gpx+xml";
                    } else if (file.name.match(/\.kml$/) != null) {
                        file.type = "application/vnd.google-earth.kml+xml";
                    } else {
                        done(this.options.dictInvalidFileType);
                        return;
                    }
                    break;
                default:
                    done(this.options.dictInvalidFileType);
                    return;
            }
            done();
        },
        dictDefaultMessage: "Upload GPX, KML, CSV or zipped Shapefiles by dragging and dropping them here",
        dictInvalidFileType: "Not a GPX, KML, CSV or zipped Shapefile",
        dictFileTooBig: "File is too large ({{filesize}} bytes) - maximum size is {{maxFileSize}}",
        dictResponseError: "Publication failed - server responded with code {{statusCode}}",
        dictCancelUpload: "Cancel upload",
        dictCancelUploadConfirmation: "Are you sure?"
    });
};

/* User map edit/upload, implemented as a Bootstrap popover */

magic.classes.MapEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "map-editor-popup-tool",
        caption: "Edit map data",
        popoverClass: "map-editor-popover",
        popoverContentClass: "map-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "basemap", "name", "allowed_usage", "data"];
       
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-map-name").focus();
        
        this.savedState = {};
        this.assignCloseButtonHandler();
       
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
        this.restoreState();
    }, this));
       
};

magic.classes.MapEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.MapEditorPopup.prototype.constructor = magic.classes.MapEditorPopup;

magic.classes.MapEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm">' +
            '<input type="hidden" id="' + this.id + '-map-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-map-basemap"></input>' +
            '<input type="hidden" id="' + this.id + '-map-data"></input>' +
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-3 control-label" for="' + this.id + '-map-name"><span class="label label-danger">Name</span></label>' + 
                '<div class="col-sm-9">' + 
                    '<input type="text" id="' + this.id + '-map-name" class="form-control" ' + 
                        'placeholder="Map name" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Map name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-3" for="' + this.id + '-map-allowed_usage">Share</label>' + 
                '<div class="col-sm-9">' + 
                    '<select id="' + this.id + '-map-allowed_usage" class="form-control" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Sharing permissions">' +
                        '<option value="owner" default>no</option>' + 
                        '<option value="public">with everyone</option>' +
                        '<option value="login">with logged-in users only</option>' +
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<label class="col-sm-3 control-label">Modified</label>' + 
                '<div class="col-sm-9">' + 
                    '<p id="' + this.id + '-map-last-mod" class="form-control-static"></p>' + 
                '</div>' + 
            '</div>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save map state", "sm", "Save", true) +                                                                
        '</div>'
    );
};

magic.classes.MapEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
   
    /* Save button */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function() { 
        if (this.validate()) {
            var formdata = this.formToPayload();
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/usermaps/" + (formdata.id ? "update/" + formdata.id : "save"), 
                data: JSON.stringify(formdata), 
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                headers: {
                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                }
            })
            .done(jQuery.proxy(function(response) {
                this.cleanForm();
                magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail);                
                this.delayedDeactivate(2000);
                if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                    this.controlCallbacks["onSave"]();
                }
            }, this))
            .fail(function (xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                magic.modules.Common.showAlertModal("Failed to save user map - details : " + msg, "warning");                
            });    
        } else {
            magic.modules.Common.showAlertModal("Please correct the marked errors in your input and try again", "error");
        }               
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

magic.classes.MapEditorPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.MapEditorPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

magic.classes.LayerEditorPopup.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.MapEditorPopup.prototype.formToPayload = function() {
    var payload = {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {        
        payload[ip] = jQuery("#" + this.id + "-map-" + ip).val();
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.MapEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-map-" + ip).val(populator[ip]);
    }, this));    
    /* Last modified */
    var lastMod = jQuery("#" + this.id + "-map-last-mod");
    if (populator.modified_date) {
        lastMod.closest("div.form-group").removeClass("hidden");
        lastMod.text(magic.modules.Common.dateFormat(populator.modified_date, "dmy"));
    } else {
        lastMod.closest("div.form-group").addClass("hidden");
    }   
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.MapEditorPopup.prototype.validate = function() {
    var ok = true;
    var nameInput = jQuery("#" + this.id + "-map-name");
    if (nameInput[0].checkValidity() === false) {
        nameInput.closest("div.form-group").addClass("has-error");
        ok = false;
    } else {
        nameInput.closest("div.form-group").removeClass("has-error");
    }
    return(ok);
};                  

/* Custom map view management */

magic.classes.MapViewManagerForm = function(options) {
        
    /* API options */    
    this.id = options.id || "map-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* Map data */
    this.mapData = null; 
    
    this.baseMapOrder = [];
    
    /* Layer editor popup tools */
    this.editorPopups = {
        "add": null,
        "edit": null
    };
    
    this.inputBaseNames = ["id", "basemap", "name", "allowed_usage", "data"];
    
    this.controls = {};        
        
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    
};

magic.classes.MapViewManagerForm.prototype.init = function() {    
   
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });
    /* Process base maps and load user-defined map views */
    this.mapData = {};
    this.baseMapOrder = [];
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        jQuery.each(data, jQuery.proxy(function(idx, rec) {            
            /* Permission-related data before the ':', base map name after */
            var nameCpts = rec.name.split(":");
            this.mapData[nameCpts[1]] = {
                "sharing": nameCpts[0],
                "title": rec.title,
                "views": []
            };
            /* Preserve the alphabetical ordering of the data */
            this.baseMapOrder.push(nameCpts[1]);
        }, this));
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {        
        jQuery.each(udata, jQuery.proxy(function(ium, um) {
            this.mapData[um.basemap].views.push(um.id);       
            this.mapData[um.id] = um;
        }, this));         
        /* Tabulate the layer markup */
        this.mapMarkup();
        this.assignHandlers(); 
        if (this.hasSavedState()) {
            /* Restore saved state */
            this.restoreState();   
        } else {
            /* Set the default button states and select the first base map */
            this.setSelection(this.baseMapOrder[0]);
            this.setButtonStates(null);      
        }
    }, this));
    userRequest.fail(function() {
        magic.modules.Common.showAlertModal("Failed to load available map views", "error");
    });          
};

magic.classes.MapViewManagerForm.prototype.markup = function() {
    return(
        '<form id="' + this.id + '-form" class="form-horizontal" role="form" style="margin-top:10px">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-basemap"></input>' + 
            '<input type="hidden" id="' + this.id + '-data"></input>' + 
            '<div class="form-group form-group-sm col-sm-12"><strong>Available base maps and user views</strong></div>' +
            '<div class="btn-toolbar" style="margin-bottom:10px">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-map-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Select a map view&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-maps" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' +                      
                    '<button id="' + this.id + '-map-add" class="btn btn-sm btn-primary" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Save current map view" class="fa fa-star"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.id + '-map-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit selected map view data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-map-del">' +
                        '<i data-toggle="tooltip" data-placement="top" title="Delete selected map view" class="fa fa-trash"></i>' + 
                    '</button>' +                     
                '</div>' +  
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-map-bmk" class="btn btn-sm btn-primary" type="button">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Bookmarkable URL for selected map view" class="fa fa-bookmark"></i>' + 
                    '</button>' +
                    '<button id="' + this.id + '-map-load" class="btn btn-sm btn-primary" type="button">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Load selected map view" class="fa fa-arrow-circle-right"></i>' + 
                    '</button>' +
                '</div>' + 
            '</div>' +             
            '<div class="checkbox" style="padding-top:0px">' + 
                '<label>' + 
                    '<input id="' + this.id + '-map-load-new-tab" type="checkbox" checked ' + 
                        'data-toggle="tooltip" data-placement="left" title="Load map in a new browser tab"></input> maps load in new browser tab' + 
                '</label>' + 
            '</div>' + 
        '</form>'
    );
};

magic.classes.MapViewManagerForm.prototype.mapMarkup = function() {
    var mapInsertAt = jQuery("#" + this.id + "-maps");
    mapInsertAt.empty();
    if (this.baseMapOrder.length == 0) {
        /* No records */
        mapInsertAt.append('<li class="dropdown-header">No base maps or user views available</li>');
    } else {
        /* Dropdown markup */
        var idBase = this.id;        
        jQuery.each(this.baseMapOrder, jQuery.proxy(function(idx, baseKey) {
            var baseData = this.mapData[baseKey];
            mapInsertAt.append(
                '<li data-pk="' + baseKey + '">' + 
                    '<a id="' + idBase + '-' + baseKey + '-map-select" href="JavaScript:void(0)"><strong>' + baseData.title + '</strong></a>' + 
                '</li>'
            );
            if (baseData.views.length > 0) {
                /* List out current user's views of this map */
                mapInsertAt.append(
                    '<li class="dropdown-header">' + 
                        '<div style="margin-left:20px">Your views of ' + baseData.title + '</div>' + 
                    '</li>'
                );                
                jQuery.each(baseData.views, jQuery.proxy(function(vidx, viewId) {
                    mapInsertAt.append(
                        '<li data-pk="' + viewId + '">' + 
                            '<a style="margin-left:20px" id="' + idBase + '-' + viewId + '-map-select" href="JavaScript:void(0)">' + this.mapData[viewId].name + '</a>' + 
                        '</li>'
                    );                    
                }, this));
            }
        }, this));
    }
};

/**
 * Enable/disable button states according to received object
 * @param {Object} disableStates
 */
magic.classes.MapViewManagerForm.prototype.setButtonStates = function(disableStates) {
    if (!disableStates) {
        var selMap = this.getSelection();
        disableStates = {
            "load": !selMap, "bmk": !selMap, "add": false, "edit": !selMap, "del": !selMap
        };
    }
    jQuery.each(this.controls.btn, function(k, v) {
        if (disableStates[k]) {
            v.prop("disabled", true);
        } else {
            v.prop("disabled", false);
        }
    });
};

/**
 * Set the various button/widget handlers
 */
magic.classes.MapViewManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    this.controls = {
        "btn": {
            "load": jQuery("#" + this.id + "-map-load"),
            "bmk": jQuery("#" + this.id + "-map-bmk"),
            "add": jQuery("#" + this.id + "-map-add"),
            "edit": jQuery("#" + this.id + "-map-edit"),
            "del": jQuery("#" + this.id + "-map-del")
        },
        "cb": {
            "newtab": jQuery("#" + this.id + "-map-load-new-tab")
        }       
    };
    
    /* Dropdown layer selection handler */
    form.find("a[id$='-map-select']").off("click").on("click", jQuery.proxy(this.selectMap, this));
    
    /* Load map button */
    this.controls.btn.load.off("click").on("click", jQuery.proxy(function() {                
        window.open(this.selectedMapLoadUrl(), this.controls.cb.newtab.prop("checked") ? "_blank" : "_self"); 
    }, this));
    
    /* Bookmarkable URL button */
    this.controls.btn.bmk.off("click").on("click", jQuery.proxy(function() {             
        bootbox.prompt({
            "size": "small",
            "title": "Bookmarkable URL",
            "value": this.selectedMapLoadUrl(),
            "callback": function(){}
        });
    }, this));
    
    /* New map button */
    this.controls.btn.add.off("click").on("click", jQuery.proxy(function(evt) {
        this.editorPopups.add = new magic.classes.MapEditorPopup({
            id: "map-add-popup-tool",
            caption: "Save current map view",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.edit) {
            this.editorPopups.edit.deactivate();
        }        
        var selMap = this.mapData[this.getSelection()];
        this.editorPopups.add.activate({
            id: "",
            basemap: selMap.basemap || this.getSelection(),
            data: this.mapPayload()
        });            
    }, this));
    
    /* Edit map button */
    this.controls.btn.edit.off("click").on("click", jQuery.proxy(function(evt) { 
        this.editorPopups.edit = new magic.classes.MapEditorPopup({
            id: "map-edit-popup-tool",
            caption: "Edit selected map view",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.add) {
            this.editorPopups.add.deactivate();
        }        
        this.editorPopups.edit.activate(this.mapData[this.getSelection()]);    
    }, this));
    
    /* Delete map button */
    this.controls.btn.del.off("click").on("click", jQuery.proxy(function() {            
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this view?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var selection = this.getSelection(); 
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/usermaps/delete/" + selection,
                    method: "DELETE",
                    beforeSend: function (xhr) {                        
                        xhr.setRequestHeader(
                            jQuery("meta[name='_csrf_header']").attr("content"), 
                            jQuery("meta[name='_csrf']").attr("content")
                        );
                    }
                })
                .done(jQuery.proxy(this.init, this))
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
    }, this));
};

/**
 * Set the selection button caption to the name of the current map
 * @param {jQuery.Event} selection event
 */
magic.classes.MapViewManagerForm.prototype.selectMap = function(evt) {
    var selId = null;
    var targetId = evt.currentTarget.id;
    var elt = jQuery("#" + targetId);
    if (elt.length > 0) {
        selId = elt.closest("li").attr("data-pk");
    }        
    if (selId != null && selId != "") {        
        /* Set the dropdown button caption and visibility indicator */
        var name = this.mapData[selId].basemap ? this.mapData[selId].name : this.mapData[selId].title;
        elt.closest(".dropdown-menu").prev().html(           
            magic.modules.Common.ellipsis(name, 20) + "&nbsp;&nbsp;" + 
            '<span class="caret"></span>'
        );
        /* Record the current selection */
        this.setSelection(selId);
        /* Finally reflect selection in button statuses */ 
        if (!this.mapData[selId].basemap) {
            /* Base maps should not offer edit/delete! */
            this.setButtonStates({
                "load": false, "bmk": false, "add": false, "edit": true, "del": true
            });
        } else {
            /* Allow all actions on this user's own maps */
            this.setButtonStates(null);
        }        
    }
};

/**
 * Set the current map selection
 * @param {String|int} value
 */
magic.classes.MapViewManagerForm.prototype.setSelection = function(value) {
    this.currentSelection = value || null;          
};

/**
 * Set the current map selection
 * @return {String|int}
 */
magic.classes.MapViewManagerForm.prototype.getSelection = function() {
     return(this.currentSelection);    
};

magic.classes.MapViewManagerForm.prototype.saveState = function() {
    this.savedState = {
        "selection": this.getSelection()
    };    
};

magic.classes.MapViewManagerForm.prototype.restoreState = function() {     
    if (this.savedState.selection) {        
        jQuery("#" + this.id + "-" + this.savedState.selection + "-map-select").trigger("click");
        this.clearState();
    }
};

magic.classes.MapViewManagerForm.prototype.clearState = function() {    
    this.savedState = {};
};

magic.classes.MapViewManagerForm.prototype.hasSavedState = function() { 
    if (!jQuery.isEmptyObject(this.savedState)) {
        return(this.savedState.selection);
    }
    return(false);
};

magic.classes.MapViewManagerForm.prototype.formDirty = function() {
    return(this.formEdited);
};

magic.classes.MapViewManagerForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

/**
 * Ensure that any user map only has sharing permissions at least as restricted as its base map
 * @param {String} selection
 */
magic.classes.MapViewManagerForm.prototype.populateAllowedUsage = function(selection) {
    if (this.userMapData[selection]) {
        var baseMap = this.userMapData[selection].basemap;
        if (this.baseMapData[baseMap]) {
            var perms = this.baseMapData[baseMap].sharing;
            var allowedUsage = jQuery("#" + this.id + "-allowed_usage");
            allowedUsage.empty();
            allowedUsage.append(jQuery('<option>', {
                value: "owner",
                text: "no"                
            }));
            if (perms == "public") {
                allowedUsage.append(jQuery('<option>', {
                    value: "public",
                    text: "with everyone"                
                }));
            } else if (perms != "owner") {
                allowedUsage.append(jQuery('<option>', {
                    value: "login",
                    text: "with logged-in users only"                
                }));
            }
            allowedUsage.val(this.userMapData[selection].allowed_usage);
        }
    }
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.MapViewManagerForm.prototype.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.center = this.map.getView().getCenter();
        payload.zoom = parseInt(this.map.getView().getZoom());
        payload.rotation = this.map.getView().getRotation();
        /* Save layer visibility states */
        payload.layers = {};
        this.map.getLayers().forEach(function (layer) {
            if (layer.get("metadata")) {
                var layerId = layer.get("metadata").id;
                if (layerId) {
                    payload.layers[layerId] = {
                        "visibility": layer.getVisible(),
                        "opacity": layer.getOpacity()
                    };
                }
            }
        });
        /* Save group expanded states */
        payload.groups = {};
        jQuery("div[id^='layer-group-panel']").each(function(idx, elt) {
            var groupId = elt.id.replace("layer-group-panel-", "");
            payload.groups[groupId] = jQuery(elt).hasClass("in");
        });
    }
    return(JSON.stringify(payload));
};

/**
 * Return the load URL for the selected map option
 */
magic.classes.MapViewManagerForm.prototype.selectedMapLoadUrl = function() {
    var selId = this.getSelection();
    if (this.mapData[selId].basemap) {
        selId = this.mapData[selId].basemap + "/" + selId;
    }
    return(magic.config.paths.baseurl + "/home/" + selId);   
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


/* Field season selection control */

magic.classes.SeasonSelect = function(containerId, baseId, startYear, endYear, popoverWidth) {
        
    /* Constants */
    this.RECORD_START_YEAR = 1976;
    this.SEASON_START_DAY = "10-01";    /* 1st Oct */
    this.SEASON_END_DAY = "03-31";      /* 31st Mar */
    
    /* div to contain the composite input */
    this.container = jQuery("#" + containerId);
    
    /* Identifier stem for id-ing the inputs */
    this.baseId = baseId || "season";
    
    /* First year option */
    this.startYear = startYear || this.RECORD_START_YEAR;
    
    /* Last year option*/
    this.endYear = endYear || new Date().getFullYear();
    
    /* Popover width in pixels (unused) */
    this.popoverWidth = popoverWidth || 400;
   
    this.container.empty();
    this.container.append(
        '<div class="form-inline">' +             
            '<div class="form-group form-group-sm">' + 
                '<select id="' + this.baseId + '-range" class="form-control" style="width:' + (this.popoverWidth - 30) + 'px">' + 
                    '<option value="any" selected="selected">Any</option>' +
                    '<option value="in">In</option>' + 
                    '<option value="before">Before</option>' + 
                    '<option value="after">After</option>' + 
                    '<option value="between">Between</option>' + 
                '</select>' + 
            '</div>' + 
            '<div class="form-group form-group-sm hidden">' + 
                '<select id="' + this.baseId + '-start" class="form-control">' +                         
                '</select>' + 
            '</div>' + 
            '<div class="form-group form-group-sm hidden">' + 
                '<label for="' + this.baseId + '-end" style="width:50px">&nbsp;&nbsp;and</label>' +
                '<select id="' + this.baseId + '-end" class="form-control">' +                         
                '</select>' + 
            '</div>' +
        '</div>'
    );
    
    /* Fill in options markup */
    this.rangeElt = jQuery("#" + this.baseId + "-range");
    this.startElt = jQuery("#" + this.baseId + "-start");
    this.endElt = jQuery("#" + this.baseId + "-end");  
    
    if (this.startElt.length > 0) {
        this.startElt.empty();       
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            this.startElt.append(opt);
        }
    }
    if (this.endElt.length > 0) {
        this.endElt.empty();
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            this.endElt.append(opt);
        }
    }
    this.rangeElt.change(jQuery.proxy(function(evt) {
        this.rangeChanger(jQuery(evt.currentTarget).val());        
    }, this));    
};

magic.classes.SeasonSelect.prototype.rangeChanger = function(value, start, end) {
    if (value == "any") {
        /* Show only first list */
        this.startElt.closest("div").addClass("hidden");
        this.endElt.closest("div").addClass("hidden"); 
        this.rangeElt.css("width", (this.popoverWidth - 30) + "px");
    } else if (value == "between") {
        /* Change layout to show second list */
        this.rangeElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
        this.startElt.closest("div").removeClass("hidden");
        this.startElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
        this.endElt.closest("div").removeClass("hidden");
        this.endElt.css("width", 0.33*(this.popoverWidth - 80) + "px");            
    } else {
        /* Restore layout to hide second list */
        this.startElt.closest("div").removeClass("hidden");
        this.rangeElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
        this.startElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
        this.endElt.closest("div").addClass("hidden");
    }          
    switch(value) {
        case "between":
            this.startElt.val(start || this.startYear);
            this.endElt.val(end || this.endYear);
            break;
        case "before":
            this.startElt.val(start || this.endYear);
            break;
        case "after":
            this.startElt.val(start || this.startYear);
            break;
        case "in":
            this.startElt.val(start || this.startYear);
            break;
        default:
            this.startElt.val("any");
            break;
    }        
};

magic.classes.SeasonSelect.prototype.payload = function() {
    var payload = {};
    var rangeSelector = this.rangeElt.val();
    var startSeason = this.startElt.val();
    var endSeason = this.endElt.val();      
    switch (rangeSelector) {
        case "before":
            payload["startdate"] = this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY;
            payload["enddate"] = startSeason + "-" + this.SEASON_START_DAY;
            break;
        case "after":
            payload["startdate"] = startSeason + "-" + this.SEASON_END_DAY;
            payload["enddate"] = this.endYear + "-" + this.SEASON_END_DAY;
            break;
        case "between":
            payload["startdate"] = startSeason + "-" + this.SEASON_START_DAY;
            payload["enddate"] = endSeason + "-" + this.SEASON_END_DAY;
            break;
        case "in":
            payload["startdate"] = startSeason + "-" + this.SEASON_START_DAY;
            payload["enddate"] = startSeason + "-" + this.SEASON_END_DAY;
            break;
        default:    /* Any */
            payload["startdate"] = this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY;
            payload["enddate"] = this.endYear + "-" + this.SEASON_END_DAY;
            break;
    }
    return(payload);
};

magic.classes.SeasonSelect.prototype.reset = function () {
    this.rangeElt.val("any");
    this.startElt.closest("div").addClass("hidden");
    this.endElt.closest("div").addClass("hidden"); 
    this.rangeElt.css("width", (this.popoverWidth - 30) + "px");
};

magic.classes.SeasonSelect.prototype.saveState = function () {
    return({
        range: this.rangeElt.val(),
        start: this.startElt.val(),
        end: this.endElt.val()
    });    
};

magic.classes.SeasonSelect.prototype.restoreState = function (state) {
    if (state && !jQuery.isEmptyObject(state)) {
        this.rangeElt.val(state.range);
        this.rangeChanger(state.range, state.start, state.end);
    }    
};

magic.classes.SeasonSelect.prototype.validate = function (errors) {
    var valid = true;
    /* No fields are required - just validate range not wrong way round if 'between' selected */
    var fg = this.rangeElt.closest("div.form-group");
    if (this.rangeElt.val() == "between") {
        valid = this.startElt.val() <= this.endElt.val();
        if (!valid) {
            fg.addClass("has-error");
            errors["Season end date"] = "should be after start date";
        } else {
            fg.removeClass("has-error");
        }
    }
    return(valid);
};

/* Styler, implemented as a Bootstrap popover */

magic.classes.StylerPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "styler-popup-tool",
        styleMode: "default",
        caption: "Edit symbology",
        popoverClass: "styler-popover",
        popoverContentClass: "styler-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {        
        onSave: options.onSave
    }));
    
    this.styleInputs = ["mode", "graphic_marker", "graphic_radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    
    /* This follows the JSON schema for stored styles defined in json/web_map_schema.json */
    this.inputDefaults = {
        "mode": "point",    /* Allowed values: default|file|predefined|point|line|polygon */
        "graphic": {
            "marker": "circle", 
            "radius": 5
        },
        "stroke": {
            "width": 1, 
            "color": "#000000", 
            "opacity": 1.0, 
            "linestyle": "solid" 
        },
        "fill": {
            "color": "#ffffff", 
            "opacity": 1.0
        }        
    };    
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        this.savedState = {};
        this.assignCloseButtonHandler();
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
        this.restoreState();
    }, this));   
    
};

magic.classes.StylerPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.StylerPopup.prototype.constructor = magic.classes.StylerPopup;

magic.classes.StylerPopup.prototype.assignHandlers = function(payload) {   
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("div[id='" + this.id + "-fs'] :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function() {
        this.cleanForm();
        if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
            this.controlCallbacks["onSave"](this.formToPayload());
        }
        this.deactivate(true);
    }, this));
    
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));        
};

magic.classes.StylerPopup.prototype.saveForm = function() {    
    jQuery("#" + this.id + "-go").trigger("click");   
};

magic.classes.StylerPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-fs">' + 
            '<input type="hidden" id="' + this.id + '-mode"></input>' + 
            '<div id="' + this.id + '-point-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-graphic_marker">Marker</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select class="form-control" id="' + this.id + '-graphic_marker" ' +                                         
                                'data-toggle="tooltip" data-placement="right" title="Choose a marker type">' + 
                            '<option value="circle">Circle</option>' + 
                            '<option value="triangle">Triangle</option>' + 
                            '<option value="square">Square</option>' + 
                            '<option value="pentagon">Pentagon</option>' + 
                            '<option value="hexagon">Hexagon</option>' + 
                            '<option value="star">Star</option>' + 
                        '</select>' +
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-graphic_radius">Size</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="number" class="form-control" id="' + this.id + '-graphic_radius" ' + 
                                'placeholder="Radius of graphic marker in pixels" ' +
                                'min="3" max="20" step="0.2" value="5" ' + 
                                'data-toggle="tooltip" data-placement="right" title="Radius of graphic marker in pixels, default 5">' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
            '</div>' + 
            '<div id="' + this.id + '-line-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_width">Outline width</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="number" class="form-control" id="' + this.id + '-stroke_width" ' + 
                               'placeholder="Width of outline in pixels" ' + 
                               'min="0.2" max="20" step="0.2" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Width of outline in pixels, default 1">' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_color">Outline colour</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="color" class="form-control" id="' + this.id + '-stroke_color" ' +                                        
                               'data-toggle="tooltip" data-placement="right" title="Colour of the graphic outline, default black"' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label for="' + this.id + '-stroke_opacity" class="col-sm-4 control-label">Outline opacity</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="number" class="form-control" id="' + this.id + '-stroke_opacity" ' +
                               'placeholder="Outline opacity (0->1)" ' + 
                               'min="0" max="1" step="0.1" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Outline opacity (0.0 = transparent, 1.0 = opaque)">' +                          
                        '</input>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_linestyle">Line style</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select class="form-control" id="' + this.id + '-stroke_linestyle" ' +                                       
                                'data-toggle="tooltip" data-placement="right" title="Type of line">' + 
                            '<option value="solid">Solid</option>'+ 
                            '<option value="dotted">Dotted</option>' +
                            '<option value="dashed">Dashed</option>' +
                            '<option value="dotted-dashed">Dash/dot</option>' + 
                        '</select>' + 
                    '</div>' + 
                '</div>' + 
            '</div>' + 
            '<div id="' + this.id + '-polygon-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-fill_color">Fill colour</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="color" class="form-control" id="' + this.id + '-fill_color" ' +                                        
                               'data-toggle="tooltip" data-placement="right" title="Colour of the graphic interior fill, default black"' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label for="' + this.id + '-fill_opacity" class="col-sm-4 control-label">Fill opacity</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="number" class="form-control" id="' + this.id + '-fill_opacity" ' + 
                               'placeholder="Fill opacity (0->1)" ' + 
                               'min="0" max="1" step="0.1" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Fill opacity (0.0 = transparent, 1.0 = opaque)">' + 
                        '</input>' + 
                    '</div>' + 
                '</div>' +      
            '</div>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save style", "sm", "Save", true) +                                                                              
        '</div>'
    );
};

magic.classes.StylerPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.StylerPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

magic.classes.StylerPopup.prototype.formToPayload = function() {
    var styleDef = jQuery.extend(true, {}, this.inputDefaults);
    jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
        var keys = sip.split("_");
        var styleInputValue = jQuery("#" + this.id + "-" + sip).val();
        if (keys.length == 2) {
            styleDef[keys[0]][keys[1]] = styleInputValue;
        } else {
            styleDef[sip] = styleInputValue;
        }
    }, this));
    return(styleDef);
};

/**
 * Populate the form with the given payload
 * @param {Object} payload
 */
magic.classes.StylerPopup.prototype.payloadToForm = function(payload) {
    payload = this.convertLegacyFormats(payload);
    var fieldsets = {
        "point" : {"point": 1, "line": 1, "polygon": 1}, 
        "line": {"point": 0, "line": 1, "polygon": 0}, 
        "polygon": {"point": 0, "line": 1, "polygon": 1}
    };
    if (fieldsets[payload.mode]) {             
        jQuery.each(fieldsets[payload.mode], jQuery.proxy(function(fsname, fsconf) {
            var fsid = this.id + "-" + fsname + "-fs";
            if (fsconf === 1) {
                jQuery("#" + fsid).removeClass("hidden");
                jQuery("#" + fsid + " :input").prop("disabled", false);
            } else {
                jQuery("#" + fsid).addClass("hidden");
                jQuery("#" + fsid + " :input").prop("disabled", true);
            }
        }, this)); 
        /* Set values of fields from payload object */
        jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
            var keys = sip.split("_");
            var styleInput = jQuery("#" + this.id + "-" + sip);
            if (keys.length == 2) {
                if (payload[keys[0]] && payload[keys[0]][keys[1]]) {
                    styleInput.val(payload[keys[0]][keys[1]]);
                } else {
                    styleInput.val(this.inputDefaults[keys[0]][keys[1]]);
                }
            } else {
                styleInput.val(payload[sip]);
            }
        }, this));   
    }
};

/**
 * Convert a populator payload from legacy formats to the JSON schema version
 * Chief format used was:
 * {
 *     "mode": <default|file|predefined|point|line|polygon>,
 *     "predefined": <canned_style_name>,
 *     "marker": <circle|triangle|square|pentagon|hexagon|star>,
 *     "radius": <marker_radius>,
 *     "stroke_width": <outline_width>,
 *     "stroke_opacity": <outline_opacity>,
 *     "stroke_color": <outline_colour>,
 *     "stroke_linestyle": <solid|dotted|dashed|dotted-dashed>,
 *     "fill_color": <interior_colour>,
 *     "fill_opacity": <interior_opacity>
 * }
 * @param {Object} payload
 * @return {Object}
 */
magic.classes.StylerPopup.prototype.convertLegacyFormats = function(payload) {
    if (!payload || jQuery.isEmptyObject(payload)) {
        /* Null or empty, so use the defaults */
        return(jQuery.extend(true, {}, this.inputDefaults));
    }
    if (typeof payload == "string") {
        try {
            payload = JSON.parse(payload);
        } catch(e) {
            return(jQuery.extend(true, {}, this.inputDefaults));
        }
    }
    if (payload.mode == "predefined" || payload.mode == "default") {
        return(payload);
    }
    if (payload.graphic || payload.stroke || payload.fill) {
        /* Deemed to be in the up-to-date format, so leave it alone */
        return(payload);
    }
    /* Must be the legacy format */
    if (payload.stroke && payload.stroke.style) {
        /* 'linestyle' was erroneously called 'style' for a while */
        payload.stroke.linestyle = payload.stroke.style;
        delete payload.stroke.style;
    }
    return({
        "mode": payload.mode,
        "graphic": {
            "marker": payload.marker || this.inputDefaults.graphic.marker,
            "radius": payload.radius || this.inputDefaults.graphic.radius
        },
        "stroke": {
            "width": payload.stroke_width || this.inputDefaults.stroke.width,
            "color": payload.stroke_color || this.inputDefaults.stroke.color,
            "linestyle": payload.stroke_linestyle || this.inputDefaults.stroke.linestyle,
            "opacity": payload.stroke_opacity || this.inputDefaults.stroke.opacity
        },
        "fill": {
            "color": payload.fill_color || this.inputDefaults.fill.color,
            "opacity": payload.fill_opacity || this.inputDefaults.fill.opacity
        }        
    });
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
/* User uploaded layer manager */

magic.classes.UserLayerManagerForm = function(options) {
    
    /* API options */    
    this.id = options.id || "layer-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;    
   
    /* Styler popup tool */
    this.stylerPopup = null;
    
    /* Layer editor popup tools */
    this.editorPopups = {
        "add": null,
        "edit": null
    };
    
    this.controls = {
        "user": {},
        "community": {}
    };
    
    /* zIndex of the top of the WMS stack in the map, insertion point for new layers */
    this.zIndexWmsStack = -1;    
    
    /* Data from a saved map indicating visibility, transparency etc of user layers */
    this.userPayloadConfig = magic.runtime.map_context.userdata ? (magic.runtime.map_context.userdata.layers || {}) : {};
    
    /* Layer data keyed by id */
    this.userLayerData = {}; 
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    this.clearState();
    
    /* Current selection tracker */
    this.currentSelection = null;
    this.setSelection();
    
    /* First time initialise flag, to allow initial layer visibility states from a user map payload to be applied once only */
    this.initialisedLayers = false;
    
};

magic.classes.UserLayerManagerForm.prototype.init = function() {
    
    this.editorPopups = {
        "add": null,
        "edit": null
    };
   
    /* Get top of WMS stack */
    this.zIndexWmsStack = this.getWmsStackTop(this.map);  
    
    /* Load the available user layers from server */
    this.fetchLayers(jQuery.proxy(function(uldata) {          
        /* Record the layer data, and create any visible layers */
        var vis;
        jQuery.each(uldata, jQuery.proxy(function(idx, ul) {
            if (!this.initialisedLayers) {
                /* Apply one-off visibility from user map payload */
                vis = this.userPayloadConfig[ul.id] ? this.userPayloadConfig[ul.id].visibility : false;
            } 
            this.provisionLayer(ul, vis, this.initialisedLayers);            
        }, this));          
        /* Tabulate the layer markup */
        this.layerMarkup();
        this.assignHandlers();        
        if (this.hasSavedState()) {
            /* Restore saved state */
            this.restoreState();   
        } else {
            /* Set the default button states */
            this.setButtonStates(null);      
        }
    }, this));
    
    /* Flag we have applied the user map payload data */
    this.initialisedLayers = true;
};

/**
 * Refresh the lists of layers after deletion
 */
magic.classes.UserLayerManagerForm.prototype.refreshLayerLists = function() {   
    this.zIndexWmsStack = this.getWmsStackTop(this.map);          
    this.layerMarkup();
    this.assignHandlers();
};

/**
 * Enable/disable button states according to received object
 * @param {Object} disableStates
 */
magic.classes.UserLayerManagerForm.prototype.setButtonStates = function(disableStates) {
    if (!disableStates) {
        var selUser = this.getSelection("user");
        var selComm = this.getSelection("community");
        disableStates = {
            "user": {
                "legend": selUser == null, "add": false, "edit": selUser == null, "del": selUser == null, "actions": selUser == null
            },
            "community": {
                "legend": selComm == null, "actions": selComm == null
            }
        };
    }
    for (var lt in this.controls) {
        jQuery.each(this.controls[lt].btn, function(k, v) {
            if (disableStates[lt][k]) {
                v.prop("disabled", true);
            } else {
                v.prop("disabled", false);
            }
        });
    }
};

magic.classes.UserLayerManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    this.controls = {
        "user": {
            "btn": {
                "legend": jQuery("#" + this.id + "-user-layer-legend"),
                "add": jQuery("#" + this.id + "-user-layer-add"),
                "edit": jQuery("#" + this.id + "-user-layer-edit"),
                "del": jQuery("#" + this.id + "-user-layer-del"),
                "actions": jQuery("#" + this.id + "-user-layer-actions")
            },
            "dd": {
                "ztl": jQuery("#" + this.id + "-user-layer-ztl"),
                "wms": jQuery("#" + this.id + "-user-layer-wms"),
                "url": jQuery("#" + this.id + "-user-layer-url"),
                "dld": jQuery("#" + this.id + "-user-layer-dld")
            }
        },
        "community": {
            "btn": {
                "legend": jQuery("#" + this.id + "-community-layer-legend"),
                "actions": jQuery("#" + this.id + "-community-layer-actions")
            },
            "dd": {
                "ztl": jQuery("#" + this.id + "-community-layer-ztl"),
                "wms": jQuery("#" + this.id + "-community-layer-wms"),
                "url": jQuery("#" + this.id + "-community-layer-url"),
                "dld": jQuery("#" + this.id + "-community-layer-dld")                
            }
        }
    };
    
    for (var lt in this.controls) {
                
        /* Dropdown layer selection handler */
        form.find("a[id$='-" + lt + "-layer-select']").off("click").on("click", {type: lt}, jQuery.proxy(this.selectLayer, this));
        
        /* Layer visibility checkboxes change handler */
        form.find("[id$='-" + lt + "-layer-vis']").off("change").on("change", {type: lt}, jQuery.proxy(this.selectLayer, this));               
        
        /* Zoom to layer link handlers */
        this.controls[lt].dd.ztl.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {  
            var selection = this.getSelection(evt.data.type);
            if (selection) {
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/userlayers/" + selection + "/extent", 
                    method: "GET",
                    dataType: "json",
                    contentType: "application/json"
                }).done(jQuery.proxy(function(data) {
                    if (!jQuery.isArray(data)) {
                        data = JSON.parse(data);
                    }
                    var projExtent = magic.modules.GeoUtils.extentFromWgs84Extent(data);
                    if (projExtent) {
                        this.map.getView().fit(projExtent, this.map.getSize());
                    }
                }, this));
            }
        }, this));
        
        /* WMS URL links */
        this.controls[lt].dd.wms.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {             
            bootbox.prompt({
                "title": "WMS URL",
                "value": this.layerWmsUrl(evt.data.type),
                "callback": function(){}
            });
        }, this));

        /* Direct data URL link */
        this.controls[lt].dd.url.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {             
            bootbox.prompt({
                "title": "Direct data feed URL",
                "value": this.layerDirectUrl(evt.data.type),
                "callback": function(){}
            });
        }, this));        

        /* Data download link */
        this.controls[lt].dd.dld.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {
            window.open(this.layerDirectUrl(evt.data.type));       
        }, this));
    }
    
     /* Legend button handlers */
    this.addLegendHoverHandler("user");
    this.addLegendHoverHandler("community");    
    
    /* New user layer button */
    this.controls.user.btn.add.off("click").on("click", jQuery.proxy(function(evt) {        
        this.editorPopups.add = new magic.classes.LayerEditorPopup({
            id: "layer-add-popup-tool",
            caption: "Add new layer",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.edit) {
            this.editorPopups.edit.deactivate();
        }        
        this.editorPopups.add.activate({});
    }, this));
    
    /* Edit user layer button */
    this.controls.user.btn.edit.off("click").on("click", jQuery.proxy(function(evt) {        
        this.editorPopups.edit = new magic.classes.LayerEditorPopup({
            id: "layer-edit-popup-tool",
            caption: "Edit existing layer data",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.add) {
            this.editorPopups.add.deactivate();
        }        
        this.editorPopups.edit.activate(this.userLayerData[this.currentSelection.user]);
    }, this));
    
    /* Delete user layer button */
    this.controls.user.btn.del.off("click").on("click", jQuery.proxy(function(evt) {            
        evt.preventDefault();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var id = this.currentSelection.user;
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/userlayers/delete/" + id,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                        var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(jQuery.proxy(function(uldata) {
                    /* Now delete the corresponding layer and data */
                    if (this.userLayerData[id] && this.userLayerData[id].olLayer) {
                        this.map.removeLayer(this.userLayerData[id].olLayer);                        
                    }
                    /* Reload the layers */
                    delete this.userLayerData[id];
                    this.refreshLayerLists();
                    /* Reset the dropdown button caption and visibility indicator */
                    jQuery("#" + this.id + "-user-layer-select").html('Select a layer&nbsp;&nbsp;<span class="caret"></span>');                       
                    /* Reset the current selection and reset button statuses */
                    this.setSelection("user", null);
                    this.setButtonStates(null);
                }, this))
                .fail(function (xhr) {
                    var msg;
                    try {
                        msg = JSON.parse(xhr.responseText)["detail"];
                    } catch(e) {
                        msg = xhr.responseText;
                    }
                    magic.modules.Common.showAlertModal("Failed to delete user layer - details : " + msg, "warning");                    
                });                   
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }                            
        }, this));               
    }, this));  
    
};

magic.classes.UserLayerManagerForm.prototype.addLegendHoverHandler = function(lt) {
    this.controls[lt].btn.legend.popover("destroy");
    this.controls[lt].btn.legend.popover({
        container: "body",
        html: true,
        trigger: "hover",
        content: jQuery.proxy(function(evt) {
            var cont = "No legend available";
            var selId = this.currentSelection[lt];
            if (selId && this.userLayerData[selId]) {
                var md = this.userLayerData[selId];
                var cacheBuster = "&buster=" + new Date().getTime();
                var legendUrl = md.service + 
                    "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20&styles=&layer=" + md.layer + 
                    "&legend_options=fontName:Bitstream Vera Sans Mono;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180" + cacheBuster;
                cont = '<img src="' + legendUrl + '" alt="Legend"></img>';
            }        
            return('<div style="width:120px">' + cont + '</div>');
        }, this)
    });
};

/**
 *  Scan the user layer data, sort into lists of user and community layers, ordered by caption 
 */
magic.classes.UserLayerManagerForm.prototype.layerMarkup = function() {
    var layers = {
        "user": [],
        "community": []
    };
    jQuery.each(this.userLayerData, function(layerId, layerData) {
        if (layerData.owner == magic.runtime.map_context.username) {
            /* User layer */
            layers.user.push(layerData);
        } else {
            /* Community layer */
            layers.community.push(layerData);
        }
    });
    /* Alphabetically sort both arrays in order of caption */
    layers.user.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    layers.community.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    
    var layerTypes = ["user", "community"];
    for (var i = 0; i < layerTypes.length; i++) {
        var lt = layerTypes[i];
        var layerInsertAt = jQuery("#" + this.id + "-" + lt + "-layers");
        layerInsertAt.empty();
        if (layers[lt].length == 0) {
            /* No records */
            layerInsertAt.append('<li class="dropdown-header">There are currently no user uploaded layers</li>');
        } else {
            /* Dropdown markup */
            var idBase = this.id;
            layerInsertAt.append(
                '<li class="dropdown-header">' + 
                    '<div style="display:inline-block;width:20px">Vis</div>' + 
                    '<div style="display:inline-block;width:100px">Owner</div>' + 
                    '<div style="display:inline-block;width:200px">Name</div>' + 
                '</li>'
            );
            jQuery.each(layers[lt], function(idx, ul) {
                layerInsertAt.append(
                    '<li data-pk="' + ul.id + '">' + 
                        '<a id="' + idBase + '-' + ul.id + '-' + lt + '-layer-select" href="JavaScript:void(0)">' + 
                            '<div style="display:inline-block;width:20px">' + 
                                '<input id="' + idBase + '-' + ul.id + '-' + lt + '-layer-vis" type="checkbox"' + 
                                    (ul.olLayer != null && ul.olLayer.getVisible() ? ' checked="checked"' : '') + '>' + 
                                '</input>' +
                            '</div>' + 
                            '<div style="display:inline-block;width:100px">' + 
                                ul.owner + 
                            '</div>' + 
                            '<div style="display:inline-block;width:200px" data-toggle="tooltip" data-html="true" data-placement="bottom" ' + 
                                'title="' + ul.caption + '<br>' + ul.description + '<br>Modified on : ' + magic.modules.Common.dateFormat(ul.modified_date, "dmy") + '">' + 
                                magic.modules.Common.ellipsis(ul.caption, 30) + 
                            '</div>' + 
                        '</a>' + 
                    '</li>'
                );
            });
        }
    }
};

magic.classes.UserLayerManagerForm.prototype.markup = function() {
    var layerTypes = ["user", "community"];
    var markup = '<form id="' + this.id + '-form" class="form-horizontal" role="form" enctype="multipart/form-data" style="margin-top:10px">';
    for (var i = 0; i < layerTypes.length; i++) {
        var lt = layerTypes[i];
        markup += 
            '<div class="form-group form-group-sm col-sm-12"><strong>' + (lt == "user" ? 'My' : 'Community') + ' uploaded layers</strong></div>' +
            '<div class="btn-toolbar" style="margin-bottom:10px">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Select a layer&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-' + lt + '-layers" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-legend" class="btn btn-sm btn-info" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom" >' + 
                        '<i style="pointer-events:none" title="Legend for selected layer" class="fa fa-list"></i>' + 
                    '</button>' +
                    (lt == "user" ? 
                    '<button id="' + this.id + '-' + lt + '-layer-add" class="btn btn-sm btn-primary" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Add a new layer" class="fa fa-star"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.id + '-' + lt + '-layer-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Edit selected layer data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-' + lt + '-layer-del">' +
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Delete selected layer" class="fa fa-trash"></i>' + 
                    '</button>' : '') + 
                '</div>' + 
                '<div class="btn-group dropdown" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-actions" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" data-container="body">' + 
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Further actions" class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul class="dropdown-menu dropdown-menu-right" style="overflow:auto">' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                        '<li role="separator" class="divider"></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-dld" href="Javascript:void(0)">Download data</a></li>' + 
                    '</ul>' + 
                '</div>' + 
            '</div>';
    }
    markup += '</form>';
    return(markup);
};

/**
 * Set the current selection for either list
 * @param {String} type user|community
 * @param {String|int} value
 */
magic.classes.UserLayerManagerForm.prototype.setSelection = function(type, value) {
     if (!type) {
         this.currentSelection = {
             "user": null,
             "community": null
         };
     } else {
         this.currentSelection[type] = value;
     }
};

/**
 * Set the current selection for either list
 * @param {String} type user|community
 * @return {String|int}
 */
magic.classes.UserLayerManagerForm.prototype.getSelection = function(type) {
     return(this.currentSelection[type]);    
};

/**
 * Set the selection button caption to the name of the currently focussed layer, and indicate visibility on the map
 * @param {jQuery.Event} selection event
 */
magic.classes.UserLayerManagerForm.prototype.selectLayer = function(evt) {
    var selId = null;
    var lt = evt.data.type;
    var targetId = evt.currentTarget.id;
    var elt = jQuery("#" + targetId);
    if (elt.length > 0) {
        selId = elt.closest("li").attr("data-pk");
    }        
    if (selId != null && selId != "") {
        var isChecked = false;        
        if (elt.attr("type") == "checkbox") {
            /* Checkbox clicked */
            isChecked = elt.prop("checked");            
        } else {
            /* Link row - find checkbox */
            isChecked = elt.find("input[type='checkbox']").prop("checked");
        }
        this.provisionLayer(this.userLayerData[selId], isChecked, false);
        /* Enable/disable the zoom to layer link for this layer according to checkbox state */
        if (isChecked) {
            this.controls[lt].dd.ztl.closest("li").prop("disabled", false);
        } else {
            this.controls[lt].dd.ztl.closest("li").prop("disabled", true);
        }
        /* Set the dropdown button caption and visibility indicator */
        elt.closest(".dropdown-menu").prev().html(
            '<i class="fa fa-eye' + (isChecked ? "" : "-slash") + '" style="font-size:16px"></i>&nbsp;&nbsp;' + 
            magic.modules.Common.ellipsis(this.userLayerData[selId].caption, 20) + "&nbsp;&nbsp;" + 
            '<span class="caret"></span>'
        );
        /* Record the current selection */
        this.setSelection(lt, selId);
        /* Finally reflect selection in button statuses */        
        this.setButtonStates(null);
        
    }
};

magic.classes.UserLayerManagerForm.prototype.saveState = function() {    
    this.savedState = {
        "user": {
            "selection": this.currentSelection.user || null
        },
        "community": {
            "selection": this.currentSelection.community || null
        }        
    };   
};

magic.classes.UserLayerManagerForm.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {        
        var userSel = this.savedState.user.selection;
        var commSel = this.savedState.community.selection;
        this.clearState();
        if (userSel != null) {
            jQuery("#" + this.id + "-" + userSel + "-user-layer-select").trigger("click");
        }
        if (commSel != null) {
            jQuery("#" + this.id + "-" + commSel + "-community-layer-select").trigger("click");
        }        
    }
};

magic.classes.UserLayerManagerForm.prototype.clearState = function() {    
    this.savedState = {
        "user": {
            "selection": null
        },
        "community": {
            "selection": null
        }        
    };    
};

magic.classes.UserLayerManagerForm.prototype.hasSavedState = function() { 
    if (!jQuery.isEmptyObject(this.savedState)) {
        return(
            (this.savedState.user && this.savedState.user.selection) ||
            (this.savedState.community && this.savedState.community.selection)
        );
    }
    return(false);
};

/**
 * Fetch data on all uploaded layers user has access to
 * @param {Function} cb
 */
magic.classes.UserLayerManagerForm.prototype.fetchLayers = function(cb) {    
    /* Load the available user layers */
    jQuery.ajax({
        url: magic.config.paths.baseurl + "/userlayers/data", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    }).done(jQuery.proxy(function(uldata) {
        /* Alphabetical order of caption */
        uldata.sort(function(a, b) {
            return(a.caption.localeCompare(b.caption));
        });
        cb(uldata);
    }, this)).fail(function() {
        magic.modules.Common.showAlertModal("Failed to load available user layers", "error");
    });
};

/**
 * Lazily create layer from fetched data if required
 * @param {Object} layerData
 * @param {boolean} visible
 * @param {boolean} inheritVis don't alter visibility of a layer which already exists on the map
 * @return {ol.Layer}
 */
magic.classes.UserLayerManagerForm.prototype.provisionLayer = function(layerData, visible, inheritVis) {     
    var olLayer = null;    
    var exData = this.userLayerData[layerData.id];
    var exLayer = exData ? exData.olLayer : null;    
    if (exLayer == null) {
        /* Check layers on map for the id */        
        this.map.getLayers().forEach(function (layer) {
            var md = layer.get("metadata");                        
            if (md && md.id == layerData.id) {
                exLayer = layer;
            }
        });
    }
    if (exLayer == null) {
        if (visible) {
            /* We create the layer now */
            var defaultNodeAttrs = {
                legend_graphic: null,
                refresh_rate: 0,
                min_scale: 1,
                max_scale: 50000000,
                opacity: 1.0,
                is_visible: false,
                is_interactive: true,
                is_filterable: false        
            };
            var defaultSourceAttrs = {
                style_name: null,
                is_base: false,
                is_singletile: false,
                is_dem: false,
                is_time_dependent: false
            };    
            var styledef = layerData.styledef;
            if (typeof styledef === "string") {
                styledef = JSON.parse(styledef);
            }
            var geomType = (styledef["mode"] == "file" || styledef["mode"] == "default") ? "unknown" : styledef["mode"];
            var nd = jQuery.extend({}, {
                id: layerData.id,
                name: layerData.caption,
                geom_type: geomType,
                attribute_map: null
            }, defaultNodeAttrs);
            nd.source = jQuery.extend({}, {
                wms_source: layerData.service, 
                feature_name: layerData.layer
            }, defaultSourceAttrs);
            var proj = this.map.getView().getProjection(); 
            var resolutions = magic.runtime.map.getView().getResolutions();
            var wmsSource = new ol.source.TileWMS({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": "",
                    "TRANSPARENT": true,
                    "CRS": proj.getCode(),
                    "SRS": proj.getCode(),
                    "VERSION": "1.3.0",
                    "TILED": true
                },
                tileGrid: new ol.tilegrid.TileGrid({
                    resolutions: resolutions,
                    origin: proj.getExtent().slice(0, 2)
                }),
                projection: proj
            });
            olLayer = new ol.layer.Tile({
                name: nd.name,
                visible: visible,
                opacity: this.userPayloadConfig[layerData.id] ? this.userPayloadConfig[layerData.id].opacity : 1.0,
                minResolution: resolutions[resolutions.length-1],
                maxResolution: resolutions[0]+1,
                metadata: nd,
                source: wmsSource
            });
            nd.layer = olLayer;    
            nd.layer.setZIndex(this.zIndexWmsStack++);
            this.map.addLayer(olLayer);
        }
    } else {
        /* Layer already exists, do a refresh in case the layer name has changed */
        olLayer = exLayer;
        if (jQuery.isFunction(olLayer.getSource().updateParams)) {
            olLayer.getSource().updateParams(jQuery.extend({}, 
                olLayer.getSource().getParams(), 
                {"LAYERS": layerData.layer, "buster": new Date().getTime()}
            ));
        }
        if (!inheritVis) {
            olLayer.setVisible(visible);
        }
    }
    layerData.olLayer = olLayer;
    this.userLayerData[layerData.id] = layerData;
    return(olLayer);
};

/**
 * Return the WMS URL for the selected layer
 * @param {String} type user|community
 * @return {String}
 */
magic.classes.UserLayerManagerForm.prototype.layerWmsUrl = function(type) {
    var selection = this.getSelection(type);
    if (selection && this.userLayerData[selection]) {
        var ld = this.userLayerData[selection];
        return(magic.config.paths.baseurl + "/ogc/user/wms?SERVICE=WMS&" + 
            "VERSION=1.3.0&" + 
            "REQUEST=GetMap&" + 
            "FORMAT=image/png&" + 
            "TRANSPARENT=true&" + 
            "LAYERS=" + ld.layer + "&" + 
            "CRS=" + this.map.getView().getProjection().getCode() + "&" + 
            "SRS=" + this.map.getView().getProjection().getCode() + "&" + 
            "TILED=true&" + 
            "WIDTH=1000&" + 
            "HEIGHT=1000&" + 
            "STYLES=&" + 
            "BBOX=" + magic.runtime.map.getView().getProjection().getExtent().join(","));
    } else {
        return("");
    }
};

/**
 * Return the direct data URL for the selected layer
 * @param {String} type user|community
 * @return {String}
 */
magic.classes.UserLayerManagerForm.prototype.layerDirectUrl = function(type) {
    var selection = this.getSelection(type);
    return(selection ? magic.config.paths.baseurl + "/userlayers/" + selection + "/data" : "");
};

/**
 * Get top of WMS layer stack in map
 * @return {Number|zi}
 */
magic.classes.UserLayerManagerForm.prototype.getWmsStackTop = function(map) {
    var maxStack = -1;
    map.getLayers().forEach(function (layer) {
        var zi = layer.getZIndex();
        if (zi < 400 && zi > maxStack) {
            maxStack = zi;
        }
    });
    return(maxStack);
};

/**
 * Zap any open pop-ups (used when changing tab)
 * @param {boolean} quiet suppress warnings about unsaved edits
 * @param {boolean} deactivate true if deactivating rather than simply minimising
 */
magic.classes.UserLayerManagerForm.prototype.tidyUp = function(quiet, deactivate) {
    quiet = quiet || false;
    deactivate = deactivate || false;
    if (this.editorPopups.edit && this.editorPopups.edit.isActive()) {
        this.editorPopups.edit.deactivate(quiet);
        this.editorPopups.edit = null;
    }
    if (this.editorPopups.add && this.editorPopups.add.isActive()) {
        this.editorPopups.add.deactivate(quiet);
        this.editorPopups.add = null;
    }
    if (deactivate) {
        /* Turn off all layers and reset selections */
        jQuery.each(this.userLayerData, function(layerId, layerData) {
            if (layerData.olLayer) {
                layerData.olLayer.setVisible(false);
            }
        });
        this.setSelection();
    }
};

/* User preferences form class */

magic.classes.UserPreferencesForm = function(options) {   
    
    /* API options */    
    this.id = options.id || "unit-prefs"; 
    
    /* Internal properties */
    this.inputBaseNames = ["distance", "area", "elevation", "coordinates", "dates"];
    
    /* Enclosing form */
    this.mgrForm  = jQuery("#" + this.id + "-form"); 
    
    /* Form changed */
    this.formEdited = false;           
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
};

magic.classes.UserPreferencesForm.prototype.init = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-form :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Set save button handler */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
        var formdata = this.formToPayload();
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/prefs/set", 
            data: JSON.stringify(formdata), 
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            headers: {
                "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
            },
            success: jQuery.proxy(function(data) {
                magic.modules.Common.buttonClickFeedback(this.id, data.status < 400, data.detail);
                if (data.status < 400) {
                    magic.runtime.preferences = jQuery.extend(magic.runtime.preferences, formdata);
                    this.formEdited = false;                    
                }                
            }, this),
            fail: jQuery.proxy(function(xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                magic.modules.Common.showAlertModal("Failed to save preferences - details : " + msg, "warning");                       
            }, this)
        });
    }, this));
    
    /* Populate form with current preferences */
    this.payloadToForm(magic.runtime.preferences);
    
    /* Restore state if present */
    this.restoreState();
};

magic.classes.UserPreferencesForm.prototype.markup = function() {
    return(        
        '<form id="' + this.id + '-form" class="form-horizontal" style="margin-top:10px">' +            
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-distance">Length</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-distance" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.DISTANCE_UNITS, magic.runtime.preferences.distance) + 
                    '</select>' +                            
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-area">Area</label>' +
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-area" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.AREA_UNITS, magic.runtime.preferences.area) +                                                       
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-elevation">Height</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-elevation" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.ELEVATION_UNITS, magic.runtime.preferences.elevation) +                                                       
                    '</select>' +    
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-coordinates">Coords</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-coordinates" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.COORDINATE_FORMATS, magic.runtime.preferences.coordinates) +                                                       
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-dates">Dates</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-dates" class="form-control">' +
                        this.getOptions([
                            ["dmy", "dd-mm-yyyy"],
                            ["ymd", "yyyy-mm-dd"]
                        ], magic.runtime.preferences.dates) +                                                       
                    '</select>' +
                '</div>' + 
            '</div>' +
            magic.modules.Common.buttonFeedbackSet(this.id, "Set preferences", "sm", "Save", false) +                   
        '</form>'         
    );
};

magic.classes.UserPreferencesForm.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

magic.classes.UserPreferencesForm.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.UserPreferencesForm.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

magic.classes.UserPreferencesForm.prototype.clearState = function() {
    this.savedState = {};
};

magic.classes.UserPreferencesForm.prototype.formDirty = function() {
    return(this.formEdited);
};

magic.classes.UserPreferencesForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

magic.classes.UserPreferencesForm.prototype.formToPayload = function() {
    var formdata = {};
    jQuery.each(this.inputBaseNames, jQuery.proxy(function(idx, elt) {
        formdata[elt] = jQuery("#" + this.id + "-" + elt).val();
    }, this));
    return(formdata);
};

magic.classes.UserPreferencesForm.prototype.payloadToForm = function(formdata) {
    jQuery.each(this.inputBaseNames, jQuery.proxy(function(idx, elt) {
        jQuery("#" + this.id + "-" + elt).val(formdata[elt]);
    }, this));
};

/**
 * Create <option> html from arrays, setting selected item 
 * @param {Array} valText
 * @param {string} selected
 */
magic.classes.UserPreferencesForm.prototype.getOptions = function(valText, selected) {
    var html = "";
    if (valText) {
        for (var i = 0; i < valText.length; i++) {
            var selHtml = valText[i][0] == selected ? " selected" : "";
            html += '<option value="' + valText[i][0] + '"' + selHtml + '>' + valText[i][1] + '</option>';
        }   
    }
    return(html);
};
/* Download repository control */

magic.classes.DownloadRepo = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "download-repo";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    if (magic.runtime.map_context.allowed_download != "nobody" && magic.runtime.map_context.repository) {
        this.target.on("click", function(evt) {
            evt.stopPropagation();
            window.open(magic.runtime.map_context.repository, "_blank");
        });
    } else {
        this.target.closest("li").hide();
    }
};

magic.classes.DownloadRepo.prototype.interactsMap = function () {
    return(false);
};


/* Feedback form */

magic.classes.Feedback = function(options) {
        
    options = jQuery.extend({}, {
        id: "feedback-tool",
        layername: null,
        caption: "Feedback on service or data issues",
        popoverClass: "feedback-tool-popover",
        popoverContentClass: "feedback-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(function() {
            this.target.popover("hide");
        }, this), 
        onMinimise: jQuery.proxy(function() {
            this.saveState();
        }, this)
    });
    
    /* Form input names */
    this.inputs = ["trackerId", "subject", "description", "reporter"];
    
    /* Saved state */
    this.savedState = {};
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
        }   
    }, this));
};
    
magic.classes.Feedback.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Feedback.prototype.constructor = magic.classes.Feedback;
    
magic.classes.Feedback.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-feedback-form" class="form" role="form">' +
                '<input type="hidden" id="' + this.id + '-payload"></input>' + 
                '<div class="panel">' +
                    '<div class="panel-body alert-info">' + 
                    'Your chance to improve service quality by reporting data or interface problems. Give a short description below e.g. ' +
                    '&quot;Contours appear in the sea&quot; or &quot;Failed to find a certain place-name&quot; and configure the map to show the issue.  ' + 
                    'The complete state of the map will be saved automatically' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-trackerId">This is an issue with</label>' + 
                    '<select name="trackerId" id="' + this.id + '-trackerId" class="form-control" ' +
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="What type of problem is this?">' + 
                        '<option value="4">Data</option>' + 
                        '<option value="1">Interface</option>' + 
                    '</select>' +                            
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-subject">One line summary</label>' + 
                    '<input type="text" name="subject" id="' + this.id + '-subject" class="form-control" ' + 
                        'placeholder="Short outline of the problem" maxlength="150" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Short problem description (required)" ' + 
                        'required="required">' +
                    '</input>' +    
                '</div>' +  
                '<div class="form-group">' +
                    '<label for="' + this.id + '-description">Detailed description</label>' +
                    '<textarea name="description" id="' + this.id + '-description" class="form-control" ' + 
                        'style="height:5em !important" ' + 
                        'placeholder="More details about the problem" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Longer description of the problem (required)" ' + 
                        'required="required">' +                                           
                    '</textarea>' + 
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-reporter">Your email address</label>' + 
                    '<input type="email" name="reporter" id="' + this.id + '-reporter" class="form-control" ' + 
                        'placeholder="Not used for any other purpose" maxlength="150" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Your email (required - used to communicate with you about this issue and for no other purpose)" ' + 
                        'required="required">' +
                    '</input>' +    
                '</div>' +                            
                '<div>' +
                    '<button id="' + this.id + '-go" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Send feedback">' + 
                        '<span class="fa fa-paper-plane"></span>' + 
                    '</button>' +                        
                '</div>' +                     
            '</form>' +               
        '</div>'
    );
};

magic.classes.Feedback.prototype.onActivateHandler = function() {
   
    /* Set send button handler */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
        jQuery(evt.currentTarget).tooltip("hide");  /* Get rid of annoying persistent tooltip - not sure why... */        
        if (this.validate()) {  
            var formdata = this.formToPayload();
            formdata.description = JSON.stringify(jQuery.extend({}, this.mapPayload(), {"description": formdata.description}));
            var jqXhr = jQuery.ajax({
                url: magic.config.paths.baseurl + "/feedback",
                method: "POST",
                processData: false,
                data: JSON.stringify(formdata),
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                }
            });
            jqXhr.done(jQuery.proxy(function(response) {                        
                bootbox.alert(
                    '<div class="alert alert-info" style="margin-bottom:0">' + 
                        '<p>Successfully sent your feedback</p>' + 
                    '</div>'
                );
                this.deactivate();
            }, this));
            jqXhr.fail(function(xhr) {
                var detail = JSON.parse(xhr.responseText)["detail"];
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Error occurred - details below:</p>' + 
                        '<p>' + detail + '</p>' + 
                    '</div>'
                );
            });                
        } else {
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-bottom:0">' + 
                    '<p>Please correct the errors marked in your input</p>' + 
                '</div>'
            );
        }
    }, this));       
};

magic.classes.Feedback.prototype.interactsMap = function () {
    return(false);
};

magic.classes.Feedback.prototype.saveState = function() {    
    this.savedState = this.formToPayload();
};

magic.classes.Feedback.prototype.restoreState = function() {
    this.payloadToForm(this.savedState);
    this.savedState = {};
};

magic.classes.Feedback.prototype.payloadToForm = function(payload) {
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-" + ip).val(payload[ip]);
    }, this));
};

magic.classes.Feedback.prototype.formToPayload = function() {
    var payload = {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        payload[ip] = jQuery("#" + this.id + "-" + ip).val();
    }, this));
    return(payload);
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.Feedback.prototype.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.submission = "automatic";
        payload.center = this.map.getView().getCenter();
        payload.zoom = this.map.getView().getZoom();
        /* Save layer visibility states */
        payload.visible = {};
        magic.runtime.map.getLayers().forEach(function (layer) {
            payload.visible[layer.get("name")] = layer.getVisible();
        });
        /* Save map URL */
        payload.mapUrl = window.location.href;
        /* Save user's browser and OS details */
        payload.userAgent = navigator.userAgent;
    }
    return(payload);
};

magic.classes.Feedback.prototype.validate = function() {
    var ok = true;
    jQuery("#" + this.id + "-feedback-form")[0].checkValidity();
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        var fip = jQuery("#" + this.id + "-" + ip);
        var fg = fip.closest("div.form-group");
        var fstate = fip.prop("validity");
        if (fstate.valid) {            
            fg.removeClass("has-error").addClass("has-success");
        } else {
            ok = false;
            fg.removeClass("has-success").addClass("has-error");
        }
    }, this));
    return(ok);
};

/* Geosearch, implemented as a Bootstrap popover */

magic.classes.Geosearch = function (options) {
    
    options = jQuery.extend({}, {
        id: "geosearch",
        caption: "Search by",
        layername: "Geosearch location",
        gazetteers: ["cga"],
        popoverClass: "geosearch-popover",
        popoverContentClass: "geosearch-popover-content"
    }, options);
    
    magic.classes.NavigationBarTool.call(this, options);
    
    /* Defined gazetteers for this search */
    this.gazetteers = options.gazetteers;

    /* Get data about gazetteers, keyed by name */
    this.searchInput = new magic.classes.GazetteerSearchInput(this.id + "-placename", this.id, {
        mouseover: jQuery.proxy(this.mouseoverSuggestion, this),
        mouseout: jQuery.proxy(this.mouseoutSuggestion, this),
        search: jQuery.proxy(this.placenameSearchHandler, this)
    }, this.gazetteers);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function() {
                this.searchInput.init();
                this.infoButtonHandler("gazetteer sources", this.searchInput.getAttributions());
                jQuery("#" + this.id + "-position-go").click(jQuery.proxy(this.positionSearchHandler, this));
                this.populateSearchHistoryDropdown();                
            }, this),
        onDeactivate: jQuery.proxy(function() {
                this.searchedFeatureCache = [];
                this.suggestionFeatures = {};
                this.savedState = {};
                this.target.popover("hide");
            }, this), 
        onMinimise: jQuery.proxy(this.saveState, this)
    });

    this.suggestionStyle = magic.modules.Common.getIconStyle(0.6, "marker_orange"); /* "Ghost" style for mouseovers of suggestions */
    this.invisibleStyle = magic.modules.Common.getIconStyle(0.0, "marker_orange");  /* Removed style */
    this.resultStyle = magic.modules.Common.getIconStyle(0.8, "marker_green");      /* Actual search result style */

    /* Corresponding layer */
    this.layer.setStyle(this.resultStyle);
    this.layer.set("metadata", {
        "geom_type": "point",
        "is_interactive": true,
        "attribute_map": [
            {
                "name": "name",
                "displayed": true,
                "alias": "Name",
                "type": "xsd:string"
            },
            {
                "name": "lon",
                "displayed": true,
                "alias": "Longitude",
                "type": "xsd:decimal"
            },
            {
                "name": "lat",
                "displayed": true,
                "alias": "Latitude",
                "type": "xsd:decimal"
            }
        ]
    });
    
    /* List of already performed place-name searches */
    this.searchedFeatureCache = [];

    /* Temporary list of "ghost" suggestion features for working the mouseover overlays */
    this.suggestionFeatures = {};
    
    /* Saved state for implementation of minimise button */
    this.savedState = {};
            
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
        }   
    }, this));
};

magic.classes.Geosearch.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Geosearch.prototype.constructor = magic.classes.Geosearch;

magic.classes.Geosearch.prototype.interactsMap = function () {
    return(true);
};

magic.classes.Geosearch.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +
            '<form class="form-horizontal" role="form">' +
                '<div role="tabpanel">' +
                    '<ul class="nav nav-tabs" role="tablist">' +
                        '<li role="presentation" class="active">' +
                            '<a role="tab" data-toggle="tab" href="#' + this.id + '-placename" aria-controls="' + this.id + '-placename">Place-name</a>' +
                        '</li>' +
                        '<li role="presentation">' +
                            '<a role="tab" data-toggle="tab" href="#' + this.id + '-position" aria-controls="' + this.id + '-position">Lat/long</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
                '<div class="tab-content geosearch-tabs">' +
                    /*================================ Place-name search form fields ================================*/
                    '<div id="' + this.id + '-placename" role="tabpanel" class="tab-pane active">' +
                        this.searchInput.markup() + 
                    '</div>' +
                    /*================================ Position search form fields ================================*/
                    '<div id="' + this.id + '-position" role="tabpanel" class="tab-pane">' +
                        '<div class="form-group form-group-sm">' +
                            '<input id="' + this.id + '-lon" class="form-control" type="text" placeholder="Longitude" ' +
                                'data-toggle="tooltip" data-placement="bottom" title="Examples: -65.5, 65 30 00W (dms), W65 30.00 (ddm)" ' +
                                'required="required" autofocus="true"></input>' +
                        '</div>' +
                        '<div class="form-group form-group-sm">' +
                            '<input id="' + this.id + '-lat" class="form-control" type="text" placeholder="Latitude" ' +
                                'data-toggle="tooltip" data-placement="bottom" title="Examples: -60.25, 60 15 00S (dms), S60 15.00 (ddm)" required="required"></input>' +
                        '</div>' +
                        '<div class="form-group form-group-sm">' +
                            '<div class="input-group">' +
                                '<input id="' + this.id + '-label" class="form-control" type="text" placeholder="Label" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Type a label for the point"></input>' +
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-position-go" class="btn btn-primary btn-sm" type="button" ' +
                                        'data-toggle="tooltip" data-placement="right" title="Show position">' +
                                        '<span class="fa fa-search"></span>' +
                                    '</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    /*================================ Take me there checkbox ================================*/
                    '<div class="form-group form-group-sm">' +
                        '<div class="checkbox geosearch-tmt" style="float:left">' +
                            '<label>' +
                                '<input id="' + this.id + '-tmt" type="checkbox" checked ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Zoom the map to this location"></input> Take me there' +
                            '</label>' +
                        '</div>' +                        
                        this.infoLinkButtonMarkup("Show gazetteer sources") +
                        this.historyMarkup() +
                    '</div>' +                     
                    this.infoAreaMarkup() + 
                '</div>' +
            '</form>' +
        '</div>'
    );
};

magic.classes.Geosearch.prototype.historyMarkup = function() {
    return( 
        '<div style="inline-block;float:right;margin-right:10px">' + 
            '<div class="btn-group dropdown" role="group">' + 
                '<button id="' + this.id + '-history" type="button" style="width:100px" class="btn btn-sm btn-default dropdown-toggle" ' + 
                    'data-toggle="dropdown" data-container="body">' + 
                    '<i data-toggle="tooltip" data-placement="top" title="Searched location history" class="fa fa-history"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                '</button>' + 
                '<ul class="dropdown-menu dropdown-menu-left" style="overflow:auto">' + 
                '</ul>' + 
            '</div>' + 
        '</div>'
    );
};

/**
 * Dropdown markup for the previous search history
 */
magic.classes.Geosearch.prototype.populateSearchHistoryDropdown = function() {
    var insertAt = jQuery("#" + this.id + "-history").next("ul");
    insertAt.empty();
    /* Go through searched feature cache in reverse order */
    if (this.searchedFeatureCache.length == 0) {
        insertAt.append('<li class="dropdown-header">No search history</li>');
    } else { 
        insertAt.html(this.markupHistoryHeader());
        for (var i = 0; i < this.searchedFeatureCache.length; i++) {
            insertAt.children().first().after(this.markupHistoryEntry(i));
            /* Add visibility handler */
            jQuery("#" + this.id + "-" + this.searchedFeatureCache[i].getProperties()["__id"] + "-history-entry-vis").change(jQuery.proxy(this.historyEntryVisHandler, this));
        }        
    }
};

/**
 * Save the search values for pre-populating the form on re-show
 */
magic.classes.Geosearch.prototype.saveState = function () {
    this.savedState = {};
    this.savedState["placename"] = this.searchInput.getSearch();
    this.savedState["lon"] = jQuery("#" + this.id + "-lon").val();
    this.savedState["lat"] = jQuery("#" + this.id + "-lat").val();
    this.savedState["label"] = jQuery("#" + this.id + "-label").val();
    var activeTab = jQuery("#" + this.id + "-content").find("div.tab-pane.active");
    if (activeTab.length > 0) {
        this.savedState["activeTab"] = activeTab[0].id;
    }
};

/**
 * Restore saved search on re-show of the form pop-up
 */
magic.classes.Geosearch.prototype.restoreState = function () {
    this.searchInput.setSearch(this.savedState['placename']);
    jQuery("#" + this.id + "-lon").val(this.savedState['lon']);
    jQuery("#" + this.id + "-lat").val(this.savedState['lat']);
    jQuery("#" + this.id + "-label").val(this.savedState['label']); 
    if (this.savedState["activeTab"]) {
        jQuery("a[href='#" + this.savedState["activeTab"] + "']").tab("show");
    }
    this.savedState = {};
};

/**
 * Returns the active class name depending on saved search
 * @param {String} tabBase
 * @param {boolean} isDefault
 */
magic.classes.Geosearch.prototype.addActiveClass = function (tabBase, isDefault) {
    if (!this.savedState || jQuery.isEmptyObject(this.savedState) || !this.savedState["activeTab"]) {
        return(isDefault ? " active" : "");
    }
    return(this.savedState["activeTab"].indexOf("-" + tabBase) > 0 ? " active" : "");
};

/**
 * Mouseover for typeahead suggestions in gazetteer input
 */
magic.classes.Geosearch.prototype.mouseoverSuggestion = function (evt) {
    var name = evt.target.innerText;
    var searchSuggestions = evt.data.suggestions;
    if (searchSuggestions[name]) {
        var feat = this.suggestionFeatures[name];
        if (!feat) {
            /* Create the feature */
            var trCoord = ol.proj.transform(
                [searchSuggestions[name].lon, searchSuggestions[name].lat], 
                "EPSG:4326", 
                magic.runtime.map.getView().getProjection().getCode()
            );
            feat = new ol.Feature({
                geometry: new ol.geom.Point(trCoord),
                layer: this.layer,
                __suggestion: true
            });
            this.suggestionFeatures[name] = feat;
            this.layer.getSource().addFeature(feat);
        }
        feat.setStyle(this.suggestionStyle);
    }
};

/**
 * Mouseout for typeahead suggestions in gazetteer input
 */
magic.classes.Geosearch.prototype.mouseoutSuggestion = function (evt) {
    var name = evt.target.innerText;
    if (this.suggestionFeatures[name]) {
        this.suggestionFeatures[name].setStyle(this.invisibleStyle);
    }
};

/**
 * Handler for the place-name search go button "click" event - perform a place-name search and plot on map
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.placenameSearchHandler = function (evt) {

    this.saveState();
    var currentSearchData = this.searchInput.getSelection();

    /* Check if this search has already been done */
    var gazName = currentSearchData["__gaz_name"];
    var exIdx = this.featurePositionInHistory(currentSearchData.id, gazName);    
    if (exIdx < 0) {
        /* Fetch data */
        jQuery.getJSON("https://api.bas.ac.uk/locations/v1/placename/" + gazName + "/" + currentSearchData["id"], jQuery.proxy(function (json) {
            var jsonData = json.data;
            delete jsonData["__suggestion"];           
            var feat = new ol.Feature(jQuery.extend({
                "__id": magic.modules.Common.uuid(),
                name: currentSearchData.placename,
                geometry: this.computeProjectedGeometry(gazName, jsonData),                
                layer: this.layer,
                "__gaz_name": gazName
            }, jsonData));
            feat.setStyle(this.resultStyle);
            this.layer.getSource().addFeature(feat);
            if (jQuery("#" + this.id + "-tmt").prop("checked")) {
                this.flyTo(feat.getGeometry().getCoordinates(), function() {});
            }
            this.addHistoryEntry(feat);
        }, this));
    } else {
        /* Done this one before so simply fly to the location */        
        var feat = this.getHistoryEntry(exIdx);
        feat.setStyle(this.resultStyle);
        if (jQuery("#" + this.id + "-tmt").prop("checked")) {
            this.flyTo(feat.getGeometry().getCoordinates(), function() {});
        }
    }
};

/**
 * From a gazetteer return, compute a point at a place in the map projection
 * @param {string} gaz
 * @param {object} data
 * @returns {ol.geom.Point}
 */
magic.classes.Geosearch.prototype.computeProjectedGeometry = function (gaz, data) {
    var pt;
    var projCode = magic.runtime.map.getView().getProjection().getCode();
    if (
        (gaz == "sgssi" && projCode == "EPSG:3031") ||
        (gaz != "sgssi" && projCode == "EPSG:3762")
        ) {
        /* South Georgia gazetteer being used in an Antarctic map context, or Antarctic gazetteer in a South Georgia one - need to reproject coordinates */
        pt = new ol.geom.Point([data.lon, data.lat]);
        pt.transform("EPSG:4326", projCode);
    } else {
        pt = new ol.geom.Point([data.x, data.y]);
    }
    return(pt);
};

/**
 * Fly-to animation from http://openlayers.org/en/latest/examples/animation.html
 * @param {ol.coordinate} location
 * @param {Function} done
 */
magic.classes.Geosearch.prototype.flyTo = function (location, done) {
    var duration = 2000;
    var zoom = magic.runtime.map.getView().getZoom();
    var parts = 2;
    var called = false;
    function callback(complete) {
        --parts;
        if (called) {
            return;
        }
        if (parts === 0 || !complete) {
            called = true;
            done(complete);
        }
    }
    magic.runtime.map.getView().animate({
        center: location,
        duration: duration
    }, callback);
    magic.runtime.map.getView().animate({
        zoom: zoom - 1,
        duration: duration / 2
    }, {
        zoom: zoom,
        duration: duration / 2
    }, callback);
};

/**
 * Handler for the position search go button "click" event - plot coordinates on map and optionally fly there
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.positionSearchHandler = function (evt) {

    this.saveState();

    var lon = jQuery("#" + this.id + "-lon"),
            lat = jQuery("#" + this.id + "-lat"),
            label = jQuery("#" + this.id + "-label"),
            lonFg = lon.closest("div.form-group"),
            latFg = lat.closest("div.form-group");
    if (magic.modules.GeoUtils.validCoordinate(lon.val(), false, false) && magic.modules.GeoUtils.validCoordinate(lat.val(), true, false)) {
        /* Co-ordinates check out */
        var ddLon = magic.modules.GeoUtils.toDecDegrees(lon.val());
        var ddLat = magic.modules.GeoUtils.toDecDegrees(lat.val());
        var position = new ol.geom.Point([ddLon, ddLat]);
        position.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
        var feat = new ol.Feature({
            "__id": magic.modules.Common.uuid(),
            "__gaz_name": null,
            geometry: position,
            lon: ddLon,
            lat: ddLat,
            name: label.val(),
            layer: this.layer
        });
        this.layer.getSource().addFeature(feat);
        feat.setStyle(this.resultStyle);
        this.addHistoryEntry(feat);
        if (jQuery("#" + this.id + "-tmt").prop("checked")) {
            this.flyTo(feat.getGeometry().getCoordinates(), function() {});
        }
        lonFg.removeClass("has-error");
        latFg.removeClass("has-error");
    } else {
        lonFg.removeClass("has-success").addClass("has-error");
        latFg.removeClass("has-success").addClass("has-error");
    }
};

magic.classes.Geosearch.prototype.addHistoryEntry = function(feat, insertElt) {
    insertElt = insertElt || jQuery("#" + this.id + "-history").next("ul");
    var cacheEmpty = this.searchedFeatureCache.length == 0;    
    this.searchedFeatureCache.unshift(feat);    
    if (cacheEmpty) {
        insertElt.html(this.markupHistoryHeader());
    }
    insertElt.children().first().after(this.markupHistoryEntry(0));
    /* Add visibility handler */
    jQuery("#" + this.id + "-" + feat.getProperties()["__id"] + "-history-entry-vis").change(jQuery.proxy(this.historyEntryVisHandler, this));
};

magic.classes.Geosearch.prototype.markupHistoryHeader = function() {
    return(
        '<li class="dropdown-header">' + 
            '<div style="display:inline-block;width:20px">&nbsp;</div>' + 
            '<div style="display:inline-block;width:150px">Name</div>' +
            '<div style="display:inline-block;width:40px">Gaz</div>' +
            '<div style="display:inline-block;width:80px">Lon</div>' +
            '<div style="display:inline-block;width:80px">Lat</div>' +
        '</li>'
    );
};

magic.classes.Geosearch.prototype.markupHistoryEntry = function(idx) {
    var feat = this.searchedFeatureCache[idx];
    var attrs = feat.getProperties();
    var nameTt = "";
    if (attrs.name && attrs.name.length > 20) {
        nameTt = ' data-toggle="tooltip" data-placement="right" title="' + attrs.name + '"';
    }
    return(
        '<li>' + 
            '<a id="' + this.id + '-' + attrs["__id"] + '-history-entry-select" href="JavaScript:void(0)">' + 
                '<div style="display:inline-block;width:20px">' + 
                    '<input id="' + this.id + '-' + attrs["__id"] + '-history-entry-vis" type="checkbox"' + 
                        (feat.getStyle() == this.resultStyle ? ' checked="checked"' : '') + '>' + 
                    '</input>' +
                '</div>' + 
                '<div style="display:inline-block;width:150px"' + nameTt + '>' + 
                    magic.modules.Common.ellipsis(attrs.name, 20) + 
                '</div>' +
                '<div style="display:inline-block;width:40px">' + 
                    (attrs["__gaz_name"] || "") + 
                '</div>' +
                '<div style="display:inline-block;width:80px">' + 
                    magic.modules.GeoUtils.applyPref("coordinates", attrs.lon, "lon") + 
                '</div>' +
                '<div style="display:inline-block;width:80px">' + 
                    magic.modules.GeoUtils.applyPref("coordinates", attrs.lat, "lon") + 
                '</div>' +                        
            '</a>' + 
        '</li>'
    );
};

magic.classes.Geosearch.prototype.historyEntryVisHandler = function(evt) {
    var fid = evt.currentTarget.id.replace(this.id + "-", "").replace("-history-entry-vis", "");
    if (fid) {
        var historyIdx = this.featurePositionInHistory(fid);
        if (historyIdx != -1) {
            var f = this.searchedFeatureCache[historyIdx].setStyle(jQuery(evt.currentTarget).prop("checked") ? this.resultStyle : this.invisibleStyle);                 
        }
    }
};

magic.classes.Geosearch.prototype.getHistoryEntry = function(idx) {
    return(this.searchedFeatureCache[idx]);
};

magic.classes.Geosearch.prototype.featurePositionInHistory = function(fid) {
    var exIdx = -1;
    jQuery.each(this.searchedFeatureCache, jQuery.proxy(function (idx, psFeat) {
        var attrs = psFeat.getProperties();
        if (attrs["__id"] == fid) {
            exIdx = idx;
            return(false);
        }
    }, this));
    return(exIdx);
};



/* Map information and software credits modal */

magic.classes.InfoModal = function(options) { 
    
    /* API */
    this.target = options ? options.target : "information-modal";
    
    this.infolink = options ? options.infolink : null;
    
    /* Internal */
    this.fetched = false;
    
    jQuery("#" + this.target).on("shown.bs.modal", jQuery.proxy(function() {
        if (this.infolink == null) {
            jQuery('a[href="#information-credits"]').tab("show");
            jQuery('a[href="#information-background"]').parent().addClass("hidden");
        } else {
            this.getBackgroundInfo();  
            
        }
    }, this));    
};

/**
 * Create the map information markup
 */
magic.classes.InfoModal.prototype.getBackgroundInfo = function() {
    if (!this.fetched && this.infolink != null) {
        if (this.infolink.indexOf(magic.config.paths.baseurl) != 0) {
            this.infolink = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(this.infolink);
        }
        jQuery("#information-background").load(this.infolink, function() {
            jQuery('a[href="#information-background"]').tab("show");
        });
        this.fetched = true;
    }
};


/* Measuring tool for distances and areas, implemented as a Bootstrap popover */

magic.classes.Measurement = function(options) {
    
    options = jQuery.extend({}, {
        id: "measure-tool",
        caption: "Measure on the map",
        layername: "_measurement",
        popoverClass: "measure-tool-popover",
        popoverContentClass: "measure-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(function() {
            this.stopMeasuring();
            this.target.popover("hide");
        }, this), 
        onMinimise: jQuery.proxy(function() {
            this.stopMeasuring();
            this.saveState();
        }, this)
    });
    
    /* Set layer styles */
    this.layer.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.2)"}),
        stroke: new ol.style.Stroke({color: "#ff8c00", width: 2}),
        image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: "#ff8c00"})})
    })); 
    
    /* Applied to a sketch in height graph mode */
    this.heightgraphSketchStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({color: "#800000", width: 2})
    });

    /* Current sketch */
    this.sketch = null;
    
    /* Help tooltip */
    this.helpTooltipJq = null;
    this.helpTooltip = null;

    /* Measure tooltip */
    this.measureTooltipJq = null;
    this.measureTooltip = null;
    this.measureOverlays = [];    
    
    /* Elevation popup tool */
    this.elevationTool = new magic.classes.ElevationPopup({
        id: this.id + "-elevation-tool"
    });
    
    /* Height graph popup tool */
    this.heightgraphTool = new magic.classes.HeightGraphPopup({
        id: this.id + "-heightgraph-tool"
    });

    /* Current action (distance/area) */
    this.actionType = "distance";

    /* Status of measure operation */
    this.measuring = false;
    
    /* Saved state for implementation of minimise button */
    this.savedState = {};
        
    this.target.popover({
        template: this.template,
        container: "body",
        title: this.titleMarkup(),
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.activate(); 
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
        }   
    }, this));
};

magic.classes.Measurement.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Measurement.prototype.constructor = magic.classes.Measurement;

magic.classes.Measurement.prototype.interactsMap = function () {
    return(true);
};

magic.classes.Measurement.prototype.onActivateHandler = function() {
    
    this.actionType = "distance";

    /* Add go button handlers */
    jQuery("button[id$='-go']").click(jQuery.proxy(function(evt) {
        if (this.measuring) {
            this.stopMeasuring();
        } else {
            this.startMeasuring();
        }
    }, this));

    /* Set handlers for selecting between area and distance measurement */
    jQuery("a[href='#" + this.id + "-distance']").on("shown.bs.tab", jQuery.proxy(function() {
        jQuery("#" + this.id + "-distance-units").focus();
        this.actionType = "distance";
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-area']").on("shown.bs.tab", jQuery.proxy(function() {
        jQuery("#" + this.id + "-area-units").focus();
        this.actionType = "area";
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-elevation']").on("shown.bs.tab", jQuery.proxy(function() {
        this.elevationTool.setTarget(
            this.id + "-elevation-go", 
            "Click to stop measuring elevations", 
            "Click map to measure elevation at a point"
        );
        var visDems = this.elevationTool.currentlyVisibleDems();
        if (visDems.length > 0) {
            /* Good to go - we have DEM layers defined and turned on */
            jQuery("#" + this.id + "-no-dem-info").addClass("hidden");
            jQuery("#" + this.id + "-dem-info").removeClass("hidden");
            jQuery("#" + this.id + "-elevation-units").focus();
            this.actionType = "elevation";
        } else {
            var noDemHtml = '';
            var demLayers = this.elevationTool.getDemLayers();            
            if (demLayers.length > 0) {
                /* There are DEMs but they need to be turned on */
                var demLayerNames = jQuery.map(demLayers, function(l, idx) {
                    return(l.get("name"));
                });
                noDemHtml = 
                    '<p>One of the DEM layers below:</p>' + 
                    '<p><strong>' + 
                    demLayerNames.join('<br/>') + 
                    '</strong></p>' +
                    '<p>needs to be visible to see elevations</p>';
            } else {
                /* No DEMs defined */
                noDemHtml = '<p>No base layer in this map contains elevation data</p>';
                jQuery("a[href='" + this.id + "-elevation']").prop("disabled", "disabled");
            }
            jQuery("#" + this.id + "-dem-info").addClass("hidden");
            jQuery("#" + this.id + "-no-dem-info").removeClass("hidden").html(noDemHtml);
        }            
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-heightgraph']").on("shown.bs.tab", jQuery.proxy(function() {
        this.heightgraphTool.setTarget(
            this.id + "-heightgraph-go", 
            "Click to close height graph", 
            "Draw line on the map along which to view elevation graph"
        );
        var visDems = this.heightgraphTool.currentlyVisibleDems();
        if (visDems.length > 0) {
            /* Good to go - we have DEM layers defined and turned on */
            jQuery("#" + this.id + "-no-dem-info-hg").addClass("hidden");
            jQuery("#" + this.id + "-dem-info-hg").removeClass("hidden");
            jQuery("#" + this.id + "-heightgraph-units").focus();
            this.actionType = "heightgraph";            
        } else {
            var noDemHtml = '';
            var demLayers = this.heightgraphTool.getDemLayers();            
            if (demLayers.length > 0) {
                /* There are DEMs but they need to be turned on */
                var demLayerNames = jQuery.map(demLayers, function(l, idx) {
                    return(l.get("name"));
                });
                noDemHtml = 
                    '<p>One of the DEM layers below:</p>' + 
                    '<p><strong>' + 
                    demLayerNames.join('<br/>') + 
                    '</strong></p>' +
                    '<p>needs to be visible to view height graphs</p>';
            } else {
                /* No DEMs defined */
                noDemHtml = '<p>No base layer in this map contains elevation data</p>';
                jQuery("a[href='" + this.id + "-heightgraph']").prop("disabled", "disabled");
            }
            jQuery("#" + this.id + "-dem-info-hg").addClass("hidden");
            jQuery("#" + this.id + "-no-dem-info-hg").removeClass("hidden").html(noDemHtml);
        }            
        this.stopMeasuring();        
    }, this));

    /* Change handler to stop measuring whenever dropdown units selection changes */
    jQuery("select[id$='-units']").change(jQuery.proxy(function(evt) {
        if (this.actionType == "elevation") {
            this.elevationTool.setUnits(jQuery(evt.currentTarget).val());
        } else if (this.actionType == "heightgraph") {
            this.heightgraphTool.setUnits(jQuery(evt.currentTarget).val());
        }
        this.stopMeasuring();
    }, this));
    
    /* Change handler to stop measuring whenever height graph sampling selection changes */
    jQuery("#" + this.id + "-heightgraph-sampling").change(jQuery.proxy(function(evt) {
        if (this.actionType == "heightgraph") {
            this.heightgraphTool.setInterpolation(jQuery(evt.currentTarget).val());
            this.stopMeasuring();
        }        
    }, this));

    /* Initial focus */
    jQuery("#" + this.id + "-distance-units").focus();
};

/**
 * Start the measuring process
 */
magic.classes.Measurement.prototype.startMeasuring = function() {
    
    /* Record measuring operation in progress */
    this.measuring = true;

    /* Change the button icon from play to stop */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-play").addClass("fa-stop");

    if (this.actionType == "distance" || this.actionType == "area" || this.actionType == "heightgraph") {        
        /* Add the layer and draw interaction to the map */
        this.layer.setVisible(true);
        this.layer.getSource().clear();
        if (this.drawInt) {
            this.map.removeInteraction(this.drawInt);
        }
        this.drawInt = new ol.interaction.Draw({
            source: this.layer.getSource(),
            type: this.actionType == "area" ? "Polygon" : "LineString"
        });
        this.map.addInteraction(this.drawInt);

        this.createMeasurementTip();
        this.createHelpTooltip();
        
        /* Add start and end handlers for the sketch */
        this.drawInt.on("drawstart",
            function(evt) {               
                this.sketch = evt.feature;
                this.sketch.getGeometry().on("change", this.sketchChangeHandler, this);
            }, this);
        this.drawInt.on("drawend",
            function(evt) {
                if (this.actionType == "heightgraph") {
                    /* Height graph => change the sketch style to indicate finish */
                    this.sketch.setStyle(this.heightgraphSketchStyle);
                    /* remove the drawing interaction - only allow a single linestring */
                    if (this.drawInt) {
                        /* Wait until the double click has registered, otherwise it zooms the map in! */
                        setTimeout(jQuery.proxy(function() {
                            this.map.removeInteraction(this.drawInt);
                            this.drawInt = null;
                        }, this), 500);                        
                    }                    
                    /* Remove mouse move handler */
                    this.map.un("pointermove", this.pointerMoveHandler, this);
                    /* Create and display height graph using visjs */
                    this.heightgraphTool.activate(this.sketch.getGeometry());                    
                } else {
                    /* Distance or area measure requires tooltip addition */
                    this.measureTooltipJq.attr("className", "measure-tool-tooltip measure-tool-tooltip-static");
                    this.measureTooltip.setOffset([0, -7]);
                    this.sketch = null;
                    this.measureTooltipJq = null;
                    this.createMeasurementTip();
                }
            }, this);

        /* Add mouse move handler to give a running total in the output */
        this.map.un("pointermove", this.pointerMoveHandler, this);
        this.map.on("pointermove", this.pointerMoveHandler, this);
        jQuery(this.map.getViewport()).on("mouseout", jQuery.proxy(function() {
            this.helpTooltipJq.addClass("hidden");
        }, this));  
        
        /* Set units for height graph */
        if (this.actionType == "heightgraph") {            
            this.heightgraphTool.setUnits(jQuery("#" + this.id + "-heightgraph-units").val());
        }
    } else {
        /* Height measure set-up */
        this.elevationTool.setUnits(jQuery("#" + this.id + "-elevation-units").val());
        this.elevationTool.activate();
    }
};

/**
 * Stop the measuring process
 */
magic.classes.Measurement.prototype.stopMeasuring = function() {
    
    /* Record no measuring in progress */
    this.measuring = false;
    
    /* Change the button icon from stop to play */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-stop").addClass("fa-play");    
    
    if (this.actionType == "distance" || this.actionType == "area" || this.actionType == "heightgraph") {  
        
        /* Clear all the measurement indicator overlays */
        jQuery.each(this.measureOverlays, jQuery.proxy(function(mi, mo) {
            this.map.removeOverlay(mo);
        }, this));
        this.measureOverlays = [];
        this.map.removeOverlay(this.helpTooltip);
        
        /* Hide the measurement layer and remove draw interaction from map */
        this.layer.setVisible(false);
        this.layer.getSource().clear();
        if (this.drawInt) {
            this.map.removeInteraction(this.drawInt);
        }
        this.drawInt = null;
        this.sketch = null;

        /* Remove mouse move handler */
        this.map.un("pointermove", this.pointerMoveHandler, this); 
        
        if (this.actionType == "heightgraph") {
            this.heightgraphTool.deactivate();
        }
    } else {
        /* Clear height measure */
        this.elevationTool.deactivate();
    }    
};

magic.classes.Measurement.prototype.markup = function() {
    return('<div id="' + this.id + '-content">' +
        '<form class="form-horizontal" role="form">' +
            '<div role="tabpanel">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li role="presentation" class="active">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-distance">Distance</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-area">Area</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-elevation">Elevation</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-heightgraph">Height graph</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content measure-tabs">' +
                '<div id="' + this.id + '-distance" role="tabpanel" class="tab-pane active">' +
                    '<div class="form-group form-group-sm">' +
                        '<label for="' + this.id + '-distance-units">Distance units</label>' +
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-distance-units" class="form-control">' +
                                '<option value="km"' + (magic.runtime.preferences.distance == "km" ? ' selected' : '') + '>kilometres</option>' +
                                '<option value="m"' + (magic.runtime.preferences.distance == "m" ? ' selected' : '') + '>metres</option>' +
                                '<option value="mi"' + (magic.runtime.preferences.distance == "mi" ? ' selected' : '') + '>miles</option>' +
                                '<option value="nmi"' + (magic.runtime.preferences.distance == "nmi" ? ' selected' : '') + '>nautical miles</option>' +
                            '</select>' +
                            '<span class="input-group-btn">' +
                                '<button id="' + this.id + '-distance-go" class="btn btn-primary btn-sm" type="button" ' +
                                    'data-toggle="tooltip" data-placement="right" title="Draw line to measure on map - double-click to finish">' +
                                    '<span class="fa fa-play""></span>' +
                                '</button>' +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group form-group-sm">' +
                        '<div class="checkbox measure-true">' +
                            '<label>' +
                                '<input id="' + this.id + '-true" type="checkbox" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Check to use true distance on earth\'s surface"></input> Geodesic' +
                            '</label>' +
                        '</div>' +           
                    '</div>' +
                '</div>' +
                '<div id="' + this.id + '-area" role="tabpanel" class="tab-pane">' +
                    '<div class="form-group form-group-sm">' +
                        '<label for="' + this.id + '-area-units">Area units</label>' +
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-area-units" class="form-control">' +
                                '<option value="km"' + (magic.runtime.preferences.area == "km" ? ' selected' : '') + '>square kilometres</option>' +
                                '<option value="m"' + (magic.runtime.preferences.area == "m" ? ' selected' : '') + '>square metres</option>' +
                                '<option value="mi"' + (magic.runtime.preferences.area == "mi" ? ' selected' : '') + '>square miles</option>' +
                                '<option value="nmi"' + (magic.runtime.preferences.area == "nmi" ? ' selected' : '') + '>square nautical miles</option>' +
                            '</select>' +
                            '<span class="input-group-btn">' +
                                '<button id="' + this.id + '-area-go" class="btn btn-primary btn-sm" type="button" ' +
                                    'data-toggle="tooltip" data-placement="right" title="Draw area to measure on map - click once to finish">' +
                                    '<span class="fa fa-play"></span>' +
                                '</button>' +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group form-group-sm">' +
                        '<div class="checkbox measure-true">' +
                            '<label>' +
                                '<input id="' + this.id + '-true" type="checkbox" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Check to use true distance on earth\'s surface"></input> Geodesic' +
                            '</label>' +
                        '</div>' +           
                    '</div>' +
                '</div>' +
                '<div id="' + this.id + '-elevation" role="tabpanel" class="tab-pane">' +
                    '<div id="' + this.id + '-no-dem-info" class="alert alert-info hidden">' +                        
                    '</div>' +
                    '<div id="' + this.id + '-dem-info">' + 
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-elevation-units">Elevation units</label>' + 
                            '<div class="input-group">' +
                                '<select id="' + this.id + '-elevation-units" class="form-control">' +
                                    '<option value="m"' + (magic.runtime.preferences.elevation == "m" ? ' selected' : '') + '>metres</option>' +
                                    '<option value="ft"' + (magic.runtime.preferences.elevation == "ft" ? ' selected' : '') + '>feet</option>' +                                   
                                '</select>' +   
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-elevation-go" class="btn btn-primary btn-sm" type="button" ' +
                                        'data-toggle="tooltip" data-placement="right" title="Click map to measure elevation at a point">' +
                                        '<span class="fa fa-play"></span>' +
                                    '</button>' +
                                '</span>' +
                            '</div>' + 
                        '</div>' +
                    '</div>' + 
                '</div>' + 
                '<div id="' + this.id + '-heightgraph" role="tabpanel" class="tab-pane">' +
                    '<div id="' + this.id + '-no-dem-info-hg" class="alert alert-info hidden">' +                        
                    '</div>' +
                    '<div id="' + this.id + '-dem-info-hg">' +
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-heightgraph-units">Height graph altitude units</label>' +
                            '<select id="' + this.id + '-heightgraph-units" class="form-control">' +
                                '<option value="m"' + (magic.runtime.preferences.elevation == "m" ? ' selected' : '') + '>metres</option>' +
                                '<option value="ft"' + (magic.runtime.preferences.elevation == "ft" ? ' selected' : '') + '>feet</option>' +                                   
                            '</select>' +                                   
                        '</div>' +                   
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-heightgraph-sampling">Sample points for each segment</label>' +
                            '<div class="input-group">' +
                                '<select id="' + this.id + '-heightgraph-sampling" class="form-control">' + 
                                    '<option value="5" selected>5</option>' +
                                    '<option value="10">10</option>' +
                                    '<option value="20">20</option>' + 
                                    '<option value="50">50</option>' + 
                                    '<option value="100">100</option>' + 
                                '</select>' +
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-heightgraph-go" class="btn btn-primary btn-sm" type="button" ' +
                                        'data-toggle="tooltip" data-placement="right" title="Draw line on the map along which to view elevation graph">' +
                                        '<span class="fa fa-play"></span>' +
                                    '</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +                
            '</div>' +                
        '</form>' +
    '</div>'
    );
};

/**
 * Save the state for pre-populating tabs on re-show
 */
magic.classes.Measurement.prototype.saveState = function () {
    this.savedState = {};
    jQuery.each(["heightgraph-units", "heightgraph-sampling", "elevation-units", "area-units", "distance-units"], jQuery.proxy(function(idx, ip) {
        this.savedState[ip] = jQuery("#" + this.id + "-" + ip).val();
    }, this));    
    var activeTab = jQuery("#" + this.id + "-content").find("div.tab-pane.active");
    if (activeTab.length > 0) {
        this.savedState["activeTab"] = activeTab[0].id;
    }
};

/**
 * Restore saved tab form values on re-show of the form pop-up
 */
magic.classes.Measurement.prototype.restoreState = function () {
    jQuery.each(["heightgraph-units", "heightgraph-sampling", "elevation-units", "area-units", "distance-units"], jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-" + ip).val(this.savedState[ip]);
    }, this));  
    if (this.savedState["activeTab"]) {
        jQuery("a[href='#" + this.savedState["activeTab"] + "']").tab("show");
    }
    this.savedState = {};
};

/**
 * Sketch change handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.sketchChangeHandler = function(evt) {
    
    if (this.actionType != "heightgraph") {
        
        /* Tooltip accompaniment while drawing */
        var value, toUnits, tooltipCoord, dims = 1;
        var isGeodesic = jQuery("#" + this.id + "-true").prop("checked");
        var geom = this.sketch.getGeometry();
        
        if (this.actionType == "area") {
            /* Area measure */
            value = isGeodesic ? magic.modules.GeoUtils.geodesicArea(geom, this.map) : geom.getArea();
            dims = 2;
            toUnits = jQuery("#" + this.id + "-area-units").val();
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
            
        } else if (this.actionType == "distance") {
            /* Distance measure */
            value = isGeodesic ? magic.modules.GeoUtils.geodesicLength(geom, this.map) : geom.getLength();
            toUnits = jQuery("#" + this.id + "-distance-units").val();
            tooltipCoord = geom.getLastCoordinate();
        } 
        this.measureTooltipJq.html(magic.modules.Common.unitConverter(value, "m", toUnits, dims));
        this.measureTooltip.setPosition(tooltipCoord);   
    }    
};

/**
 * Mouse move handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.pointerMoveHandler = function(evt) {
    if (evt.dragging) {
        return;
    }        
    if (this.sketch) { 
        var helpMsg; 
        switch(this.actionType) {
            case "distance":    helpMsg = "Click to continue sketching line"; break;
            case "area":        helpMsg = "Click to continue sketching polygon"; break;
            case "heightgraph": helpMsg = "Click to continue adding to line, and double click to see the height profile"; break;
            default:            helpMsg = "Click to start sketching"; break;
        } 
        this.helpTooltipJq.removeClass("hidden").html(helpMsg);
        this.helpTooltip.setPosition(evt.coordinate);
    }    
};

/**
 * Creates a new help tooltip
 */
magic.classes.Measurement.prototype.createHelpTooltip = function() {
    if (jQuery.isArray(this.helpTooltipJq) && this.helpTooltipJq.length > 0) {
        this.helpTooltipJq.parent().remove(".measure-tool-tooltip");
    }
    this.helpTooltipJq = jQuery("<div>", {
        "class": "measure-tool-tooltip hidden"
    });
    this.helpTooltip = new ol.Overlay({
        element: this.helpTooltipJq[0],
        offset: [15, 0],
        positioning: "center-left"
    });
    this.map.addOverlay(this.helpTooltip);
};

/**
 * Creates a new measure tooltip
 */
magic.classes.Measurement.prototype.createMeasurementTip = function() {
    if (jQuery.isArray(this.measureTooltipJq) && this.measureTooltipJq.length > 0) {
        this.measureTooltipJq.parent().remove(".measure-tool-tooltip");
    }
    this.measureTooltipJq = jQuery("<div>", {
        "class": "measure-tool-tooltip measure-tool-tooltip-out"
    });
    var mtto = new ol.Overlay({
        element: this.measureTooltipJq[0],
        offset: [0, -15],
        positioning: "bottom-center"
    });
    this.measureOverlays.push(mtto);
    this.measureTooltip = mtto;
    this.map.addOverlay(this.measureTooltip);
};
/* Overview map, implemented as a Bootstrap popover */

magic.classes.OverviewMap = function(options) {

    /* API properties */
    
    /* id allows more than one tool per application */
    this.id = options.id || "overview-map-tool";
      
    this.target = jQuery("#" + options.target);
    
    this.layertree = options.layertree || null;
    
    /* Internal */
    this.control = null;
    this.template = 
        '<div class="popover overview-map-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content overview-map-popover-content"></div>' +
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Overview map</strong><big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: "Overview map"
    })
    .on("show.bs.popover", jQuery.proxy(function() {
        return(this.setEnabledStatus());
    }, this))
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.initControl();        
        /* Close button */
        jQuery(".overview-map-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
    }, this));
    jQuery(document).on("baselayerchanged", jQuery.proxy(this.initControl, this));
    /* Note: may need to set enabled status...David 2017-10-31 */
};

magic.classes.OverviewMap.prototype.initControl = function() {
    var poContent = jQuery("div.overview-map-popover-content");
    poContent.html("");
    if (this.control != null) {
        magic.runtime.map.removeControl(this.control);
        this.control = null;
    }
    this.control = new ol.control.OverviewMap({
        target: poContent[0],
        collapsed: false,
        className: "ol-overviewmap custom-overview-map",        
        layers: this.getOverviewLayers(),
        view: new ol.View({
            projection: magic.runtime.map.getView().getProjection().getCode(),
            rotation: magic.runtime.map.getView().getRotation()
        })
    });        
    magic.runtime.map.addControl(this.control);
    jQuery("button[title='Overview map']").addClass("hidden");
};

magic.classes.OverviewMap.prototype.interactsMap = function () {
    return(false);
};

magic.classes.OverviewMap.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.OverviewMap.prototype.getTemplate = function() {
    return(this.template);
};

/**
 * Get a set of base and overlay layers suitable for the overview, based on the main map
 * @returns {Array<ol.Layer>}
 */
magic.classes.OverviewMap.prototype.getOverviewLayers = function() {
    var oLayers = [];
    if (this.layertree != null) {
        jQuery.each(this.layertree.getBaseLayers(), jQuery.proxy(function(bi, bl) {
            if (bl.getVisible()) {
                /* This is the visible base layer */
                oLayers.push(bl);
                return(false);
            }
        }, this));
        if (oLayers.length > 0) {
            jQuery.each(this.layertree.getWmsOverlayLayers(), jQuery.proxy(function(oi, olyr) {
                var md = olyr.get("metadata");
                if (md.source && md.source.wms_source) {  
                    var featName = md.source.feature_name;
                    if (featName.indexOf("coastline") >= 0) {
                        oLayers.push(olyr);
                    }
                }
            }, this));
        }
    } else {
        /* No layer tree => assume base layer is first */
        oLayers = [magic.runtime.map.getLayers().item(0)];
    }
    return(oLayers);
};

/**
 * Set the overview tool to be enabled between the optional zoom levels, disabled otherwise
 * @return {boolean} 
 */
magic.classes.OverviewMap.prototype.setEnabledStatus = function() {
    var enable = false;
    if (magic.runtime.map) {
        enable = magic.runtime.map.getView().getResolution() <= 500.0;
    }
    if (!enable) {        
        this.target.popover("hide");
        this.target.attr("title", "Overview disabled for zoomed out maps");
    } else {
        this.target.attr("title", "");
    }
    return(enable);
};

/* Tabbed tool for collating all personal data (maps, layers, preferences), implemented as a Bootstrap popover */

magic.classes.PersonalData = function(options) {
    
    options = jQuery.extend({}, {
        id: "personal-data-tool",
        caption: "My data",
        layername: null,
        popoverClass: "personal-data-tool-popover",
        popoverContentClass: "personal-data-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Internal properties */
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(this.onDeactivateHandler, this),
        onMinimise: jQuery.proxy(this.onMinimiseHandler, this)
    });
    
    /* Form widgets occupying tabs */
    this.tabForms = {
        "maps": new magic.classes.MapViewManagerForm({}),
        "layers": new magic.classes.UserLayerManagerForm({}),
        "prefs": new magic.classes.UserPreferencesForm({})        
    };
   
    /* Saved state of all the tabs and forms */
    this.savedState = {};
    
    /* End of internal properties */
        
    this.target.popover({
        template: this.template,
        container: "body",
        title: this.titleMarkup(),
        html: true,
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(this.activate, this));            
};

magic.classes.PersonalData.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.PersonalData.prototype.constructor = magic.classes.PersonalData;

magic.classes.PersonalData.prototype.interactsMap = function () {
    return(true);
};

/**
 * Handler for activation of the tool
 */
magic.classes.PersonalData.prototype.onActivateHandler = function() {
    
    /* Initialise tabs */
    jQuery.each(this.tabForms, jQuery.proxy(function(key, tab) {
        tab.init();
    }, this));
    
    /* Tidy up pop-ups and assign tab change handler */
    jQuery("#" + this.id + "-content").find("a[data-toggle='tab']").on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Close any pop-ups associated with the tab we just closed */
        var lastHref = jQuery(evt.relatedTarget).attr("href");
        var lastTab = lastHref.substring(lastHref.lastIndexOf("-")+1);
        if (jQuery.isFunction(this.tabForms[lastTab].tidyUp)) {
            this.tabForms[lastTab].tidyUp(false, false);
        }       
    }, this));
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.restoreState();
    }
};

/**
 * Handler for deactivation of the tool
 */
magic.classes.PersonalData.prototype.onDeactivateHandler = function() {
    var openTab = this.activeTab();
    if (jQuery.isFunction(this.tabForms[openTab].formDirty) && this.tabForms[openTab].formDirty()) { 
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
                    if (jQuery.isFunction(this.tabForms[openTab].saveForm)) {
                        this.tabForms[openTab].saveForm();
                    }                
                } else {
                    this.tidyUp(true, true);
                    this.savedState = {};
                    this.target.popover("hide");
                }                
            }, this)
        });
    } else {
        this.tidyUp(true, true);
        this.savedState = {};
        this.target.popover("hide");
    }    
};

/**
 * Handler for minimisation of the tool
 */
magic.classes.PersonalData.prototype.onMinimiseHandler = function() {
    this.tidyUp(true, false);
    this.saveState();
};

magic.classes.PersonalData.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +
            '<div role="tabpanel">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li role="presentation" class="active" data-toggle="tooltip" data-placement="top" title="Manage your own custom views of this and other maps">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-maps">Map views</a>' +
                    '</li>' +
                    '<li role="presentation"  data-toggle="tooltip" data-placement="top" title="Upload and style your own data on this map">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-layers">Data layers</a>' +
                    '</li>' +
                    '<li role="presentation" data-toggle="tooltip" data-placement="top" title="Change your format and unit settings for quantities displayed in the map interface">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-prefs">Unit preferences</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content personal-data-tabs">' +
                '<div id="' + this.id + '-maps" role="tabpanel" class="tab-pane active">' +
                    this.tabForms["maps"].markup() + 
                '</div>' +
                '<div id="' + this.id + '-layers" role="tabpanel" class="tab-pane">' +
                    this.tabForms["layers"].markup() + 
                '</div>' +
                '<div id="' + this.id + '-prefs" role="tabpanel" class="tab-pane">' +
                    this.tabForms["prefs"].markup() + 
                '</div>' +
            '</div>' +                
        '</div>'
    );
};

magic.classes.PersonalData.prototype.saveState = function() {    
    var openTab = this.activeTab();
    this.savedState = {
        openTab: openTab
    };
    /* Endure component state for displayed tab is saved and others reset */
    jQuery.each(this.tabForms, function(key, frm) {
        if (key == openTab && jQuery.isFunction(frm.saveState)) {
            frm.saveState();
        } else if (key != openTab && jQuery.isFunction(frm.clearState)) {
            frm.clearState();
        }
    });
};

magic.classes.PersonalData.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        var openTab = this.activeTab();
        if (openTab != this.savedState.openTab) {                     
            /* Show previously open tab */
            jQuery("a[href$='-" + this.savedState.openTab + "']").tab("show");
        }
    }
};

/**
 * Remove all pop-ups from sub-forms/tabs
 * @param {boolean} quiet to suppress all warnings about unsaved edits
 * @param {boolean} deactivate true if this is a hard deactivate, rather than a minimise
 */
magic.classes.PersonalData.prototype.tidyUp = function(quiet, deactivate) {
    jQuery.each(this.tabForms, function(key, frm) {
        if (jQuery.isFunction(frm.tidyUp)) {
            frm.tidyUp(quiet, deactivate);
        }
    });    
};

/**
 * Compute the base name key of the currently active tab
 * @return {String}
 */
magic.classes.PersonalData.prototype.activeTab = function() {
    var activeDiv = jQuery("#" + this.id + "-content").find("div[role='tabpanel'].active");
    return(activeDiv.length > 0 ? activeDiv.attr("id").replace(this.id + "-", "") : "maps");
};



/* Get positions of all BAS and certain other aircraft */

magic.classes.AircraftPositionButton = function (name, ribbon, options) {
    magic.classes.AssetPositionButton.call(this, name, ribbon, options);
    this.attribute_map = [
        {name: "callsign", alias: "Call sign", displayed: true},
        {name: "checktimestamp", alias: "Date", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true},
        {name: "speed", alias: "Speed", displayed: false}
    ];
};

magic.classes.AircraftPositionButton.prototype = Object.create(magic.classes.AssetPositionButton.prototype);
magic.classes.AircraftPositionButton.prototype.constructor = magic.classes.AircraftPositionButton;

magic.classes.AircraftPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    jQuery.ajax({
        /* Might be nice to get this listed as part of the maps.bas.ac.uk stable... */
        url: "https://add.data.bas.ac.uk/geoserver/assets/wfs?service=wfs&request=getfeature&version=2.0.0&typeNames=assets:latest_aircraft_positions&outputFormat=json",
        method: "GET",
        success: jQuery.proxy(function(data) {
            if (!this.geoJson) {
                return;
            }
            this.data = {
                inside: [],
                outside: []
            };   
            var feats = this.geoJson.readFeatures(data);
            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.map.getView().getProjection().getCode());
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var props = jQuery.extend({}, f.getProperties());
                var fclone = f.clone();
                fclone.setProperties(props);
                if (f.getGeometry().intersectsExtent(projExtent)) {                            
                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"](magic.runtime.map.getView().getProjection().getCode()));
                    this.data.inside.push(fclone);
                } else {
                    fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"]("EPSG:3857"));
                    this.data.outside.push(fclone);
                }                        
            }, this));
            this.layer.getSource().clear();
            if (this.data.inside.length > 0) {
                this.layer.getSource().addFeatures(this.data.inside);
            }
            if (this.data.outside.length > 0) {
                if (this.insetLayer) {
                    this.insetLayer.getSource().clear();
                    var osClones = jQuery.map(this.data.outside, function(f) {
                        return(f.clone());
                    });      
                    this.insetLayer.getSource().addFeatures(osClones); 
                }
                if (magic.runtime.inset) {
                    magic.runtime.inset.activate();
                }
            }                  
        }, this),
        error: function(jqXhr, status, msg) {
            console.log("Failed to get aircraft positional data - potential network outage?");
        }
    });
};
/* Height enquiry from a map base raster, displayed as a popover on the map */

magic.classes.ElevationPopup = function(options) {
        
    magic.classes.DemAwareTool.call(this, options);
    
    /* The pop-up indicating height at a point, done as an overlay */
    var hPopDiv = jQuery("#height-popup");
    if (hPopDiv.length == 0) {
        jQuery("body").append('<div id="height-popup" title="Elevation"></div>');
        hPopDiv = jQuery("#height-popup");
    }
    this.heightPopup = new ol.Overlay({element: hPopDiv[0]});
    this.map.addOverlay(this.heightPopup);
    
};

magic.classes.ElevationPopup.prototype = Object.create(magic.classes.DemAwareTool.prototype);
magic.classes.ElevationPopup.prototype.constructor = magic.classes.ElevationPopup;

magic.classes.ElevationPopup.prototype.activate = function() {
    this.target.attr("data-original-title", this.activeTooltip).tooltip("fixTitle");
    this.map.on("singleclick", this.showHeightPopover, this);
    this.map.on("moveend", this.destroyPopup, this);
};

magic.classes.ElevationPopup.prototype.deactivate = function() {
    this.destroyPopup();
    this.target.attr("data-original-title", this.inactiveTooltip).tooltip("fixTitle");
    this.map.un("singleclick", this.showHeightPopover, this);
    this.map.un("moveend", this.destroyPopup, this);
};
        
/**
 * Map click handler to query DEM elevation at a point and display in a popover overlay
 * @param {jQuery.Event} evt
 */
magic.classes.ElevationPopup.prototype.showHeightPopover = function(evt) {
    this.queryElevation(evt, 
    jQuery.proxy(function(clickPt, x, y, z) {
        var jqElt = jQuery(this.heightPopup.getElement());
        jqElt.popover("destroy");
        this.heightPopup.setPosition(clickPt);
        jqElt.popover({
            "container": "body",
            "placement": "top",
            "animation": false,
            "html": true,
            "content": magic.modules.GeoUtils.formatSpatial(z, 1, this.units, "m", 0) + " at (" + x + ", " + y + ")"
        }); 
        jqElt.popover("show");
    }, this),
    jQuery.proxy(function(clickPt, xhr) {
        var jqElt = jQuery(this.heightPopup.getElement());
        jqElt.popover("destroy");
        this.heightPopup.setPosition(clickPt);
        var msg = xhr.status == 401 ? "Not authorised to query DEM" : "Failed to get height";        
        jqElt.popover({
            "container": "body",
            "placement": "top",
            "animation": false,
            "html": true,
            "content": msg
        }); 
        jqElt.popover("show");
    }, this));    
};

/**
 * Destroy the height information popup
 */
magic.classes.ElevationPopup.prototype.destroyPopup = function() {
    jQuery(this.heightPopup.getElement()).popover("destroy");
};




/* Height graph plotting along a linestring, displayed in a popover */

magic.classes.HeightGraphPopup = function(options) {           
    
    magic.classes.DemAwareTool.call(this, options);
    
    /* Id of target element for the popover */
    this.target = options.target ? jQuery("#" + options.target) : null;
    
    /* How many sample points to use along line segments */
    this.interpolation = 5;
    
};

magic.classes.HeightGraphPopup.prototype = Object.create(magic.classes.DemAwareTool.prototype);
magic.classes.HeightGraphPopup.prototype.constructor = magic.classes.HeightGraphPopup;

/**
 * Display a 3D height graph along the given route in a popover
 * @param {ol.geom.Linestring} route
 */
magic.classes.HeightGraphPopup.prototype.activate = function(route) {
    var demFeats = this.currentlyVisibleDems();
    if (demFeats.length > 0) {
        var gfiRequests = [], outputCoords = [];
        var routePoints = route.getCoordinates();
        for (var i = 0; i < routePoints.length; i++) {
            /* Get the line segment endpoints */
            var c0 = routePoints[i];
            var c1 = i == routePoints.length - 1 ? null : routePoints[i+1];
            var nInterp = i == routePoints.length - 1 ? 1 : this.interpolation;            
            /* Interpolate along the line segment */
            for (var j = 0; j < nInterp; j++) {
                var cj = nInterp == 1 ? c0 : [c0[0] + j*(c1[0] - c0[0])/nInterp, c0[1] + j*(c1[1] - c0[1])/nInterp];
                /* Transform the co-ordinate to WGS84 for output, and add the z dimension */
                var llCoord = ol.proj.transform(cj, this.map.getView().getProjection(), "EPSG:4326");
                llCoord.push(0.0);  
                outputCoords.push(llCoord);
                /* Create the WMS GetFeatureInfo request for this point */
                var gfiXhr = jQuery.get(this.getGfiUrl(cj), 
                {
                    "LAYERS": demFeats.join(","),
                    "QUERY_LAYERS": demFeats.join(","),
                    "INFO_FORMAT": "application/json",
                    "FEATURE_COUNT": this.demLayers.length
                }, jQuery.proxy(function(data, status, xhr) {                   
                    var elevation = parseFloat(this.getDemValue(data));
                    outputCoords[xhr.offset][2] = isNaN(elevation) ? 0.0 : elevation;
                }, this));
                gfiXhr.offset = outputCoords.length - 1;
                gfiRequests.push(gfiXhr);                                
            }                                    
        }
        /* Start the elevation request chain */
        var defer = jQuery.when.apply(jQuery, gfiRequests);
        defer.always(jQuery.proxy(function() {
            this.target.attr("data-original-title", this.activeTooltip).tooltip("fixTitle");
            this.target.popover({
                template: 
                    '<div class="popover" role="popover">' +
                        '<div class="arrow"></div>' +                        
                        '<div id="' + this.id + '-height-graph-vis" style="width:550px;height:350px" class="popover-content"></div>' +
                    '</div>',
                placement: "bottom",
                container: "body",
                html: true,
                trigger: "manual",
                content: "Loading height graph..."
            })
            .on("shown.bs.popover", null, {"coords": outputCoords}, jQuery.proxy(function(evt) {            
                var xyzData = evt.data.coords;
                magic.modules.Common.getScript("https://cdn.web.bas.ac.uk/webmap-engine/1.0.0/js/vis-graph3d/4.21.0/vis-graph3d.min.js", jQuery.proxy(function() {
                    this.renderGraph(xyzData);
                }, this));                      
            }, this))
            .on("hidden.bs.popover", jQuery.proxy(function() {            
                this.target.attr("data-original-title", this.inactiveTooltip).tooltip("fixTitle");
            }, this));
            this.target.popover("show");
        }, this))
        .fail(jQuery.proxy(function(xhr) {
            var msg;
            try {
                msg = JSON.parse(xhr.responseText)["detail"];
            } catch(e) {
                msg = xhr.responseText;
            }
            magic.modules.Common.showAlertModal("Failed to generate data for height graph - details : " + msg, "warning");            
        }, this));        
    }
};

/**
 * Callback for 3D library load => render 3D dataset
 * @param {Object} xyzData
 */
magic.classes.HeightGraphPopup.prototype.renderGraph = function(xyzData) {
    var vds = new vis.DataSet();
    var xmin = Number.NaN, xmax = Number.NaN, ymin = Number.NaN, ymax = Number.NaN;
    for (var i = 0; i < xyzData.length; i++) {
        var x = xyzData[i][0];
        var y = xyzData[i][1];
        var z = xyzData[i][2];
        if (isNaN(xmin) || x < xmin) {
            xmin = x;
        }
        if (isNaN(xmax) || x > xmax) {
            xmax = x;
        }
        if (isNaN(ymin) || y < ymin) {
            ymin = y;
        }
        if (isNaN(ymax) || y > ymax) {
            ymax = y;
        }
        vds.add({
            x: x,   /* Lon */
            y: y,   /* Lat */
            z: z    /* Altitude */
        });
    }
    var wXbar = Math.max((xmax - xmin)/xyzData.length, 0.005);
    var wYbar = Math.max((ymax - ymin)/xyzData.length, 0.005);
    var options = {
        width: "500px",
        height: "300px",
        style: "bar",
        showLegend: true,
        showPerspective: true,
        showGrid: true,
        showShadow: false,
        keepAspectRatio: false,
        tooltip: function(o) {
            var x = magic.modules.GeoUtils.applyPref("coordinates", o.x, "lon");
            var y = magic.modules.GeoUtils.applyPref("coordinates", o.y, "lat");
            var z = magic.modules.GeoUtils.applyPref("elevation", o.z, this.units);
            return(z + " at (" + x + "," + y + ")");
        },
        tooltipStyle: {
            content: {
                background: "rgba(255, 255, 255, 0.7)",
                padding: "10px",
                borderRadius: "10px"
            },
            line: {
                borderLeft: "1px dotted rgba(0, 0, 0, 0.5)"
            },
            dot: {
                border: "5px solid rgba(0, 0, 0, 0.5)"
            }
        },
        verticalRatio: 0.4,   
        xBarWidth: wXbar,
        yBarWidth: wYbar,
        xLabel: "Lon",
        yLabel: "Lat",
        zLabel: "Altitude"
    };
    var container = jQuery("#" + this.id + "-height-graph-vis");
    var graph3d = new vis.Graph3d(container[0], vds, options);
};

magic.classes.HeightGraphPopup.prototype.deactivate = function() {
    if (this.target) {
        this.target.popover("hide");
    }
};

magic.classes.HeightGraphPopup.prototype.getInterpolation = function() {
    return(this.interpolation);
};

magic.classes.HeightGraphPopup.prototype.setInterpolation = function(interpolation) {
    this.interpolation = interpolation;
};


/* Issue information from Redmine */

magic.classes.IssueInformation = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = jQuery(".issue-info");
    
    /* Issue data (in Redmine JSON format) - probably very BAS-specific */
    this.issueData = magic.runtime.map_context.issuedata;
  
    /* Display issue information (if any) in top right corner of map */  
    if (this.issueData && !jQuery.isEmptyObject(this.issueData)) {
        this.target.removeClass("hidden").html(
            '<table class="table table-condensed" style="margin-bottom:0px">' + 
                '<tr><th>Issue ID</th><td>' + this.issueData.id + '</td></tr>' + 
                '<tr><th>Subject</th><td>' + this.issueData.subject + '</td></tr>' + 
                '<tr><th>Last updated</th><td>' + this.issueData.updated_on + '</td></tr>' +                             
            '</table>' 
        );
    } else {
        this.target.addClass("hidden");
    }
    
};

/**
 * Get the map and layer data associated with this issue
 * @return {Object|String}
 */
magic.classes.IssueInformation.prototype.getPayload = function() {
    var payload = "None";
    if (!jQuery.isEmptyObject(this.issueData)) {
        try {
            payload = JSON.parse(this.issueData.description)["description"];
        } catch(e) {}
    }
    return(payload);
};

/* Search for Rothera field reports as a Bootstrap popover */

magic.classes.RotheraReportSearch = function (options) {
   
    magic.classes.NavigationBarTool.call(this, options);
    
    /* Set style function */
    this.layer.setStyle(this.styleFunction);
    
    this.tagsInputs = {};
    
    /* Control callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function() {
                this.tagsInputs = {
                    "locations": new magic.classes.TagsInput({id: this.id + "-locations"}),
                    "people": new magic.classes.TagsInput({id: this.id + "-people"}),
                    "keywords": new magic.classes.TagsInput({id: this.id + "-keywords"})
                };               
                this.seasonSelect = new magic.classes.SeasonSelect(this.id + "-season-select-div");
                this.layer.set("fetcher", jQuery.proxy(this.fullFeatureDataFetch, this), true);
                this.setHoverHandlers();
                this.infoButtonHandler("source information", "Jo Rae to supply");
                jQuery("#" + this.id + "-locations").closest("div").find(".bootstrap-tagsinput :input").focus();            
            }, this),
        onDeactivate: jQuery.proxy(function() {
                this.map.un("pointermove");
                this.savedSearch = {};
                this.target.popover("hide");
            }, this), 
        onMinimise: jQuery.proxy(this.saveSearchState, this)
    });
    
    /* Season selector widget */
    this.seasonSelect = null;    
    
    /* Saved search, for re-populating the dialog when the popover has been hidden */
    this.savedSearch = {};
    
    /* Currently moused-over feature (displays spider of locations) */
    this.mousedOver = null;
    
    /* Attribute map for pop-ups */
    this.attribute_map = [
        {name: "id", alias: "Archives ref", displayed: true, "type": "xsd:string"},
        {name: "title", alias: "Title", displayed: true, "type": "xsd:string"},
        {name: "description", alias: "Description", displayed: true, "type": "xsd:string"},
        {name: "people", alias: "Personnel", displayed: true, "type": "xsd:string"},
        {name: "season", alias: "Season", displayed: true, "type": "xsd:string"},
        {name: "report", alias: "Report file", displayed: true, "type": "xsd:string"}
    ];
    this.layer.set("metadata", {
        attribute_map: this.attribute_map,
        is_interactive: true
    });
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.isActive() && !jQuery.isEmptyObject(this.savedSearch)) {
            this.restoreSearchState();
        }       
        /* Add reset button clickhandler */
        jQuery("#" + this.id + "-reset").click(jQuery.proxy(function(evt) {
            this.savedSearch = {};
            this.tagsInputs["locations"].reset();
            this.tagsInputs["people"].reset();
            this.tagsInputs["keywords"].reset();            
            this.seasonSelect.reset();
            this.layer.getSource().clear();
            jQuery("#" + this.id + "-results").addClass("hidden").html("");            
        }, this));
        /* Add search button click handler */
        jQuery("#" + this.id + "-search").click(jQuery.proxy(function(evt) {
            var errors = {};
            if (this.validate(errors)) {
                this.saveSearchState();
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/rothera_reports", 
                    data: JSON.stringify(this.payload()), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                    }
                })
                .done(jQuery.proxy(function(response) {
                        bootbox.hideAll();
                        /* Feed back the number of results */
                        var resultsBadge = jQuery("#" + this.id + "-results");
                        resultsBadge.html(response.length);
                        resultsBadge.removeClass("hidden");
                        /* Clear the layer */
                        this.layer.getSource().clear();
                        /* Display report locations */
                        for (var i = 0; i < response.length; i++) {
                            var featureData = response[i];
                            if (featureData.centroid != null) {                                
                                /* Get geometry of centroid of activity */
                                var strCoords = featureData.centroid.replace(/^POINT\(/, "").replace(/\)$/, "").split(" ");
                                var geom = new ol.geom.Point([parseFloat(strCoords[0]), parseFloat(strCoords[1])]);
                                geom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());                                
                                /* Plot a feature at the centroid of the fieldwork activity locations */                                
                                var feat = new ol.Feature({
                                    id: featureData.id, 
                                    geometry: geom, 
                                    layer: this.layer,
                                    _customHover: true,
                                    _ignoreClicks: false,
                                    _ignoreHovers: false,
                                    _locations: featureData.strplaces,
                                    _associates: []
                                });
                                this.layer.getSource().addFeature(feat); 
                            }            
                        }
                        if (response.length > 1) {
                            var dataExtent = magic.modules.GeoUtils.bufferExtent(this.layer.getSource().getExtent());                            
                            this.map.getView().fit(dataExtent, {padding: [20, 20, 20, 20]});
                        }
                        this.savedSearch["nresults"] = response.length;
                    }, this))
                .fail(function (xhr) {
                    var msg;
                    try {
                        msg = JSON.parse(xhr.responseText)["detail"];
                    } catch(e) {
                        msg = xhr.responseText;
                    }
                    magic.modules.Common.showAlertModal("Failed to execute your search - details : " + msg, "warning");                    
                });
                bootbox.dialog({
                    title: "Please wait",
                    message: '<p><i class="fa fa-spin fa-spinner"></i> Searching for reports...</p>'
                });                
            } else {
                magic.modules.Common.showAlertModal("Please correct the problems indicated below:<br/><br/>" + this.formatErrors(errors), "error");                
            }
        }, this));
    }, this));    
};

magic.classes.RotheraReportSearch.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.RotheraReportSearch.prototype.constructor = magic.classes.RotheraReportSearch;

/**
 * Form payload for the control (assumes form has been validated)
 * @return {Object}
 */
magic.classes.RotheraReportSearch.prototype.payload = function () {
    var payload = {};
    payload["locations"] = jQuery("#" + this.id + "-locations").val();
    payload["people"] = jQuery("#" + this.id + "-people").val();
    payload["keywords"] = jQuery("#" + this.id + "-keywords").val();
    payload = jQuery.extend(payload, this.seasonSelect.payload());    
    return(payload);
};

/**
 * Save the search values for pre-populating the form on re-show
 */
magic.classes.RotheraReportSearch.prototype.saveSearchState = function () {
    this.savedSearch = {};
    this.savedSearch["locations"] = jQuery("#" + this.id + "-locations").val();
    this.savedSearch["people"] = jQuery("#" + this.id + "-people").val();
    this.savedSearch["keywords"] = jQuery("#" + this.id + "-keywords").val();
    this.savedSearch["season"] = jQuery.extend(this.savedSearch, this.seasonSelect.saveState());    
};

/**
 * Restore saved search on re-show of the form pop-up
 */
magic.classes.RotheraReportSearch.prototype.restoreSearchState = function () {
    this.tagsInputs["locations"].setValue(this.savedSearch['locations']);
    this.tagsInputs["people"].setValue(this.savedSearch['people']);
    this.tagsInputs["keywords"].setValue(this.savedSearch['keywords']);   
    this.seasonSelect.restoreState(this.savedSearch['season']);
    var resultsBadge = jQuery("#" + this.id + "-results");
    resultsBadge.html(this.savedSearch["nresults"]);
    resultsBadge.removeClass("hidden");
};

/**
 * Form validation
 * @param {Object} errors
 * @return {boolean}
 */
magic.classes.RotheraReportSearch.prototype.validate = function (errors) {    
    return(this.seasonSelect.validate());
};

/**
 * Mark-up for the control
 */
magic.classes.RotheraReportSearch.prototype.markup = function () {
    return(
    '<form id="' + this.id + '-form">' + 
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-locations">Fieldwork location(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-locations" title="Enter location(s) of interest - click or type \'enter\' after each separate name">' + 
        '</div>' + 
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-people">Participant(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-people" title="Enter participant name(s) - click or type \'enter\' after each name">' + 
        '</div>' + 
        '<div class="form-group form-group-sm">' + 
            '<label>Season(s)</label>' + 
            '<div id="' + this.id + '-season-select-div"></div>' +                 
        '</div>' +         
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-locations">Keywords</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-keywords" title="Enter relevant keyword(s) - click or type \'enter\' after each word">' + 
        '</div>' +
        '<div class="form-group form-group-sm">' +
            '<button id="' + this.id + '-search" class="btn btn-sm btn-primary" type="button" ' + 
                'data-toggle="tooltip" data-placement="bottom" title="Show locations having fieldwork reports on the map">' + 
                '<span class="fa fa-search"></span>&nbsp;Search' + 
                '<span id="' + this.id + '-results" class="badge badge-alert hidden" style="margin-left:10px"></span>' +
            '</button>' + 
            '<button id="' + this.id + '-reset" class="btn btn-sm btn-danger" type="button" style="margin-left:5px" ' + 
                'data-toggle="tooltip" data-placement="bottom" title="Reset the form and clear results">' + 
                '<span class="fa fa-times-circle"></span>&nbsp;Reset' +
            '</button>' + 
            this.infoLinkButtonMarkup("Further information on sources") + 
        '</div>' + 
        this.infoAreaMarkup() + 
    '</form>'
    );
};

/**
 * Styling for the various feature types
 */
magic.classes.RotheraReportSearch.prototype.styleFunction = function (f) {
    var style = null;
    if (f.get("id").indexOf("-location") != -1) {
        var opacity1 = 1.0;
        var opacity2 = 0.8;
        if (f.get("hidden")) {
            opacity1 = opacity2 = 0.0;
        } else {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity2)
                    }),
                    radius: 3,
                    stroke: new ol.style.Stroke({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity1),
                        width: 1
                    })
                }),
                text: new ol.style.Text({
                    font: "Arial",
                    scale: 1.2,
                    offsetX: 0,
                    offsetY: -10,
                    text: f.get("name"),
                    textAlign: "left",
                    fill: new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity1)
                    })                    
                })
            });
        }        
    } else if (f.get("id").indexOf("-connector") != -1) {
        var opacity = f.get("hidden") ? 0.0 : 0.5;
        style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: magic.modules.Common.rgbToDec("#ff0000", opacity),
                width: 1.5
            })
        });
    } else {
        style = magic.modules.Common.getIconStyle(1.0, "field_report", [0.5, 0.5]);
    }    
    return(style);
};

/**
 * Mouseover handler for a report feature 
 * @param {ol.Feature} feat
 */
magic.classes.RotheraReportSearch.prototype.mouseover = function(feat) {    
    if (feat) {
        var fid = feat.get("id");
        if (!feat.get("_ignoreHovers") && jQuery.isArray(feat.get("_associates"))) {
            if (feat.get("_associates").length == 0) {
                /* The associated features spider (locations and connectors) need first to be created */
                var associates = [];
                if (feat.get("_locations")) {
                    var placeData = feat.get("_locations").split("~");
                    for (var j = 0; j < placeData.length; j++) {
                        var parts = placeData[j].split(/\sPOINT\(/);
                        var placeStrCoords = parts[1].replace(/\)$/, "").split(" ");
                        var placeGeom = new ol.geom.Point([parseFloat(placeStrCoords[0]), parseFloat(placeStrCoords[1])]);
                        placeGeom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                        var placeAttrs = {
                            id: fid + "-location",
                            name: parts[0],
                            layer: this.layer,
                            geometry: placeGeom,
                            hidden: true,
                            _ignoreClicks: true,
                            _ignoreHovers: true
                        };
                        var placeFeat = new ol.Feature(placeAttrs);
                        this.layer.getSource().addFeature(placeFeat); 
                        associates.push(placeFeat);
                        /* Plot a line feature between centroid and satellite */
                        var lineAttrs = {
                            id: fid + "-connector",
                            geometry: new ol.geom.LineString([feat.getGeometry().getCoordinates(), placeGeom.getCoordinates()]),
                            layer: this.layer,
                            hidden: true,
                            _ignoreClicks: true,
                            _ignoreHovers: true
                        };
                        var lineFeat = new ol.Feature(lineAttrs);
                        this.layer.getSource().addFeature(lineFeat);
                        associates.push(lineFeat);
                    }
                    feat.set("_associates", associates);
                }
            }
            jQuery.each(feat.get("_associates"), function(idx, f) {
                f.set("hidden", false);        
            });
            this.mousedOver = feat;
        }
    }    
};

/**
 * Mouseout handler for a report feature 
 */
magic.classes.RotheraReportSearch.prototype.mouseout = function() {    
    if (this.mousedOver) {        
        var associates = this.mousedOver.get("_associates");
        if (associates && jQuery.isArray(associates)) {
            jQuery.each(associates, function(idx, f) {
                f.set("hidden", true);        
            });
        }
        this.mousedOver = null;
    }     
};

/**
 * Activate a map pointermove event to do special mouseovers for layer features
 */
magic.classes.RotheraReportSearch.prototype.setHoverHandlers = function() {
    if (this.isActive()) {
        this.map.on("pointermove", jQuery.proxy(function(evt) {
            this.mouseout();
            jQuery("#" + evt.map.getTarget()).css("cursor", "help");
            evt.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
                if (layer == this.layer) {                
                   this.mouseover(feat);
                   jQuery("#" + evt.map.getTarget()).css("cursor", "pointer");
                   return(true);
                }
            }, this));     
        }, this)); 
    }
};

/**
 * Fetch the full attribute data for a feature in the layer, to avoid large bulk data transfers
 * @param {Function} callback
 * @param {Object} fdata
 * @param {int} i
 */
magic.classes.RotheraReportSearch.prototype.fullFeatureDataFetch = function(callback, fdata, i) {
    jQuery.ajax({
        url: magic.config.paths.baseurl + "/rothera_reports/data?id=" + encodeURIComponent(fdata.id), 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    })
    .done(jQuery.proxy(function(response) {
        var newdata = {
            id: response.id,
            title: response.title,
            description: response.description.replace("~", "'"),
            people: response.people ? (response.people.split("~").join("<br>")) : "",
            season: response.startdate && response.enddate 
                ? response.startdate.substr(response.startdate.length-4) + " - " + (parseInt(response.startdate.substr(response.startdate.length-4))+1)
                :  + "Unspecified",
            report: magic.config.paths.baseurl + "/rothera_reports/serve?filename=" + response.filename
        };
        fdata = jQuery.extend(fdata, newdata);
        callback(fdata, i);
    }, this))
    .fail(function (xhr) {
        var msg;
        try {
            msg = JSON.parse(xhr.responseText)["detail"];
        } catch(e) {
            msg = xhr.responseText;
        }
        magic.modules.Common.showAlertModal("Failed to get full attribute data for this report - details : " + msg, "warning");        
    });   
};

magic.classes.RotheraReportSearch.prototype.interactsMap = function () {
    return(true);
};

/* Get positions of all BAS and certain other ships */

magic.classes.ShipPositionButton = function (name, ribbon, options) {
    magic.classes.AssetPositionButton.call(this, name, ribbon, options);
    this.attribute_map = [
        {name: "callsign", alias: "Call sign", displayed: true},
        {name: "checktimestamp", alias: "Date", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true},
        {name: "speed", alias: "Speed", displayed: false}
    ];
};

magic.classes.ShipPositionButton.prototype = Object.create(magic.classes.AssetPositionButton.prototype);
magic.classes.ShipPositionButton.prototype.constructor = magic.classes.ShipPositionButton;

magic.classes.ShipPositionButton.prototype.getData = function() {
    /* Ship positional API */
    jQuery.ajax({
        /* Might be nice to get this listed as part of the maps.bas.ac.uk stable... */
        url: "https://add.data.bas.ac.uk/geoserver/assets/wfs?service=wfs&request=getfeature&version=2.0.0&typeNames=assets:latest_ship_positions&outputFormat=json",
        method: "GET",
        success: jQuery.proxy(function(data) {
            if (!this.geoJson) {
                return;
            }
            this.data = {
                inside: [],
                outside: []
            };   
            var feats = this.geoJson.readFeatures(data);
            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.map.getView().getProjection().getCode());
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var props = jQuery.extend({}, f.getProperties());
                var fclone = f.clone();
                fclone.setProperties(props);
                if (f.getGeometry().intersectsExtent(projExtent)) {                            
                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                    fclone.setStyle(magic.modules.VectorStyles["bas_ship"](magic.runtime.map.getView().getProjection().getCode()));
                    this.data.inside.push(fclone);
                } else {
                    fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
                    fclone.setStyle(magic.modules.VectorStyles["bas_ship"]("EPSG:3857"));
                    this.data.outside.push(fclone);
                }                        
            }, this));
            this.layer.getSource().clear();
            if (this.data.inside.length > 0) {
                this.layer.getSource().addFeatures(this.data.inside);
            }
            if (this.data.outside.length > 0) {
                if (this.insetLayer) {
                    this.insetLayer.getSource().clear();
                    var osClones = jQuery.map(this.data.outside, function(f) {
                        return(f.clone());
                    });      
                    this.insetLayer.getSource().addFeatures(osClones); 
                }
                if (magic.runtime.inset) {
                    magic.runtime.inset.activate();
                }
            }                  
        }, this),
        error: function(jqXhr, status, msg) {
            console.log("Failed to get ship positional data - potential network outage?");
        }
    });
};
/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function () {
    
    /**
     * Application payload is in:
     * 
     * magic.runtime.map_context
     * 
     * User preferences in:
     * 
     * magic.runtime.map_context.preferencedata
     */ 
    
    /* Mouseover highlighted feature/layer object */
    this.highlighted = null;
    
    /* Set container sizes */
    this.fitMapToViewport(); 
    
    /* Redmine issue to replay */
    magic.runtime.issue = new magic.classes.IssueInformation();
    
    /* User unit preferences */
    magic.runtime.preferences = jQuery.extend({},
        magic.modules.GeoUtils.DEFAULT_GEO_PREFS,
        {dates: "dmy"},
        magic.runtime.map_context.preferencedata 
    );
    
    /* Initialise map view (returns the initialisation values for the view) */
    var view = this.initView();
    
    /* Set up layer tree */    
    magic.runtime.endpoints = magic.runtime.map_context.endpoints;
    this.layertree = new magic.classes.LayerTree("layer-tree", this);                   

    /* Set up drag and drop interaction for quick visualisation of GPX and KML files */
    this.ddGpxKml = new magic.classes.DragDropGpxKml({});
    
    /* Set up OL map */
    magic.runtime.map = new ol.Map({
        renderer: "canvas",
        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,
        layers: this.layertree.getLayers(),
        controls: [
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function (xy) {
                    return(
                        "Lat : " + magic.modules.GeoUtils.applyPref("coordinates", xy[1].toFixed(2), "lat") + ", " + 
                        "lon : " + magic.modules.GeoUtils.applyPref("coordinates", xy[0].toFixed(2), "lon")                         
                    );
                }
            })
        ],
        interactions: ol.interaction.defaults().extend([this.ddGpxKml.getDdInteraction()]),
        target: "map",
        view: view
    });

    /* Initialise map control button ribbon */    
    new magic.classes.ControlButtonRibbon();

    /* Create a popup overlay and add handler to show it on clicking a feature */
    this.featureinfotool = new magic.classes.FeatureInfoTool();
    this.featureinfotool.activate();
    magic.runtime.layer_visibility_change_callback = jQuery.proxy(this.featureinfotool.layerVisibilityHandler, this.featureinfotool);
    
    /* Create information modal */
    new magic.classes.InfoModal();
    
    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap();

    /**
     * Allocation and initialise the navigation bar toolset
     */    
    this.navbarTools = {
        "geosearch": this.allocateNavbarTool("geosearch", "Geosearch", {
            gazetteers: magic.runtime.map_context.data.gazetteers,
            target: "geosearch-tool"
        }),
        "measurement": this.allocateNavbarTool("measurement", "Measurement", {
            target: "measure-tool"
        }),
        "overview_map": this.allocateNavbarTool("overview_map", "OverviewMap", {
            target: "overview-map-tool",
            layertree: this.layertree
        }),
        "feedback": this.allocateNavbarTool("feedback", "Feedback", {
            target: "feedback-tool"
        }),               
        "personaldata": this.allocateNavbarTool("personaldata", "PersonalData", {
            target: "personaldata-tool"
        }),
        "download_data": this.allocateNavbarTool("download_data", "DownloadRepo", {
            target: "repo-tool"
        }),
        "rothera_reports": this.allocateNavbarTool("rothera_reports", "RotheraReportSearch", {
            id: "rothera-reports-tool",
            target: "rothera_reports",
            caption: "Search fieldwork reports",
            layername: "Rothera fieldwork reports",
            popoverClass: "reports-popover",
            popoverContentClass: "reports-popover-content"
        })
    };  
    /* End of navigation bar toolset */
    
    /* Updates height of map when window resizes */
    jQuery(window).on("resize", jQuery.proxy(function () {
        this.fitMapToViewport();
    }, this));

    /* Set handlers for overview map status change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function (evt) {
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (this.navbarTools["overview_map"]) {
            this.navbarTools["overview_map"].setEnabledStatus();
        }
    }, this);

    /* Display application metadata */
    this.initMapMetadata();
    
    /* Display login menu */
    this.activateLogoutMenu();
    
    /* Set up map interaction activate/deactivate handlers to avoid map tool conflicts */
    this.setMapInteractionToolHandlers();
    
    /* Mouseover of the map scale bar to provide tooltip of the current map scale */
    this.enableScalelinePopover();
    
    /* Allow mouseover labels for point vector layers */
    this.setVectorLayerLabelHandler();
    
    /* Add all the markup and layers for autoload groups */
    this.layertree.initAutoLoadGroups(magic.runtime.map);    
   
    /* Display watermark if required */
    this.displayWatermark();
    
    /* Display any announcement required */
    this.displayAnnouncement();
};

/**
 * Set the top level map metadata
 */
magic.classes.AppContainer.prototype.initMapMetadata = function() {
    var context = magic.runtime.map_context;
    jQuery("#apptitle").text(context.title);
    jQuery(document).attr("title", context.title);
    jQuery("meta[name='description']").attr("content", context.title);
    if (context.logo) {
        jQuery("#applogo").attr("src", context.logo);
    }
    jQuery("#appurl").attr("href", context.metadata_url);    
};

/**
 * Allocate/initialise a navigation bar tool button
 * @param {String} name
 * @param {String} className
 * @param {Object} opts
 */
magic.classes.AppContainer.prototype.allocateNavbarTool = function(name, className, opts) {
    var tool = null;
    var target = jQuery("#" + opts.target);
    if (target.length > 0) {
        if (jQuery.inArray(name, magic.runtime.map_context.data.controls) != -1) {
            /* Activate tool */
            tool = new magic.classes[className](opts);       
            target.closest("li").show();
        } else {
            /* Hide the tool button if it was not asked for */
            target.closest("li").hide();
        }
    }
    return(tool);
};

/**
 * Set up view
 * @return {object} 
 */
magic.classes.AppContainer.prototype.initView = function() {
    var view;
    var viewData = magic.runtime.map_context.data;
    var proj = ol.proj.get(viewData.projection); 
    var issueLayerData = magic.runtime.issue.getPayload();
    /* Determine centre of map - could come from basic view, a search string or user map data */
    var mapCenter = issueLayerData == "None" 
        ? (!jQuery.isEmptyObject(magic.runtime.map_context.userdata) ? magic.runtime.map_context.userdata.center : viewData.center)
        : issueLayerData.center;    
    /* Determine zoom of map - could come from basic view, a search string or user map data */
    var mapZoom = issueLayerData == "None" 
        ? (!jQuery.isEmptyObject(magic.runtime.map_context.userdata) ? magic.runtime.map_context.userdata.zoom : viewData.zoom)
        : issueLayerData.zoom;    
    var mapRotation = viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0;
    if (!jQuery.isEmptyObject(magic.runtime.map_context.userdata)) {
        mapRotation = magic.runtime.map_context.userdata.rotation || 0.0;
    }
    if (viewData.projection == "EPSG:3857") {
        /* Spherical Mercator (OSM/Google) - note DON'T set projection extent as bizarre 15km shifts */
        view = new ol.View({
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
            projection: proj,
            minZoom: 1, 
            maxZoom: 20
        });
    } else {
        /* Other projection */
        proj.setExtent(viewData.proj_extent);
        proj.setWorldExtent(viewData.proj_extent);   
        view = new ol.View({
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
            projection: proj,
            proj_extent: viewData.proj_extent,
            extent: viewData.proj_extent,
            maxResolution: viewData.resolutions[0], 
            resolutions: viewData.resolutions
        });
    }        
    return(view);
};

/**
 * Adjust width and height of map container to occupy all space apart from sidebar and top navigation *
 */
magic.classes.AppContainer.prototype.fitMapToViewport = function () {
    var sideBar = jQuery("div#layer-tree");
    var sbWidth = 0;
    var mapContainer = jQuery("#map-container");
    if (sideBar.length == 0 || sideBar.is(":hidden")) {
        /* Set map to start at left margin */
        mapContainer.css("left", 0);
    } else {
        /* Restore sidebar */
        sbWidth = sideBar.width();
        mapContainer.css("left", sbWidth);
    }
    mapContainer.height(window.innerHeight - jQuery("div.navbar-header").height());
    mapContainer.width(window.innerWidth - sbWidth);
    if (magic.runtime.map) {
        magic.runtime.map.updateSize();
    }
};

/**
 * Enable logout menu     
 */
magic.classes.AppContainer.prototype.activateLogoutMenu = function () {
    jQuery("ul.navbar-right").removeClass("hidden").show();
    /* Activate logout menu */
    var lo = jQuery("#log-out-user");
    if (lo.length > 0) {
        lo.click(function (evt) {
            evt.preventDefault();
            jQuery("#logout-form").submit();
        });
    }
};

/**
 *  Listen for controls being activated/deactivated 
 */
magic.classes.AppContainer.prototype.setMapInteractionToolHandlers = function () {
    jQuery(document).on("mapinteractionactivated", jQuery.proxy(function (evt, tool) {
        if (evt) {
            jQuery.each(this.navbarTools, jQuery.proxy(function (toolName, toolObj) {
                if (toolObj != null && tool != toolObj) {
                    /* Deactivate all other tools and hide their popovers */
                    if (jQuery.isFunction(toolObj.deactivate)) {
                        toolObj.deactivate();
                    }                        
                    if (jQuery.isFunction(toolObj.getTarget)) {
                        toolObj.getTarget().popover("hide");
                    }
                }
            }, this));
            if (tool != this.navbarTools["measurement"]) {
                /* Allow clicking on features (gets in the way bigtime when measuring!) */
                this.featureinfotool.activate();
            } else {
                this.featureinfotool.deactivate();
            }
        }
    }, this)); 
    jQuery(document).on("mapinteractiondeactivated", jQuery.proxy(function (evt, tool) {
        if (evt) {
            var nActive = 0;
            jQuery.each(this.navbarTools, function (toolName, toolObj) {
                if (toolObj != null && jQuery.isFunction(toolObj.interactsMap) && toolObj.interactsMap() === true && tool != toolObj) {
                    if (jQuery.isFunction(toolObj.isActive) && toolObj.isActive()) {
                        nActive++;
                    }
                }
            });
            if (nActive == 0) {
                this.featureinfotool.activate();
            }
        }
    }, this)); 
};

/**
 * Enable a popover on hover over the map scale line
 */
magic.classes.AppContainer.prototype.enableScalelinePopover = function() {
    jQuery(".custom-scale-line-top").popover({
        container: "body",
        content: function() {
            /* Do a bit of rounding when the scale value is not a precise integer */
            var scale = magic.modules.GeoUtils.getCurrentMapScale(magic.runtime.map) + "";
            var dp1 = scale.indexOf(".");
            if (dp1 >= 0) {
                var dp2 = scale.indexOf("9");                
                var scaleFactor = Math.pow(10, dp1-dp2);
                scale = scaleFactor * Math.round(parseFloat(scale)/scaleFactor);
            }
            return("Map scale 1:" + scale);
        },
        placement: "right",
        title: "",
        trigger: "hover"
    });
};

/**
 * Enable a default mouseover label on vector layers
 */
magic.classes.AppContainer.prototype.setVectorLayerLabelHandler = function() {
    magic.runtime.map.on("pointermove", jQuery.proxy(function(evt) {
        magic.modules.Common.defaultMouseout(this.highlighted);
        this.highlighted = magic.modules.Common.defaultMouseover(evt);
    }, this)); 
};

/**
 * Display a semi-transparent watermark image in a corner of the map, if required
 */
magic.classes.AppContainer.prototype.displayWatermark = function() {
    var wmkUrl = magic.runtime.map_context.watermark;
    if (wmkUrl) {
        var wmkDiv = jQuery("div.watermark"); 
        if (wmkDiv.length > 0) {
            wmkDiv.append('<img src="' + wmkUrl + '" alt="watermark"></img>');
        }
    }
};  

/**
 * Display a semi-transparent watermark image in a corner of the map, if required
 */
magic.classes.AppContainer.prototype.displayAnnouncement = function() {
    var announceContent = magic.runtime.map_context.newslink;
    if (announceContent) {
        /* Show the announcement unless cookie has been set */
        var announceModal = jQuery("#announcement-modal");
        var cookieName = "announcement_seen_" + magic.runtime.map_context.name;
        if (announceModal.length > 0 && Cookies.get(cookieName) == "") {
            if (announceContent.indexOf(magic.config.paths.baseurl) != 0) {
                announceContent = magic.modules.Commmon.proxyUrl(announceContent);
            }
            var modalBody = announceModal.find(".modal-body");
            var contentDiv = modalBody.find("#announcement-content");
            if (contentDiv.length > 0) {
                contentDiv.load(announceContent, function(html, status) {
                    if (status == "success") {
                        /* Resize the modal */
                        modalBody.css({
                            width: "auto",
                            height: "auto", 
                            "max-height": "90%"
                        });
                        jQuery("#announcement-close").on("click", function(evt) {
                            if (jQuery("#announcement-dismiss").prop("checked")) {
                                Cookies.set(cookieName, "yes", {expires: 1000});
                            }
                            announceModal.modal("hide");
                        });
                        announceModal.modal("show");
                    }
                });                
            }
        }
    }
};

/**
 * Get layer by name
 * @param {string} layerName
 * @returns {ol.Layer}
 */
magic.classes.AppContainer.prototype.getLayerByName = function(layerName) {
    var theLayer = null;
    magic.runtime.map.getLayers().forEach(function (layer) {
        if (layer.get("name") == layerName) {
            theLayer = layer;
        }
    });
    return(theLayer);
};


/* Attribution and legend modal dialog */

magic.classes.AttributionModal = function(options) { 
    
    /* API */
    this.target = options.target;
    this.wms = options.wms;
    
    /* Internal */
    this.layer = null;
    this.caption = "";
    this.metadataRecord = [
        {name: "abstract", caption: "Abstract", type: "long_text"},
        {name: "srs", caption: "Projection", type: "text"},
        {name: "wmsfeed", caption: "OGC WMS", type: "text"},
        {name: "keywords", caption: "Keywords", type: "text"},
        {name: "bboxsrs", caption: "Bounds (SRS)", type: "text"},
        {name: "bboxwgs84", caption: "Bounds (WGS84)", type: "text"},
        {name: "attribution", caption: "Attribution", type: "text"},
        {name: "metadataurl", caption: "Metadata URL", type: "text"},
        {name: "dataurl", caption: "Get data URL", type: "text"}
    ];
    var attributionMarkup = jQuery("#attribution-modal");
    if (attributionMarkup.length == 0) {
        jQuery("#map-container").after(
            '<!-- Attribution modal -->' + 
            '<div class="modal fade" id="attribution-modal" tabindex="-1" role="dialog" aria-labelledby="attribution-title" aria-hidden="true">' + 
                '<div class="modal-dialog modal-sm">' + 
                    '<div class="modal-content" style="width:400px">' + 
                        '<div class="modal-header">' + 
                            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + 
                            '<h4 class="modal-title" id="attribution-title">Layer name</h4>' + 
                        '</div>' + 
                        '<div class="modal-body attribution-content">' + 
                            '<div role="tabpanel">' + 
                                '<ul class="nav nav-tabs" role="tablist">' + 
                                    '<li role="presentation" class="active">' + 
                                        '<a role="tab" data-toggle="tab" href="#attribution-legend" aria-controls="attribution-legend">Legend</a>' + 
                                    '</li>' + 
                                    '<li role="presentation">' + 
                                        '<a role="tab" data-toggle="tab" href="#attribution-metadata" aria-controls="attribution-metadata">Metadata</a>' + 
                                    '</li>' + 
                                '</ul>' + 
                                '<div class="tab-content">' + 
                                    '<div id="attribution-legend" role="tabpanel" class="tab-pane active">' + 
                                        'Loading legend...' + 
                                    '</div>' +
                                    '<div id="attribution-metadata" role="tabpanel" class="tab-pane">' + 
                                        'Loading metadata...' + 
                                    '</div>' + 
                                '</div>' + 
                            '</div>' + 
                        '</div>' + 
                        '<div class="modal-footer attribution-footer">' + 
                            '<button type="button" class="btn-sm btn-primary" data-dismiss="modal">Close</button>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
            '</div>'
        );
    };
    jQuery("#" + this.target).on("shown.bs.modal", jQuery.proxy(function() {
        this.legendMarkup();  
        jQuery('a[href="#attribution-legend"]').tab("show");
    }, this));
    jQuery('a[href="#attribution-legend"]').on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Legend */
        this.legendMarkup();        
    }, this));
    jQuery('a[href="#attribution-metadata"]').on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Metadata */            
        this.metadataMarkup();        
    }, this));   
};

/**
 * Set the modal to display data for the given layer
 * @param {ol.Layer} layer
 */
magic.classes.AttributionModal.prototype.show = function(layer) {
    this.layer = layer;
    jQuery("#attribution-title").html(layer.get("name"));
    jQuery("#" + this.target).modal("show");
};

/**
 * Create the legend markup
 */
magic.classes.AttributionModal.prototype.legendMarkup = function() {
    var legendUrl = null; 
    var content = '<div class="attribution-legend-content">';
    if (this.layer && this.layer.get("metadata")) {
        var md = this.layer.get("metadata");        
        if (md.legend_graphic) {
            /* Non-WMS derived legend graphic e.g. a canned image */
            legendUrl = md.legend_graphic;
        } else if (md.source.wms_source) {
            /* Derive from same WMS as layer */
            var wmsUrl = md.source.wms_source;
            var styles = "";
            if (jQuery.isFunction(this.layer.getSource().getParams)) {
                styles = this.layer.getSource().getParams()["STYLES"];
            }
            /* User may have changed the style of the layer, so important that we don't retrieve from browser cache - David 17/02/2017 */
            var cacheBuster = "&buster=" + new Date().getTime();
            /* Geoserver vendor options, should have no effect for other WMS services like MapServer */
            var geoserverOpts = "&legend_options=fontName:Bitstream Vera Sans Mono;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180";
            legendUrl = magic.modules.Endpoints.getOgcEndpoint(wmsUrl, "wms") + 
                "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20" + 
                "&style=" + styles + 
                "&layer=" + md.source.feature_name + 
                geoserverOpts + 
                cacheBuster;            
        }
    }
    if (legendUrl != null) {
        content += 
            '<div style="width:100%;background-color:#272b30">' + 
                '<img style="padding:10px;background-color:#272b30" src="' + legendUrl + '" alt="legend"></img>' + 
            '</div>';  
    } else {
        content += '<div class="attribution-title">No legend available</div>';
    }
    content += '</div>';
    jQuery("#attribution-legend").html(content);
};

/**
 * Create the metadata markup
 */
magic.classes.AttributionModal.prototype.metadataMarkup = function() {
    var md = this.layer.get("metadata");
    if (md) {
        if (md.source.wms_source || (md.source.geojson_source && md.source.feature_name)) {
            /* WMS source, or GeoJSON WFS */
            var wmsUrl;
            if (md.source.geojson_source) {
                /* This is probably only going to work as an approach with Geoserver */
                wmsUrl = md.source.geojson_source.replace("wfs", "wms");
            } else {
                wmsUrl = md.source.wms_source;
            }
            magic.modules.Common.getCapabilities(wmsUrl, jQuery.proxy(this.populateRecordWms, this), md.source.feature_name);        
        } else {
            /* Vector source */
            var sourceUrl = null;
            if (md.source.geojson_source) {
                sourceUrl = md.source.geojson_source;            
            } else if (md.source.gpx_source) {
                sourceUrl = md.source.gpx_source;            
            } else if (md.source.kml_source) {
                sourceUrl = md.source.kml_source;            
            }
            if (sourceUrl != null && sourceUrl.match("/entry/get") != null && sourceUrl.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/) != null) {
                /* Ramadda repository URL */
                var mdUrl = sourceUrl.replace("/get", "/show") + "&output=json";
                jQuery.getJSON(mdUrl, jQuery.proxy(this.populateRecordRamadda, this))
                .fail(function(xhr, status, errmsg) {
                    var message = "Failed to get metadata from Ramadda, error was : " + errmsg;
                    if (status == 401) {
                        "Not authorised to get metadata from Ramadda";
                    }
                    jQuery("#attribution-metadata").html(message);
                });
            } else {
                jQuery("#attribution-metadata").html("No metadata available");
            }
        }
    } else {
        jQuery("#attribution-metadata").html("No metadata available");
    }
};

/**
 * Populate a metadata record using Ramadda metadata
 * @param {Object} data
 */
magic.classes.AttributionModal.prototype.populateRecordRamadda = function(data) {
    var rec = {};
    var json = data[0];
    if (json) {        
        /* Read abstract */
        var abstractBits = [];
        jQuery.each(["name", "description", "typeName", "createDate", "filename", "filesize"], function(idx, fld) {
            if (json[fld]) {
                abstractBits.push(fld + " : " + json[fld]);
            }
        });
        rec["abstract"] = abstractBits.join("<br>");
        /* Read SRS */
        rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");                
        /* Read keywords */
        rec["keywords"] = json["type"];        
        /* Read WGS84 bounding box */
        rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(json["bbox"], 1);        
        /* Read metadata URLs */
        if (jQuery.isArray(json["services"])) {            
            var links = [];
            jQuery.each(json["services"], function(mui, murl) {
                links.push('<a href="' + murl["url"] + '" target="_blank">[external resource]</a>');
            });
            rec["metadataurl"] = links.join("<br>");
        }
    } else {
        rec = {"error": "Malformed metadata from Ramadda"};
    }
    this.tabulate(rec);
};

/**
 * Populate a WMS metadata record from WMS GetCapabilities
 * @param {Object} getCaps GetCapabilities document
 * @param {string} featureName
 * @param {string} errMsg
 */
magic.classes.AttributionModal.prototype.populateRecordWms = function(getCaps, featureName, errMsg) {    
    var rec = {};
    if (getCaps) {
        var proj = magic.runtime.map.getView().getProjection().getCode();
        var caps = this.findFeatureInCaps(getCaps, featureName);
        if (caps != null) {
            /* Read abstract */
            rec["abstract"] = caps["Abstract"] || "";
            /* Read SRS */
            rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");
            if (jQuery.isArray(caps["CRS"])) {        
                for (var i = 0; i < caps["CRS"].length; i++) {
                    if (caps["CRS"][i] == proj) {
                        rec["srs"] = magic.modules.GeoUtils.formatProjection(caps["CRS"][i]);
                        break;
                    }
                }
            }
            /* Read WMS feed */
            var wmsSource = this.layer.get("metadata")["source"]["wms_source"];
            if (wmsSource) {
                rec["wmsfeed"] = magic.modules.Endpoints.getOgcEndpoint(wmsSource, "wms") + "?" + 
                    "SERVICE=WMS&" + 
                    "VERSION=1.3.0&" + 
                    "REQUEST=GetMap&" + 
                    "FORMAT=image/png&" + 
                    "TRANSPARENT=true&" + 
                    "LAYERS=" + featureName + "&" + 
                    "CRS=" + proj + "&" + 
                    "SRS=" + proj + "&" + 
                    "TILED=true&" + 
                    "WIDTH=1000&" + 
                    "HEIGHT=1000&" + 
                    "STYLES=&" + 
                    "BBOX=" + magic.runtime.map.getView().getProjection().getExtent().join(",");
            } else {
                rec["wmsfeed"] = "Not available";
            }
            /* Read keywords */
            rec["keywords"] = caps["KeywordList"] ? caps["KeywordList"].join("<br>") : "";
            /* Read SRS bounding box */
            if (jQuery.isArray(caps["BoundingBox"])) {
                jQuery.each(caps["BoundingBox"], function(idx, bb) {
                    if (bb.crs == magic.runtime.map.getView().getProjection().getCode()) {
                        rec["bboxsrs"] = magic.modules.GeoUtils.formatBbox(bb.extent, 0);
                        return(false);
                    }
                }); 
            }
            /* Read WGS84 bounding box */
            if (jQuery.isArray(caps["EX_GeographicBoundingBox"])) {
                rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(caps["EX_GeographicBoundingBox"], 0);
            }
            /* Read attribution */
            if (caps["Attribution"]) {
                var value = caps["Attribution"];
                if ("source" in value && "url" in value) {
                    rec["attribution"] = '<a href="' + value.url + '">' + value.source + '</a>';
                }
            }
            /* Read metadata URL(s) */
            if (caps["MetadataURL"]) {
                var value = caps["MetadataURL"];    
                if (!jQuery.isArray(value)) {    
                    value = [value];
                }
                var links = [];
                jQuery.each(value, function(mui, murl) {
                    links.push('<a href="' + murl["OnlineResource"] + '" target="_blank">[external resource]</a>');
                });
                rec["metadataurl"] = links.join("<br>");
            }
            /* Read data URL(s) */
            if (caps["DataURL"]) {
                var value = caps["DataURL"];    
                if (!jQuery.isArray(value)) {    
                    value = [value];
                }
                var links = [];
                jQuery.each(value, function(dui, durl) {
                    links.push('<a href="' + durl["OnlineResource"] + '" target="_blank">[get data]</a>');
                });
                rec["dataurl"] = links.join("<br>");
            }
        } else {
            rec = {"error": "No entry for feature in capabilities document - has it been deleted?"};
        }
    } else {
        rec = {"error": errMsg};
    }
    this.tabulate(rec);
};

/**
 * Find the entry for 'featName' in the capabilities document - copes with legacy decisions about the presence/absence of a <namespace>: at the beginning of 
 * the feature name
 * @param {Object} caps
 * @param {String} featName
 * @return {Object}
 */
magic.classes.AttributionModal.prototype.findFeatureInCaps = function(caps, featName) {
    if (!caps[featName]) {
        /* Do more work => scan the capabilities object for a key match without the namespace */
        var matches = [];
        for (var key in caps) {
            if (featName == key.split(":").pop()) {
                matches.push(key);
            }
        }
        if (matches.length == 1) {
            return(caps[matches[0]]);
        } else {
            /* Ambiguous, so give up rather than return the wrong metadata */
            return(null);
        }
    } else {
        return(caps[featName]);
    }
};
    
/**
 * Tabulate the metadata record
 * @param {object} rec
 * @return {string} content
 */
magic.classes.AttributionModal.prototype.tabulate = function(rec) {    
    var content = '<table id="attribution-metadata-content" class="table table-striped table-condensed metadata-table show">';
    if (rec != null) {
        if (rec.error) {
            /* Something went wrong fetching the data, report in rec.error */
            content += '<tr><td colspan="2">' + rec.error + '</td></tr>';
        } else {
            /* Render metadata record */
            jQuery.each(this.metadataRecord, function(mi, mf) {
                var value = rec[mf.name];
                if (value) {
                    /* Format table row */
                    var heading = '<strong>' + mf.caption + '</strong>';
                    var linkVal = magic.modules.Common.linkify(value);
                    content += '<tr>';
                    if (mf.type == "long_text") {                    
                        content += '<td colspan="2" class="metadata" style="background-color: inherit">' + heading + '<div>' + linkVal + '</div></td>';
                    } else {
                        content += '<td valign="top" style="width:120px">' + heading + '</td><td class="metadata" style="width:270px">' + linkVal + '</td>';
                    }
                    content += '</tr>';
                }
            });
        }
    } else {        
        content += '<tr><td colspan="2">No metadata available</td></tr>';
    }
    content += '</table>';
    jQuery("#attribution-metadata").html(content);
};

/* Ribbon of map control buttons */

magic.classes.ControlButtonRibbon = function(config, map) {
    
    this.buttons = config || magic.runtime.map_context.data.controls;
    
    this.map = map || magic.runtime.map;
                   
    var id = "control-button-ribbon", ribbonId = id + "-group", maximiseId = "maximise-" + ribbonId;
    
    /* Get position for ribbon */
    var ribbonTop = "0px", ribbonLeft = "0px";        
    /* Subtract off the height of the navigation bar */
    var nav = jQuery("nav.navbar");
    if (nav.length > 0) {            
        ribbonTop = (nav.outerHeight()-50) + "px";
    }
        
    /* Add the outer markup and the maximise button */
    var insertAt = jQuery(this.map.getTargetElement()).find("div.ol-overlaycontainer-stopevent");
    insertAt.prepend(
        '<div id="' + id + '" style="position:absolute; left:  ' + ribbonLeft + '; top: ' + ribbonTop + '" class="btn-toolbar">' + 
            '<div id="' + ribbonId + '" class="btn-group button-ribbon show"></div>' +   
            '<div id="' + maximiseId + '" class="btn-group button-ribbon hidden"></div>' + 
        '</div>'
    );
    this.ribbonDiv = jQuery("#" + ribbonId);   
    this.maximiseDiv = jQuery("#" + maximiseId);
    
    /* Initialise tooltips and popovers */
    jQuery("body").tooltip({selector: "[data-toggle=tooltip]", container: "body"});
    jQuery(this.map.getTargetElement()).parent().popover({selector: "[data-toggle=popover]", container: "#" + this.map.getTargetElement().id});
    
    jQuery.each(this.buttons, jQuery.proxy(function(bidx, bname) {                
        switch(bname) {
            case "zoom_world":
                /* Zoom world */
                this.createControlButton("zoom-world", "fa fa-globe", bidx, "Reset to original map extent")
                .on("click", jQuery.proxy(this.zoomToMaxExtent, this));                         
                break;
                
            case "zoom_in":
                /* Zoom in */
                this.createControlButton("zoom-in", "fa fa-search-plus", bidx, "Zoom map in")
                .on("click", {delta: 1}, jQuery.proxy(this.zoomByDelta, this));                        
                break;
                
            case "zoom_out":
                /* Zoom out */
                this.createControlButton("zoom-out", "fa fa-search-minus", bidx, "Zoom map out")
                    .on("click", {delta: -1}, jQuery.proxy(this.zoomByDelta, this));                        
                break;   
            
            case "box_zoom":
                /* Drag a box to zoom in */
                this.appendControlButton(new magic.classes.DragZoomButton("box-zoom", this).getButton());
                break;
                
            case "full_screen":
                /* Full screen map view */
                this.appendControlButton(new magic.classes.FullScreenButton("full-screen", this).getButton());                
                break;
                
            case "rotation":
                /* Reset the rotation of the map */                                
                this.appendControlButton(new magic.classes.ResetRotationButton("rotation", this).getButton()); 
                break;       
                
            case "graticule":
                /* Show graticule */                                
                this.appendControlButton(new magic.classes.GraticuleButton("graticule", this).getButton()); 
                break;       
                
            case "geolocation":
                /* Show geolocation */                                
                this.appendControlButton(new magic.classes.GeolocationButton("geolocation", this).getButton()); 
                break;       
            
            case "aircraft":
                /* Positions of BAS aircraft */                                
                this.appendControlButton(new magic.classes.AircraftPositionButton("aircraft-position", this, {
                    "title": "BAS aircraft",
                    "iconClass": "fa fa-plane"
                }).getButton()); 
                break;
                
            case "ships":
                /* Positions of BAS ships */                                
                this.appendControlButton(new magic.classes.ShipPositionButton("ship-position", this, {
                    "title": "BAS ships",
                    "iconClass": "fa fa-ship"
                }).getButton()); 
                break;       
                
            default:
                break;
        }
    }, this));
    /* Add a minimise ribbon button */
    this.createControlButton("minimise-control-ribbon", "fa fa-caret-left", this.buttons.length, "Minimise control toolbar")
    .on("click", jQuery.proxy(function() {
        this.maximiseDiv.toggleClass("hidden");
        this.ribbonDiv.toggleClass("hidden");
    }, this));
    /* Add a maximise ribbon button */    
    this.createControlButton("maximise-control-ribbon", "fa fa-caret-right", -1, "Maximise control toolbar", this.maximiseDiv)
    .on("click", jQuery.proxy(function() {
        this.ribbonDiv.toggleClass("hidden");
        this.maximiseDiv.toggleClass("hidden");
    }, this));
};

magic.classes.ControlButtonRibbon.prototype.getDiv = function() {
    return(this.ribbonDiv);
};

magic.classes.ControlButtonRibbon.prototype.appendControlButton = function(btn) {
    btn.appendTo(this.ribbonDiv);
};

/**
 * Create a clickable control button
 * @param {string} name
 * @param {string} glyph
 * @param {int} ribbonPos
 * @param {string} title
 * @param {Object} div 
 * @returns {jQuery.Object}
 */
magic.classes.ControlButtonRibbon.prototype.createControlButton = function(name, glyph, ribbonPos, title, div)  {
    if (!div) {
        div = this.ribbonDiv;
    }
    var modifierClass = "ribbon-middle-tool";
    if (ribbonPos == this.buttons.length) {
        /* Last button in toolbar does minimise */
        modifierClass = "ribbon-last-tool maxmin-button";
    } else if (ribbonPos < 0) {
        /* Convention for a maximise button */
        modifierClass = "ribbon-last-tool maxmin-button";
    }
    var btn = jQuery('<button>', {
        "id": "btn-" + name,
        "class": "btn btn-default " + modifierClass,
        "data-toggle": "tooltip",
        "data-placement": ribbonPos <= 0 ? "right" : "bottom",
        "title": title,
        "html": '<span class="' + glyph + '"></span>'
    });
    btn.appendTo(div);
    return(btn);
};

/**
 * Zoom world extent
 */
magic.classes.ControlButtonRibbon.prototype.zoomToMaxExtent = function() {
    /* Unclear what the action of this button should be - currently set to restore the initial view, more appropriate for zoomed-in maps 
     * David 06/01/2016
     * Previous incarnation: 
     * 
     * if (magic.runtime.viewdata.resolutions) {
     *  this.map.getView().setResolution(this.map_context.data.resolutions[0]);
     * } else {
     *   this.map.getView().setZoom(this.map_context.data.minZoom);
     *} */
    this.map.getView().setZoom(magic.runtime.map_context.data.zoom);
    this.map.getView().setCenter(magic.runtime.map_context.data.center);
};

/**
 * Zoom map by a delta (in evt.data.delta)
 * @param {jQuery.Event} evt
 */
magic.classes.ControlButtonRibbon.prototype.zoomByDelta = function(evt) {
    var view = this.map.getView();
    var currentResolution = view.getResolution();
    var newResolution = view.constrainResolution(currentResolution, evt.data.delta);
    view.setResolution(newResolution);
};

/* Drag/drop GPX/KML files onto map control */

magic.classes.DragDropGpxKml = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "dd-gpx-kml";
    
    /* Map - gets set in the handler if not supplied here */
    this.map = options.map || null;
    
    /* Internal properties */
    
    /* List of user layers added by drag/drop */
    this.userlayers = [];
    
    /* The underlying OpenLayers interaction */
    this.dd = new ol.interaction.DragAndDrop({formatConstructors: [ol.format.GPX, ol.format.KML]});
    
    /* Style the user GPX and KML layers */    
    this.dd.on("addfeatures", jQuery.proxy(function(evt) {
        if (this.map == null) {
            this.map = magic.runtime.map;
        }
        var vectorSource = new ol.source.Vector({
            features: evt.features
        });
        jQuery.each(evt.features, jQuery.proxy(function(idx, feat) {
            feat.setStyle(this.constructStyle(feat));
        }, this));        
        var layer = new ol.layer.Vector({
            name: (evt.file && evt.file.name) ? evt.file.name : "_user_layer_" + this.userlayers.length,
            source: vectorSource,
            renderMode: "image",
            metadata: {                
                is_interactive: true
            }
        });
        this.map.addLayer(layer); 
        var dataExtent = magic.modules.GeoUtils.bufferExtent(vectorSource.getExtent());
        this.map.getView().fit(dataExtent, {padding: [20, 20, 20, 20]});
        this.userlayers.push(layer);
    }, this));
    
};

magic.classes.DragDropGpxKml.prototype.getDdInteraction = function() {
    return(this.dd);
};

/**
 * Get a suitable style for the feature
 * @param {ol.Feature} feat
 * @returns {ol.style.Style}
 */
magic.classes.DragDropGpxKml.prototype.constructStyle = function(feat) {
    var geomType = feat.getGeometry().getType();    
    var paletteEntry = this.userlayers.length % magic.modules.Common.color_palette.length;
    var label = null;
    jQuery.each(feat.getProperties(), function(key, value) {
        if (magic.modules.Common.isNameLike(key)) {
            label = value;
            return(false);
        }
    });
    return(magic.modules.Common.fetchStyle(geomType, paletteEntry, label));        
};

/* Get information about features */

magic.classes.FeatureInfoTool = function(name, map) {

    /* API property */
    this.name = name || "feature-info-tool";
    
    this.map = map || magic.runtime.map;

    /* Internal properties */
    this.active = false;   
    
    /* Feature popup */
    this.featureinfo = new magic.classes.FeaturePopup();

};

magic.classes.FeatureInfoTool.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.FeatureInfoTool.prototype.activate = function () {    
    this.active = true;       
    jQuery("#" + this.map.getTarget()).css("cursor", "help");
    this.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoTool.prototype.deactivate = function () {
    this.active = false;        
    /* Remove map click handler */
    this.featureinfo.hide();
    jQuery("#" + this.map.getTarget()).css("cursor", "default");
    this.map.un("singleclick", this.queryFeatures, this);        
};

/**
 * Send a GetFeatureInfo request to all point layers
 * @param {jQuery.Event} evt
 */
magic.classes.FeatureInfoTool.prototype.queryFeatures = function(evt) {
    
    /* Get the vector features first */
    var fprops = magic.modules.Common.featuresAtPixel(evt);
    
    /* Now the WMS GetFeatureInfo ones */
    var deferreds = [];
    this.map.forEachLayerAtPixel(evt.pixel, function(layer) {
        var url = null;
        var md = layer.get("metadata");
        var service = magic.modules.Endpoints.getEndpointBy("url", md.source.wms_source);
        if (false && service && service.has_wfs === true && (md.geom_type == "point" || md.geom_type == "line")) {
            /* David 2017-04-19 - disabled as causing too many problems with on-the-fly reprojected layers */
            /* Use WFS version of handling click for points or lines - a much better user experience */
            var bxw = this.map.getView().getResolution()*10;
            var bxc = evt.coordinate;
            var featName = md.source.feature_name;
            if (featName.indexOf(":") == -1) {
                var ws = magic.modules.Endpoints.getVirtualService(md.source.wms_source);
                if (ws != "") {
                    featName = ws + ":" + featName;
                }
            }
            var bbox = [(bxc[0] - bxw), (bxc[1] - bxw), (bxc[0] + bxw), (bxc[1] + bxw)].join(",");
            url = md.source.wms_source.replace("wms", "wfs") + "?service=wfs&version=2.0.0&request=getfeature&typename=" + featName + "&srsName=" + 
                this.map.getView().getProjection().getCode() + "&bbox=" + bbox + "&outputFormat=application/json&count=10";
        } else {
            /* GetFeatureInfo version of interactivity - needs unacceptable user precision in some cases, and it isn't possible to override Geoserver's
            use of the SLD to determine the size of buffer to the click in all cases. Have implemented a WFS version of the same interactivity which
            uses a bounding box computed from a 10 pixel radius around the click.  This works well for all layers natively in the map projection - it
            fails for those in e.g. EPSG:4326 unless the map projection is declared in the layer definition, and "reproject native to declared" is 
            selected in the Geoserver admin GUI - David 16/02/2017. */
            url = layer.getSource().getGetFeatureInfoUrl(
                evt.coordinate, 
                this.map.getView().getResolution(), 
                this.map.getView().getProjection(),
                {
                    "LAYERS": md.source.feature_name,
                    "QUERY_LAYERS": md.source.feature_name,
                    "INFO_FORMAT": "application/json", 
                    "FEATURE_COUNT": 10,
                    "buffer": 20
                }
            );  
        }
        if (url) {
            deferreds.push(jQuery.get(magic.modules.Common.proxyUrl(url), function(data) {
                if (typeof data == "string") {
                    data = JSON.parse(data);
                }
                if (jQuery.isArray(data.features) && data.features.length > 0) {
                    jQuery.each(data.features, function(idx, f) {
                        if (f.geometry) {                                                                                            
                            fprops.push(jQuery.extend({}, f.properties, {"layer": layer}));                                       
                        }
                    });
                }
            }));
        }
    }, this, function(layer) {
        var md = layer.get("metadata");
        return(layer.getVisible() === true && md && md.source && md.source.wms_source && md.is_interactive === true);
    }, this);
 
    /* Now apply all the feature queries and assemble a pop-up */
    jQuery.when.apply(jQuery, deferreds).done(jQuery.proxy(function() {
        this.featureinfo.show(evt.coordinate, fprops);
    }, this));
};

/**
 * Callback to destroy all pop-ups which reference a layer that got turned off by the user
 */
magic.classes.FeatureInfoTool.prototype.layerVisibilityHandler = function() {
    this.featureinfo.hideInvisibleLayerPopups();
};

/* Construct markup for popup content on a list of features */

magic.classes.FeaturePopup = function(options) {
    
    /* API */
    if (!options) {
        options = {};
    }
    
    /* List of features to render attributes of */
    this.featureCollection = options.features || [];    
    /* id of DOM element to bind popup to */
    this.popupId = options.popupId || "popup";   
    /* The map the popup will appear on (defaults to main map) */
    this.map = options.map || magic.runtime.map;  
    /* Continuation modal id (defaults to all-attributes-modal) */
    this.continuation = "all-attributes-modal";
    
    /* Internal */      
    
    /* Set to true when all pager handlers have been bound */
    this.initPager = false;
    /* Pointer to which feature in the list is being displayed */
    this.featurePointer = 0;
    
    /* What counts as a long field which will get a pop-up and ellipsis button */
    this.LONG_FIELD_THRESHOLD = 120;
    
    if (jQuery("#" + this.popupId).length == 0) {
        /* Popup div needs creating */
        jQuery("#map-container").after(
            '<!-- Pop-up overlay -->' + 
            '<div id="' + this.popupId + '" class="ol-popup">' + 
                '<div id="' + this.popupId + '-content"></div>' + 
            '</div>'
        );
    }
    this.popupElt = jQuery("#" + this.popupId);
    this.popup = new ol.Overlay({
        element: this.popupElt[0],
        positioning: "center-center"
    });
    this.map.addOverlay(this.popup);
    
    /* Text continuation markup (always done in main map as will never fit in an inset!) */
    if (jQuery(this.continuation).length == 0) {
        jQuery("#map-container").after(
            '<!-- Full attribute set modal -->' + 
            '<div class="modal fade" id="' + this.continuation + '" tabindex="-1" role="dialog" aria-labelledby="' + this.continuation + '-title" aria-hidden="true">' + 
                '<div class="modal-dialog">' + 
                    '<div class="modal-content">' + 
                        '<div class="modal-header">' + 
                            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + 
                            '<h4 class="modal-title" id="' + this.continuation + '-title">Raw attribute set (unformatted)</h4>' + 
                        '</div>' + 
                        '<div id="' + this.continuation + '-content" class="modal-body">' + 
                            'Loading attributes...' + 
                        '</div>' + 
                        '<div class="modal-footer">' + 
                            '<button type="button" class="btn-sm btn-primary" data-dismiss="modal">Close</button>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
            '</div>'
        );
    }       
};

/**
 * Show the popup at the given point with the feature data
 * @param {ol.coordinate} showAt
 * @param {Array} featureData array of feature attribute objects, with __geomtype set to the geometry type (in lower case)
 */
magic.classes.FeaturePopup.prototype.show = function(showAt, featureData) {    
    jQuery("#" + this.popupId).popover("destroy");
    var showPopup = featureData.length > 0;    
    if (showPopup) {        
        this.popup.setPosition(showAt);
        jQuery.extend(this, {
            featurePointer: 0,
            initPager: false,
            featureCollection: featureData
        });
        this.popupElt.popover({
            placement: jQuery.proxy(function() {
                var placement = "bottom",
                    popoverLocation = this.map.getPixelFromCoordinate(showAt),
                    mapHeight = jQuery("#map-container").children(":first").outerHeight(),
                    mtop = popoverLocation[1] - 400,
                    mbtm = popoverLocation[1] + 400;
                if (mbtm > mapHeight) {
                    /* Bottom-placed popover off bottom of map - consider top placement */
                    placement = mtop > 0 ? "top" : "bottom";
                }            
                return(placement);
            }, this),        
            animation: false,
            title: this.title(),
            html: true,
            content: this.markup()  /* Basic feature attributes i.e. name, lon, lat */
        }).on("shown.bs.popover", jQuery.proxy(function() {
            /* Close button */
            jQuery("span[id^='" + this.popupId + "-title-']").find("button.close").click(jQuery.proxy(function() { 
                this.popupElt.popover("hide");
            }, this));
            /* Do feature select */
            this.selectFeature();                 
        }, this));
        jQuery("#" + this.popupId).popover("show");
    }
};
/**
 * Hide (i.e. destroy) the popup
 */
magic.classes.FeaturePopup.prototype.hide = function() {
    this.popupElt.popover("destroy");
};

/**
 * Create title string
 * @return {string} title (including close button markup)
 */
magic.classes.FeaturePopup.prototype.title = function() {
    var content = "";
    jQuery.each(this.featureCollection, jQuery.proxy(function(i, feat) {
        var name = feat.layer.get("name");        
        content += 
            '<span id="' + this.popupId + '-title-' + i + '" class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">' + 
                magic.modules.Common.ellipsis(name, 25) +
                '<button type="button" style="float:right" class="close">&times;</button>' + 
            '</span>';      
    }, this));    
    return(content);
    
};

/**
 * Create basic (name, lon, lat) data markup for feature set
 * @return {string} description
 */
magic.classes.FeaturePopup.prototype.markup = function() {    
    var content = "";
    jQuery.each(this.featureCollection, jQuery.proxy(function(i, feat) {        
        /* Note: any features whose full data is Ajax-fetched will have a dummy entry created here */
       content += '<div id="' + this.popupId + '-table-' + i + '" class="feature-popup-table-cont ' + (i > 0 ? "hidden" : "show") + '">';
       content += this.featureAttributeTableMarkup(feat, i);
       content += '</div>';
    }, this));    
    if (this.featureCollection.length > 1) {
        /* Output a pager in initial configuration i.e. viewing first feature */               
        content += 
            '<div id="' + this.popupId + '-pager">' + 
                '<div class="btn-group btn-group-xs" role="group">' + 
                    '<button id="' + this.popupId + '-pager-first" type="button" class="btn btn-default disabled">' + 
                        '<span class="fa fa-angle-double-left" data-toggle="tooltip" data-placement="left" title="First feature"></span>' + 
                    '</button>' + 
                    '<button id="' + this.popupId + '-pager-prev" type="button" class="btn btn-default disabled">' + 
                        '<span class="fa fa-angle-left" data-toggle="tooltip" data-placement="top" title="Previous feature"></span>' + 
                    '</button>' + 
                    '<div class="popup-pager-xofy" id="' + this.popupId + '-pager-xofy">Showing 1 of ' + this.featureCollection.length + '</div>' + 
                    '<button id="' + this.popupId + '-pager-next" type="button" class="btn btn-default">' + 
                        '<span class="fa fa-angle-right" data-toggle="tooltip" data-placement="top" title="Next feature"></span>' + 
                    '</button>' + 
                    '<button id="' + this.popupId + '-pager-last" type="button" class="btn btn-default">' + 
                        '<span class="fa fa-angle-double-right" data-toggle="tooltip" data-placement="right" title="Last feature"></span>' + 
                    '</button>' + 
                '</div>' + 
            '</div>';
    }
    return(content);
};

/**
 * Return popup content for a feature in the collection
 * @param {ol.Feature} feat
 * @param {int} i index into feature collection
 * @return {String}
 */
magic.classes.FeaturePopup.prototype.featureAttributeTableMarkup = function(feat, i) {
    var content = '<table class="table table-striped table-condensed feature-popup-table">';
    var nDisplayed = 0, nAttrs = -1, isVectorFeat = false, isEsriFeat = false;
    if (feat.layer) {            
        var md = feat.layer.get("metadata");
        if (md) {
            var attrMap = md.attribute_map;
            if (jQuery.isArray(attrMap) && attrMap.length > 0) {
                /* Sort attribute map according to the ordinals (added by David 08/04/2016 in response to request by Alex B-J) */                
                attrMap.sort(function(a, b) {
                    var orda = a["ordinal"] || 999;
                    var ordb = b["ordinal"] || 999;
                    return((orda < ordb) ? -1 : (orda > ordb) ? 1 : 0);
                });                                       
            } else {
                /* Create suitable attribute map from name/lat/lon */
                attrMap = this.minimumPopupAttrs(feat);
                isVectorFeat = true;               
            }
            if (md.source && magic.modules.Common.isUrl(md.source.esrijson_source)) {
                /* Record ESRI JSON feature type - ensure 'Full Attribute Set' button is always displayed regardless */
                isEsriFeat = true;
            }
            nAttrs = attrMap.length;
            jQuery.each(attrMap, jQuery.proxy(function(idx, attrdata) {
                var extension = false;
                if (attrdata.displayed === true) {
                    var nameStr = attrdata.alias || attrdata.name;
                    if (attrdata.type == "xsd:string") {
                        var finalValue = "";
                        if (feat[attrdata.name]) {
                            /* Attribute has a value, so worth displaying */
                            var quote1 = feat[attrdata.name].indexOf("\"");
                            var quote2 = feat[attrdata.name].lastIndexOf("\"");
                            if (quote1 != -1 && quote2 != -1) {
                                /* This is a link with an alias i.e. "<linktext>":<url> */
                                finalValue = magic.modules.Common.linkify(feat[attrdata.name].substring(quote2+2), feat[attrdata.name].substring(quote1+1, quote2));
                            } else {
                                var longContent = magic.modules.Common.linkify(feat[attrdata.name]);
                                if (feat[attrdata.name].length > this.LONG_FIELD_THRESHOLD) {
                                    /* Long field attribute, not a long link */
                                    finalValue += 
                                        '<button class="btn btn-default btn-sm long-field-extension" role="button" data-toggle="popover" data-placement="right">' + 
                                            '<span class="fa fa-ellipsis-h"></span>' + 
                                            '<div style="display:none">' + longContent + '</div>' + 
                                        '</button>';
                                    extension = true;
                                } else {
                                    finalValue = longContent;
                                }
                            }
                            content += '<tr><td>' + nameStr + '</td><td' + (extension ? ' align="right"' : '') + '>' + finalValue + '</td></tr>';
                            nDisplayed++;
                        }                            
                    } else { 
                        if (feat[attrdata.name] || jQuery.isNumeric(feat[attrdata.name])) {
                            /* Attribute has a non-null value, so worth displaying */
                            var attrOut = this.attributeValue(attrdata.name, feat[attrdata.name]);
                            if (attrOut != "") {
                                content += '<tr><td>' + nameStr + '</td><td align="right">' + this.attributeValue(attrdata.name, feat[attrdata.name]) + '</td></tr>';
                                nDisplayed++;
                            }
                        }
                    }                        
                }
            }, this));
        }
    }
    if (nAttrs == -1 || nAttrs > nDisplayed || isVectorFeat || isEsriFeat) {
        content += '<tr><td colspan="2" align="center"><button type="button" id="' + this.popupId + '-full-attr-set-' + i + '" class="btn btn-primary btn-xs">Full attribute set</button></td></tr>';
    }
    content += '</table>';
    return(content);
};

/**
 * Deduce a minimal popup attribute set if possible
 * @param {object} feat
 * @return {Array}
 */
magic.classes.FeaturePopup.prototype.minimumPopupAttrs = function(feat) {
    var attrs = [];
    if (feat && !jQuery.isEmptyObject(feat)) {
        var nameAttr = null, 
            nonNullStringAttr = null,
            lonAttr = null,
            latAttr = null;
        for (var key in feat) {
            if (!nameAttr && magic.modules.Common.isNameLike(key) && feat[key]) {
                nameAttr = key;
            }
            /* Bug fix 25/04/2018 David - don't include any attribute that is an object e.g. 'layer' */
            if (feat[key] && typeof feat[key] === "string" && !jQuery.isNumeric(feat[key])) {
                nonNullStringAttr = key; 
            }           
            if (!lonAttr && magic.modules.Common.isLongitudeLike(key) && jQuery.isNumeric(feat[key])) {
                lonAttr = key;
            }
            if (!latAttr && magic.modules.Common.isLatitudeLike(key) && jQuery.isNumeric(feat[key])) {
                latAttr = key;
            }
        }
        nameAttr = nameAttr || nonNullStringAttr;
        if (nameAttr) {
            attrs.push({
                "name": nameAttr,
                "displayed": true,
                "alias": magic.modules.Common.initCap(nameAttr),
                "type": "xsd:string"
            });
        }
        if (lonAttr) {
            attrs.push({
                "name": lonAttr,
                "displayed": true,
                "alias": magic.modules.Common.initCap(lonAttr),
                "type": "xsd:decimal"
            });
        }
        if (latAttr) {
            attrs.push({
                "name": latAttr,
                "displayed": true,
                "alias": magic.modules.Common.initCap(latAttr),
                "type": "xsd:decimal"
            });
        }
    }
    return(attrs);
};

/**
 * Display the attribute markup for the feature at the given index
 * @returns {undefined}
 */
magic.classes.FeaturePopup.prototype.selectFeature = function() {   
    if (this.featureCollection.length > 1) {
        /* Update "showing x of y" message */
        jQuery("#" + this.popupId + "-pager-xofy").html("Showing " + (this.featurePointer+1) + " of " + this.featureCollection.length);
    }
    /* Show the relevant title from the markup */
    jQuery("span[id^='" + this.popupId + "-title-']").each(jQuery.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            jQuery(elt).removeClass("hidden").addClass("show");
        } else {
            jQuery(elt).removeClass("show").addClass("hidden");
        }
    }, this));
    /* Show the relevant div from the combined markup */
    jQuery("div[id^='" + this.popupId + "-table-']").each(jQuery.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            var fdata = this.featureCollection[idx];
            if (jQuery.isFunction(fdata.layer.get("fetcher"))) {
                /* Data is fetched on the fly for this layer - usually a high payload vector layer which would impact map performance */
                fdata.layer.get("fetcher")(jQuery.proxy(function(fdata, i) {
                    jQuery(elt).html(this.featureAttributeTableMarkup(fdata, i));
                    this.longFieldPopoverHandler(elt);
                    this.fixPopoverPosition();
                    this.assignFullSetHandler(elt);
                }, this), fdata, idx);
            } else {
                /* Assign extra handlers */
                this.longFieldPopoverHandler(elt);
                this.assignFullSetHandler(elt);
            }
            jQuery(elt).removeClass("hidden").addClass("show");
        } else {
            jQuery(elt).removeClass("show").addClass("hidden");
        }                      
    }, this));       
    if (this.featureCollection.length > 1) {
        /* Do we need to add handlers for pager buttons? */
        if (!this.initPager) {
            /* Add handlers */
            jQuery("#" + this.popupId + "-pager div button").off("click").on("click", jQuery.proxy(function(evt) {                
                switch(evt.currentTarget.id) {
                    case this.popupId + "-pager-first":
                        this.featurePointer = 0;                       
                        break;
                    case this.popupId + "-pager-prev":
                        if (this.featurePointer > 0) {
                            this.featurePointer--;                           
                        }                                                
                        break;
                    case this.popupId + "-pager-next":
                        if (this.featurePointer < this.featureCollection.length-1) {
                            this.featurePointer++;                            
                        }
                        break;
                    case this.popupId + "-pager-last":
                        this.featurePointer = this.featureCollection.length-1;
                        break;
                    default:
                        break;
                }
                if (this.featurePointer == 0) {
                    jQuery("#" + this.popupId + "-pager-first").prop("disabled", true).addClass("disabled");
                    jQuery("#" + this.popupId + "-pager-prev").prop("disabled", true).addClass("disabled");
                    jQuery("#" + this.popupId + "-pager-next").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-last").prop("disabled", false).removeClass("disabled");
                } else if (this.featurePointer == this.featureCollection.length-1) {
                    jQuery("#" + this.popupId + "-pager-first").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-prev").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-next").prop("disabled", true).addClass("disabled");
                    jQuery("#" + this.popupId + "-pager-last").prop("disabled", true).addClass("disabled");
                } else {
                    jQuery("#" + this.popupId + "-pager-first").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-prev").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-next").prop("disabled", false).removeClass("disabled");
                    jQuery("#" + this.popupId + "-pager-last").prop("disabled", false).removeClass("disabled");
                }
                this.selectFeature();
                this.fixPopoverPosition();
            }, this));            
            this.initPager = true;
        }        
    }    
};

/**
 * Add a popover to show the content of long text fields
 * @param {Object} elt
 */
magic.classes.FeaturePopup.prototype.longFieldPopoverHandler = function(elt) {
    jQuery(elt).find("button.long-field-extension").each(function(i, b) {
        var divs = jQuery(b).children("div");
        if (divs.length > 0) {
            jQuery(b).popover({
                title: false,
                html: true,
                content: '<div style="width:200px">' + jQuery(divs[0]).html() + '</div>'
            });
        }
    });
};

/**
 * Add full attribute set modal handler
 * @param {Object} elt
 */
magic.classes.FeaturePopup.prototype.assignFullSetHandler = function(elt) {    
    jQuery(elt).find("button[id^='" + this.popupId + "-full-attr-set-']").off("click").on("click", jQuery.proxy(function(evt) {
        var btnId = evt.currentTarget.id;
        var fidx = parseInt(btnId.substring(btnId.lastIndexOf("-")+1));
        if (!isNaN(fidx) && fidx < this.featureCollection.length) {
            /* Got an index into the current feature collection */
            var attrdata = this.featureCollection[fidx];
            var keys = [];
            for (var k in attrdata) {
                if (k != "layer" && k != "bbox" && k != "geometry" && k.indexOf("_") != 0) {
                    keys.push(k);
                }
            }
            var content = '<table class="table table-striped table-condensed feature-popup-table">';
            jQuery.each(keys.sort(), function(idx, key) {
                var value = attrdata[key];
                if (jQuery.isNumeric(value)) { 
                    /* Changed 2016-11-02 David - should show zero values in e.g. speed attributes */
                    content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                } else if (value && key.toLowerCase().indexOf("geom") == -1) {
                    /* Test for Redmine markup-style link with alias of form "<alias>":<url> which should be translated */
                    /* NOTE: David 2016-11-02 - suppress null non-numeric values in the pop-up */
                    var finalValue = "";
                    if (value) {
                        var quote1 = value.indexOf("\"");
                        var quote2 = value.lastIndexOf("\"");
                        if (quote1 != -1 && quote2 != -1) {
                            finalValue = magic.modules.Common.linkify(value.substring(quote2+2), value.substring(quote1+1, quote2));
                        } else {
                            finalValue = magic.modules.Common.linkify(value);
                        }     
                    }
                    content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td>' + finalValue + '</td></tr>';
                }
            });
            content += '</table>';
            jQuery("#" + this.continuation + "-content").html(content);
            jQuery("#" + this.continuation).modal("show");            
        }
    }, this));
};

/**
 * Make sure the popover arrow is anchored to the location of the first feature in the list, and remains so anchored through dynamic content changes
 */
magic.classes.FeaturePopup.prototype.fixPopoverPosition = function() {
    var parentPopover = jQuery("div[id^='" + this.popupId + "-table-']").first().parents("div.popover");
    if (parentPopover.hasClass("top")) {
        /* Redjustment potentially necessary */   
        parentPopover.css("top", -parentPopover.outerHeight() + "px");
    }
    /* Fix horizontal positioning where content width allowed to vary e.g. when images are loaded */
    parentPopover.find("div.arrow").css("left", parseInt(100*116/parentPopover.innerWidth()) + "%");
};

/**
 * Apply preferences (using some guesswork) to an attribute whose key and value are supplied
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
magic.classes.FeaturePopup.prototype.attributeValue = function(key, value) {
    var newValue = "";
    if (value != null && value != "" && value != undefined) {
        if (magic.modules.Common.isLongitudeLike(key)) {
            if (!jQuery.isNumeric(value)) {
                value = value.replace(/&[^;]+;\s?/g, " ");  /* Tracker co-ordinates have HTML escapes in them - sigh */
            }
            newValue = magic.modules.GeoUtils.applyPref("coordinates", value, "lon");
        } else if (magic.modules.Common.isLatitudeLike(key)) {
            if (!jQuery.isNumeric(value)) {
                value = value.replace(/&[^;]+;\s?/g, " ");  /* Tracker co-ordinates have HTML escapes in them - sigh */
            }
            newValue = magic.modules.GeoUtils.applyPref("coordinates", value, "lat");
        } else if (magic.modules.Common.isDatetimeLike(key)) {
            newValue = magic.modules.GeoUtils.applyPref("dates", value);
        } else {
            newValue = value;
        }
    }
    return(newValue);
};

/**
 * Scan the feature collection for layers which have been turned off, and hide the pop-up if so
 */
magic.classes.FeaturePopup.prototype.hideInvisibleLayerPopups = function() {
    jQuery.each(this.featureCollection, jQuery.proxy(function(idx, feat) {
        if (!feat.layer.getVisible()) {
            this.hide();
            return(false);
        }        
    }, this));    
};

/* Inset EPSG:4326 map, implemented as a Bootstrap popover */

magic.classes.InsetMap = function(options) {
    
    this.id = options ? options.id : "inset-map-tool";
      
    this.target = options ? options.target : jQuery("button.inset-map-expand");  
    
    this.active = false;
    
    this.map = null;
    this.featureInfo = null;
        
    /* Internal */
    this.highlighted = null;
    this.template = 
        '<div class="popover popover-auto-width popover-auto-height inset-map-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div id="inset-map" class="popover-content inset-map-popover-content"></div>' +
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span>Mid-latitudes map<button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: ""
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.initMap();        
        /* Close button */
        jQuery(".inset-map-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
        /* Trigger insetmapopened event */
        jQuery.event.trigger({type: "insetmapopened"});
    }, this))
    .on("hidden.bs.popover", jQuery.proxy(function() {
        if (this.featureinfo) {
            /* Remove any pop-up */
            this.featureinfo.hide();
        }                
        this.map = null;
        this.featureinfo = null;
        /* Trigger insetmapclosed event */
        jQuery.event.trigger({type: "insetmapclosed"});
    }, this));
};

magic.classes.InsetMap.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.InsetMap.prototype.getTemplate = function() {
    return(this.template);
};

magic.classes.InsetMap.prototype.addLayer = function(layer) {    
    this.map.addLayer(layer);
};

magic.classes.InsetMap.prototype.activate = function() {    
    if (!this.active) {
        this.target.removeClass("hidden").addClass("show");
        this.target.popover("show");
        this.active = true;        
    }
};

magic.classes.InsetMap.prototype.deactivate = function() {
    this.active = false;
    var nf = 0;
    var nlayers = 0;
    if (this.map) {
        this.map.getLayers().forEach(function(lyr, idx, arr) {
            if (jQuery.isFunction(lyr.getSource().getFeatures)) {
                /* A vector overlay layer - check number of features */
                nf += lyr.getSource().getFeatures().length;
            }    
            nlayers++;
        }, this);
    }
    if (nf == 0) {
        this.target.popover("hide");
    }
};

magic.classes.InsetMap.prototype.isActive = function () {
    return(this.active);
};

/**
 * Set up OL map
 */
magic.classes.InsetMap.prototype.initMap = function() {
    this.map = new ol.Map({
        renderer: "canvas",
        target: "inset-map",
        layers: [magic.modules.Endpoints.getMidLatitudeCoastLayer()],
        controls: [
            new ol.control.ScaleLine({minWidth: 50, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 50, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function(xy) {
                    return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                }
            })
        ],
        interactions: ol.interaction.defaults(),
        view: new ol.View({
            center: [0,0],
            minZoom: 1,
            maxZoom: 10,
            zoom: 1,
            projection: ol.proj.get("EPSG:3857")
        })
    });    
    /* Create a popup overlay and add handler to show it on clicking a feature */
    this.featureinfo = new magic.classes.FeaturePopup({
        popupId: "inset-popup",
        map: this.map,
        mapdiv: "inset-map"
    });   
    this.map.on("singleclick", this.featureAtPixelHandler, this);
    /* Allow mouseover labels for point vector layers */
    this.map.on("pointermove", jQuery.proxy(function(evt) {
        magic.modules.Common.defaultMouseout(this.highlighted);
        this.highlighted = magic.modules.Common.defaultMouseover(evt);        
    }, this)); 
};

/**
 * Handler to show popups for clicks on features
 * @param {jQuery.Event} evt
 */
magic.classes.InsetMap.prototype.featureAtPixelHandler = function(evt) {    
    this.featureinfo.show(evt.coordinate, magic.modules.Common.featuresAtPixel(evt));         
};

/* Layer filter definition */

magic.classes.LayerFilter = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = options.target;
    
    this.layer = options.layer;
    
    this.attribute_map = this.layer.get("metadata").attribute_map;
    /* End of API */
    
    /* Internal */
    this.attr = null;
    this.comparison = null;
    this.op = null;
    this.val1 = null;
    this.val2 = null;
    
    /* Get the filterable options */
    var opts = "";
    jQuery.each(this.attribute_map, function(idx, attrdata) {
        if (attrdata.filterable === true) {
            opts += '<option value="' + attrdata.name + '">' + (attrdata.alias || attrdata.name) + '</option>';
        }
    });
    
    if (this.target.html() == "") {
        /* Add markup and handlers */
        this.target.html(
            '<div class="layer-filter-panel">' + 
                '<form id="ftr-form-' + this.nodeid + '">' +
                    '<input id="ftr-comparison-type-' + this.nodeid + '" type="hidden" value="string">' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-attr-' + this.nodeid + '" class="form-control">' +
                            opts + 
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-op-str-' + this.nodeid + '" class="form-control">' +                             
                            '<option id="ftr-op-str-eq-' + this.nodeid + '" value="eq">equal to (case-insensitive)</option>' +
                            '<option id="ftr-op-str-sw-' + this.nodeid + '" value="sw">starts with (case-insensitive)</option>' +
                            '<option id="ftr-op-str-ew-' + this.nodeid + '" value="ew">Ends with (case-insensitive)</option>' +
                            '<option id="ftr-op-str-ct-' + this.nodeid + '" value="ct">Contains (case-insensitive)</option>' +
                            '<option id="ftr-op-str-nn-' + this.nodeid + '" value="nn">Has a non-null value</option>' +
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<select id="ftr-op-str-unique-' + this.nodeid + '" class="form-control">' +                             
                            '<option id="ftr-op-str-eq-' + this.nodeid + '" value="eq">equal to</option>' +                            
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<select id="ftr-op-num-' + this.nodeid + '" class="form-control">' +
                            '<option id="ftr-op-num-eq-' + this.nodeid + '" value="=" selected>equal to</option>' +
                            '<option id="ftr-op-num-gt-' + this.nodeid + '" value=">">greater than</option>' +
                            '<option id="ftr-op-num-lt-' + this.nodeid + '" value="<">less than</option>' +
                            '<option id="ftr-op-num-gte-' + this.nodeid + '" value=">=">greater than or equal to</option>' +
                            '<option id="ftr-op-num-lte-' + this.nodeid + '" value="<=">less than or equal to</option>' +
                            '<option id="ftr-op-num-btw-' + this.nodeid + '" value="between">between</option>' +
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<input id="ftr-val-str-' + this.nodeid + '" class="form-control" type="text" required="true" placeholder="Attribute value" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Enter the attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<select id="ftr-val-str-unique-' + this.nodeid + '" class="form-control" type="text" required="true" placeholder="Attribute value" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Select the attribute value to filter on">' + 
                        '</select>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-num1-' + this.nodeid + '" class="form-control" type="number" required="true" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Enter numeric attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-num2-' + this.nodeid + '" class="form-control" type="number" required="false" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Enter upper numeric attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-date1-' + this.nodeid + '" class="form-control" type="date" required="true" placeholder="Date as yyyy-mm-dd hh:mm:ss" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Enter date/time to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-date2-' + this.nodeid + '" class="form-control" type="date" required="false" placeholder="Date as yyyy-mm-dd hh:mm:ss" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Enter date/time to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12" style="margin-bottom:0px">' +
                        '<button id="ftr-btn-go-' + this.nodeid + '" class="btn btn-primary btn-xs" type="button" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Set filter on layer" style="margin-right:5px">' + 
                            '<span class="fa fa-filter"></span>Apply' + 
                        '</button>' +
                        '<button id="ftr-btn-reset-' + this.nodeid + '" class="btn btn-danger btn-xs" type="button" ' + 
                            'data-toggle="tooltip" data-placement="bottom" title="Remove layer filter">' + 
                            '<span class="fa fa-minus-circle"></span>Reset' + 
                        '</button>' +
                    '</div>' + 
                '</form>' + 
            '</div>'
        );
        this.target.find("form").click(function(evt2) {evt2.stopPropagation();});        
        jQuery("#ftr-attr-" + this.nodeid).on("change", jQuery.proxy(function(evt) {
            this.setFilterOptions("attr", jQuery(evt.target).val());                                
        }, this));
        jQuery("#ftr-op-num-" + this.nodeid).on("change", jQuery.proxy(function(evt) {
            this.setFilterOptions("op", jQuery(evt.target).val());                    
        }, this));      
        jQuery("#ftr-btn-go-" + this.nodeid).on("click", jQuery.proxy(this.applyFilter, this));
        jQuery("#ftr-btn-reset-" + this.nodeid).on("click", jQuery.proxy(this.resetFilter, this));
    }       
    this.setFilterOptions("init", null);
};

/**
 * Create the actual <option> elements under an attribute <select> from the layer attributes
 * @param {string} changed
 * @param {string} to
 */
magic.classes.LayerFilter.prototype.setFilterOptions = function(changed, to) {
    
    var form = jQuery("#ftr-form-" + this.nodeid);
    var inputComparison = jQuery("#ftr-comparison-type-" + this.nodeid);            
    
    if (changed == "attr") {
        
        /* Attribute has changed, completely reset the form apart from this */
        form.find("input[type='text'],input[type='number'],input[type='hidden']").val("");
        form.find("select").not("[id^='ftr-attr-']").prop("selectedIndex", 0);
        
        var adata = jQuery.grep(this.attribute_map, function(elt) {
            return(elt.name == to);
        })[0];
        var theType = adata.type.toLowerCase().replace(/^xsd:/, "");
        if (theType == "string") {
            /* String compare */
            inputComparison.val("string");
            this.showFormFields(form, "string");           
            if (adata.unique_values === true) {
                /* This will fetch the unique attribute values, and if successful show the appropriate inputs */
                this.getUniqueValues(adata.name, null);
            }
        } else if (theType == "datetime") {
            /* Date/time */
            inputComparison.val("date"); 
            this.showFormFields(form, "date");            
        } else {
            /* Numeric */
            inputComparison.val("number");  
            this.showFormFields(form, "number");           
        }        
        
    } else if (changed == "op") {
        
        /* Operation has changed - leave attribute and value(s) as they are */
        var comparisonType = inputComparison.val();
        if (comparisonType == "number") {
            var inputValNum2 = form.find("input[id*='-num2']");
            if (to == "between") {
                /* Make second value visible */
                inputValNum2.parent().removeClass("hidden"); 
            } else {
                /* Hide second value */
                inputValNum2.parent().addClass("hidden"); 
            }
        } else if (comparisonType == "date") {
            var inputValDate2 = form.find("input[id*='-date2']");
            if (to == "between") {
                /* Make second value visible */
                inputValDate2.parent().removeClass("hidden"); 
            } else {
                /* Hide second value */
                inputValDate2.parent().addClass("hidden"); 
            }
        }
    } else if (changed == "init") {
        
        /* Load existing filter data */
        this.loadExistingFilter();
        
        if (this.attr != null) {            
            /* Existing filter data found */
            form.find("select[id^='ftr-attr-']").val(this.attr);
            var adata = jQuery.grep(this.attribute_map, jQuery.proxy(function(elt) {
                return(elt.name == this.attr);
            }, this))[0];
            if (this.comparison == "string") {
                inputComparison.val("string");
                this.showFormFields(form, "string");               
                if (adata.unique_values === true) {
                    /* This will fetch the unique attribute values, and if successful show the appropriate inputs */
                    this.getUniqueValues(adata.name, this.val1);
                } else {
                    /* Value will have % characters to indicate wildcards depending on the operation */
                    var selectOpStr = jQuery("#ftr-op-str-" + this.nodeid);
                    var inputValStr = jQuery("#ftr-val-str-" + this.nodeid);
                    if (this.val1 == "IS NOT NULL") {
                        /* Has a value filter */
                        selectOpStr.val("nn");
                        inputValStr.val("");
                    } else {
                        /* More complex filter */
                        var startPc = this.val1.indexOf("%") == 0;
                        var endPc = this.val && (this.val1.lastIndexOf("%") == this.val1.length-1);
                        if (startPc && endPc) {
                            selectOpStr.val("ct"); 
                        } else if (startPc) {
                            selectOpStr.val("ew"); 
                        } else if (endPc) {
                            selectOpStr.val("sw"); 
                        } else {
                            selectOpStr.val("eq"); 
                        }
                        inputValStr.val(this.val1.replace(/%/g, ""));
                    }
                }
            } else if (this.comparison == "number") {
                /* Numeric */
                inputComparison.val("number");  
                this.showFormFields(form, "number");               
                jQuery("#ftr-op-num-" + this.nodeid).val(this.op);
                jQuery("#ftr-val-num1-" + this.nodeid).val(this.val1);
                var inputValNum2 = jQuery("#ftr-val-num2-" + this.nodeid);
                if (this.op == "between") {
                    inputValNum2.val(this.val2);
                    inputValNum2.parent().removeClass("hidden").val(this.val2);
                } else {
                    inputValNum2.parent().addClass("hidden").val("");
                }
            } else if (this.comparison == "date") {
                /* Date */
                inputComparison.val("date"); 
                this.showFormFields(form, "date");                
                jQuery("#ftr-op-num-" + this.nodeid).val(this.op);
                jQuery("#ftr-val-date1-" + this.nodeid).val(this.val1);
                var inputValDate2 = jQuery("#ftr-val-date2-" + this.nodeid);
                if (this.op == "between") {
                    inputValDate2.val(this.val2);
                    inputValDate2.parent().removeClass("hidden").val(this.val2);
                } else {
                    inputValDate2.parent().addClass("hidden").val("");
                }
            }
        } else {
            /* Reset form */
            form.find("input[type='text'],input[type='number'],input[type='hidden']").val("");
            form.find("select").prop("selectedIndex", 0);
        }      
    }        
};

/**
 * Show the appropriate form fields for the attribute type
 * @param {jQuery.Object} form
 * @param {string} attrType string|number|date
 */
magic.classes.LayerFilter.prototype.showFormFields = function(form, attrType) {
    if (attrType == "string") {
        /* Hide all inputs/selects concerning numbers or dates */
        form.find("input[id*='-num'],select[id*='-num'],input[id*='-date']").parent().addClass("hidden");
        /* Show default string inputs and hide unique-type ones, pending an extra enquiry */
        form.find("input[id*='-str-" + this.nodeid + "'],select[id*='-str-" + this.nodeid + "']").parent().removeClass("hidden");        
        form.find("input[id*='-str-unique-'],select[id*='-str-unique']").parent().addClass("hidden");
    } else if (attrType == "number") {
        /* Hide all inputs/selects concerning strings, and any inputs concerning dates */
        form.find("input[id*='-str'],select[id*='-str'],input[id*='-date']").parent().addClass("hidden");     
        /* Show number inputs and numeric comparison select */
        form.find("input[id*='-num'],select[id*='-num-']").parent().removeClass("hidden");
    } else if (attrType == "date") {
        /* Hide all inputs/selects concerning strings, and any inputs concerning numbers */
        form.find("input[id*='-str'],select[id*='-str'],input[id*='-num']").parent().addClass("hidden");     
        /* Show date inputs and numeric comparison select */
        form.find("input[id*='-date'],select[id*='-num-']").parent().removeClass("hidden");
    }
};

magic.classes.LayerFilter.prototype.loadExistingFilter = function() {
    var exFilter = magic.runtime.filters[this.layer.get("name")];
    var valid = exFilter && exFilter.attr && exFilter.comparison && exFilter.op && exFilter.val1;
    if (valid) {
        this.attr = exFilter.attr;
        this.comparison = exFilter.comparison;
        this.op = exFilter.op;
        this.val1 = exFilter.val1;
        this.val2 = exFilter.val2;
    } else {
        var filterables = jQuery.grep(this.attribute_map, jQuery.proxy(function(elt) {
            return(elt.filterable);
        }, this));
        if (filterables.length > 0) {
            var theType = filterables[0].type.toLowerCase().replace(/^xsd:/, "");
            this.attr = filterables[0].name;
            this.comparison = theType == "string" ? "string" : (theType == "datetime" ? "date" : "number");
            this.op = "eq";
            this.val1 = "";
            this.val2 = "";
        } else {
            this.attr = null;
            this.comparison = "string";
            this.op = "eq";
            this.val1 = "";
            this.val2 = "";
        }
    }
};

/**
 * Get unique values of attrName, if successful setting the alternative inputs
 * @param {type} attrName
 * @param {type} attrVal
 */
magic.classes.LayerFilter.prototype.getUniqueValues = function(attrName, attrVal) {
    var sourceMd = this.layer.get("metadata").source;
    if (sourceMd) {
        if (sourceMd.wms_source) {
            /* WMS source */
            var url = sourceMd.wms_source;
            var qry = "?service=wfs&version=1.1.0&request=GetFeature&outputFormat=CSV&typeName=" + sourceMd.feature_name + "&propertyName=" + attrName;
            var proxiedUrl = magic.modules.Endpoints.getWmsProxiedUrl(url);
            if (proxiedUrl != null) {
                url = magic.modules.Common.proxyUrl(proxiedUrl.replace(/wms$/, "wfs") + qry);
            } else {
                url = url.replace(/wms$/, "wfs") + qry;
            }            
            jQuery.ajax(url)
                .done(jQuery.proxy(function(data) {
                    var arr = data.split(/\r?\n/);
                    if (arr.length > 0) {
                        /* Find the index of the desired attribute */
                        var attrPos = -1;
                        var fldNames = arr[0].split(",");
                        for (var i = 0; i < fldNames.length; i++) {
                            /* Note the trim() here - data could have appended whitespace/CR */
                            if (fldNames[i].trim() == attrName) {
                                attrPos = i;
                                break;
                            }
                        }
                        if (attrPos != -1) {
                            /* Remove first field name line */
                            arr.shift();
                            /* Extract the value of the desired attribute */
                            var vals = jQuery.map(arr, function(elt) {
                                var eltAttrVals = magic.modules.Common.csvToArray(elt);
                                if (jQuery.isArray(eltAttrVals) && eltAttrVals.length > 0) {
                                    if (jQuery.isArray(eltAttrVals[0]) && eltAttrVals[0].length > attrPos) {
                                        return(eltAttrVals[0][attrPos]);
                                    }
                                }
                                return(null);                                
                            });
                            this.populateUniqueValueSelection(vals, attrVal);
                        }
                    }
                }, this))
                .fail(jQuery.proxy(function(jqXhr, status, err) {
                    /* Leave the status quo unchanged for now */
                }, this));  
        } else {
            /* Unique values from the source features */
            var source = null;
            if (jQuery.isFunction(this.layer.getSource().getSource && this.layer.getSource().getSource() instanceof ol.source.Vector)) {
                source = this.layer.getSource().getSource();
            } else if (this.layer.getSource() instanceof ol.source.Vector) {
                source = this.layer.getSource();
            }
            var foundDict = {};
            var vals = jQuery.map(source.getFeatures(), jQuery.proxy(function(feat, idx) {
                var eltAttrVal = feat.get(attrName);
                if (foundDict[eltAttrVal] !== true) {
                    foundDict[eltAttrVal] = true;
                    return(eltAttrVal);
                }
                return(null);
            }, this));
            this.populateUniqueValueSelection(vals, attrVal);            
        }
    }
        
};

/**
 * Construct an ECQL filter from the inputs and apply to layer
 */
magic.classes.LayerFilter.prototype.applyFilter = function() {
    
    /* Reset the errors */
    jQuery("div.layer-filter-panel").find("div.form-group").removeClass("has-error");
    
    var inputComparison = jQuery("#ftr-comparison-type-" + this.nodeid);
    var selectOpStr = jQuery("#ftr-op-str-" + this.nodeid);
    var inputValStr = jQuery("#ftr-val-str-" + this.nodeid);
    var selectOpNum = jQuery("#ftr-op-num-" + this.nodeid);
    var inputValNum1 = jQuery("#ftr-val-num1-" + this.nodeid);
    var inputValNum2 = jQuery("#ftr-val-num2-" + this.nodeid);
    var inputValDate1 = jQuery("#ftr-val-date1-" + this.nodeid);
    var inputValDate2 = jQuery("#ftr-val-date2-" + this.nodeid);
    
    var ecql = null;          
    /* Construct a new ECQL filter based on form inputs */
    var fattr = jQuery("#ftr-attr-" + this.nodeid).val();
    var comparisonType = inputComparison.val();
    var fop = null, fval1 = null, fval2 = null, rules = [];
    var filterString = null;
    /* Validate the inputs */
    if (!comparisonType || comparisonType == "string") {
        fop = "ilike";
        if (selectOpStr.parent().hasClass("hidden")) {
            selectOpStr = jQuery("#ftr-op-str-unique-" + this.nodeid);
        } 
        if (inputValStr.parent().hasClass("hidden")) {
            inputValStr = jQuery("#ftr-val-str-unique-" + this.nodeid);
        }
        var ciOp = selectOpStr.val();
        if (ciOp == "nn") {
            filterString = fattr + " IS NOT NULL";
        } else {
            fval1 = inputValStr.val().replace(/\'/g, "''");
            if (fval1 != null && fval1 != "") {
                switch(ciOp) {                
                    case "sw":
                        fval1 = fval1 + "%";
                        break;
                    case "ew":
                        fval1 = "%" + fval1;
                        break;
                    case "ct":
                        fval1 = "%" + fval1 + "%";
                        break;                
                    default:
                        break;
                }
                filterString = fattr + " " + fop + " '" + fval1 + "'";
            } else {
                magic.modules.Common.flagInputError(inputValStr);
            }
        }
    } else if (comparisonType == "number") {
        fop = selectOpNum.val();
        fval1 = inputValNum1.val();
        if (fval1 != null && fval1 != "") {
            filterString = fattr + " " + fop + " '" + fval1 + "'";
            if (fop == "between") {
                fval2 = inputValNum2.val();
                if (fval2 != null && fval2 != "") {
                    filterString += " and " + fval2;
                } else {
                    filterString = null;
                    magic.modules.Common.flagInputError(inputValNum2);
                }                
            }
        } else {
            magic.modules.Common.flagInputError(inputValNum1);
        }                
    } else if (comparisonType == "date") {
        fop = selectOpNum.val();
        fval1 = inputValDate1.val();
        if (fval1 != null && fval1 != "") {
            filterString = fattr + " " + fop + " '" + fval1 + "'";
            if (fop == "between") {
                fval2 = inputValDate2.val();
                if (fval2 != null && fval2 != "") {
                    filterString += " and " + fval2;
                } else {
                    filterString = null;
                    magic.modules.Common.flagInputError(inputValDate2);
                }                
            }
        } else {
            magic.modules.Common.flagInputError(inputValDate1);
        }                
    } 
    if (filterString) {               
        
        /* Inputs ok */
        this.attr = fattr;
        this.comparison = comparisonType;
        this.op = fop;
        this.val1 = fval1;
        this.val2 = fval2; 
        
         /* Save filter */
        magic.runtime.filters[this.layer.get("name")] = jQuery.extend({}, {
            attr: this.attr,
            comparison: this.comparison,
            op: this.op,
            val1: this.val1,
            val2: this.val2
        });
        
        var sourceMd = this.layer.get("metadata").source;
        if (sourceMd.wms_source) {
            /* Straightforward WMS layer */
            if (comparisonType == "string") {
                ecql = filterString;
            } else {           
                ecql = fattr + " " + fop + " " + fval1 + (fop == "between" ? " and " + fval2 : "");            
            }
            this.layer.getSource().updateParams(jQuery.extend({}, 
                this.layer.getSource().getParams(), 
                {"cql_filter": ecql}
            ));
        } else if (sourceMd.geojson_source) {
            /* WFS/GeoJson source */
            this.filterVectorSource(this.layer.getSource(), false);           
        } else {
            /* GPX/KML */
            this.filterVectorSource(this.layer.getSource().getSource(), false);
        }
        jQuery("#ftr-btn-reset-" + this.nodeid).removeClass("disabled");
        /* Show filter badge */
        var filterBadge = jQuery("#layer-filter-badge-" + this.nodeid);
        filterBadge.removeClass("hidden").attr("data-original-title", filterString + " (click to remove filter)").tooltip("fixTitle");
        filterBadge.closest("a").click(jQuery.proxy(this.resetFilter, this));
        /* Reset the errors */
        jQuery("div.layer-filter-panel").find("div.form-group").removeClass("has-error");        
    }
};

/**
 * Reset a layer filter
 */
magic.classes.LayerFilter.prototype.resetFilter = function() { 
    
    /* Reset filter */
    magic.runtime.filters[this.layer.get("name")] = null;
    
    /* Reset current filter on layer */    
    this.attr = null;
    this.comparison = null;
    this.op = null;
    this.val1 = null;
    this.val2 = null;
    
    var sourceMd = this.layer.get("metadata").source;
    if (sourceMd.wms_source) {
        /* Straightforward WMS layer */
        this.layer.getSource().updateParams(jQuery.extend({}, 
            this.layer.getSource().getParams(),
            {"cql_filter": null}
        ));
    } else if (sourceMd.geojson_source) {
        /* WFS/GeoJSON */
        this.filterVectorSource(this.layer.getSource(), true);
    } else {
        /* GPX/KML */
        this.filterVectorSource(this.layer.getSource().getSource(), true);
    }
    jQuery("#ftr-btn-reset-" + this.nodeid).prop("disabled", true);    
    /* Hide filter badge */
    jQuery("#layer-filter-badge-" + this.nodeid).addClass("hidden");
    
};

/**
 * Reload a vector layer, applying the current filter (done via comparing individual feature attributes against the filter value)
 * @param {ol.source.Vector} source
 * @param {boolean} reset
 */
magic.classes.LayerFilter.prototype.filterVectorSource = function(source, reset) {   
    var emptyImgStyle = new ol.style.Style({image: ""});
    jQuery.each(source.getFeatures(), jQuery.proxy(function(idx, feat) {
        if (reset) {
            feat.setStyle(null);
        } else {
            var addIt = false;
            if (this.attr != null) {
                var attrVal = feat.get(this.attr);                
                switch(this.op) {
                    case "ilike": addIt = attrVal.toLowerCase().indexOf(this.val1.toLowerCase()) == 0; break;
                    case "=": addIt = attrVal == this.val1; break;
                    case ">": addIt = attrVal > this.val1; break;
                    case "<": addIt = attrVal < this.val1; break;
                    case ">=": addIt = attrVal >= this.val1; break;
                    case "<=": addIt = attrVal <= this.val1; break;
                    case "between": addIt = attrVal >= this.val1 && attrVal <= this.val2; break;
                    default: break;                        
                }
            }
            feat.setStyle(addIt ? null : emptyImgStyle);
        }
    }, this));        
};

/**
 * Populate the unique values selector 
 * @param {Array} attrVals
 * @param {String} selectedVal
 */
magic.classes.LayerFilter.prototype.populateUniqueValueSelection = function(attrVals, selectedVal) {            
    /* Sort attribute values into alphabetical order and ensure no duplicate values */
    attrVals = magic.modules.Common.sortedUniqueArray(attrVals);
    /* Populate select list */
    var selOpt = null;
    var uniqueSelect = jQuery("#ftr-val-str-unique-" + this.nodeid);
    uniqueSelect.find("option").remove();
    jQuery.each(attrVals, function(idx, aval) {
        var opt = jQuery("<option>", {value: aval});
        opt.text(aval);            
        uniqueSelect.append(opt);
        if (aval == selectedVal) {
            selOpt = opt;
        }
    });
    if (selOpt != null) {
        selOpt.prop("selected", "selected");
    }
    uniqueSelect.parent().removeClass("hidden");
    jQuery("#ftr-op-str-unique-" + this.nodeid).prop("selectedIndex", 0).parent().removeClass("hidden");
    jQuery("#ftr-val-str-" + this.nodeid).parent().addClass("hidden");
    jQuery("#ftr-op-str-" + this.nodeid).parent().addClass("hidden");
};

/* Layer tree */

magic.classes.LayerTree = function (target, container) {

    this.target = target || "layer-tree";
    
    this.container = container;
   
    this.treedata = magic.runtime.map_context.data.layers || [];
    
    /* User saved map payload of form:
     * {
     *     center: [<x>, <y>],
     *     zoom: <level>,
     *     layers: {
     *         <nodeid>: {
     *             visibility: <t|f>,
     *             opacity: <opacity>
     *         }
     *     },
     *     groups: {
     *         <nodeid>: <t|f>
     *     }
     * }
     */
    this.userdata = magic.runtime.map_context.userdata;

    /* Dictionary mapping from a node UUID to an OL layer */
    this.nodeLayerTranslation = {};

    /* Dictionary of layers by source type, for stacking purposes on map */
    this.layersBySource = {
        "base": [],
        "wms": [],        
        "geojson": [],
        "esrijson": [],
        "gpx": [],
        "kml": []
    };
    
    /* Create an attribution modal for legend/metadata */
    this.attribution = new magic.classes.AttributionModal({target: "attribution-modal"});
    
    /* Cache of granule information for time-series players, for performance */
    this.timeSeriesCache = {};
    
    /* Performance - avoid a DOM-wide search whenever tree refreshed to show visibilities */
    this.layerGroupDivs = [];
    
    /* Time-dependent layer movie player instances, indexed by node id */
    this.moviePlayers = {};
    
    /* Groups which require an autoload (keyed by uuid) */
    this.autoloadGroups = {};
    
    /* Z-index stacking (used to insert autoload WMS groups in the right place) */
    this.zIndexWmsStack = 0;
    
    /* Defaults for filling out autoload nodes */
    this.defaultNodeAttrs = {
        legend_graphic: null,
        refresh_rate: 0,
        min_scale: 1,
        max_scale: 50000000,
        opacity: 1.0,
        is_visible: false,
        is_interactive: false,
        is_filterable: false        
    };
    this.defaultSourceAttrs = {
        style_name: null,
        is_base: false,
        is_singletile: false,
        is_dem: false,
        is_time_dependent: false
    };
    this.defaultAttributeAttrs = {
        displayed: true,
        nillable: true,
        filterable: false,
        alias: "",
        ordinal: null,
        unique_values: false
    };
    this.maxAttrs = 10;
    
    /* Callback to be invoked on layer visibility change (e.g. destroy pop-ups) */
    this.visibilityChangeCallback = null;
    
    var targetElement = jQuery("#" + this.target);
    /* Layer search form */
    targetElement.append(
        '<div class="layersearch-panel panel panel-info hidden" style="margin-bottom:0px">' + 
            '<div class="panel-heading" style="padding-bottom:0px">' + 
                '<div class="layersearch-form form-group form-group-sm">' + 
                    '<div class="input-group">' + 
                        '<input id="' + this.id + '-layersearch-ta" class="form-control typeahead border-lh-round" type="text" placeholder="Name of layer" ' + 
                        'required="required" autofocus="true"></input>' + 
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-layersearch-go" class="btn btn-default btn-sm" type="button" ' + 
                                'data-toggle="tooltip" data-container="body" data-placement="bottom" title="Locate data layer in tree">' + 
                                '<span class="fa fa-search"></span>' + 
                            '</button>' +
                        '</span>' +
                        '<span><button type="button" style="padding-bottom:10px" class="close">&times;</button></span>' + 
                    '</div>'+
                '</div>' + 
            '</div>' + 
        '</div>'
    );
    
    this.initTree(this.treedata, targetElement, 0);
    
    /* Layer tree is visible => assign all the necessary handlers  */
    var expanderLocation = jQuery("#" + this.target).find("div.panel-heading").eq(1);
    if (expanderLocation) {
        expanderLocation.append(                
            '<span data-toggle="tooltip" data-placement="bottom" title="Collapse layer tree" ' + 
                'class="layer-tree-collapse fa fa-angle-double-left hidden-xs"></span>' + 
            '<span data-toggle="tooltip" data-placement="bottom" title="Search for a data layer" ' +
                'class="layer-tree-search fa fa-search"></span>'
        );
    }

    /* Collapse layer tree handler */
    jQuery("span.layer-tree-collapse").on("click", jQuery.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(true);
    }, this));

    /* Expand layer tree handler */
    jQuery("button.layer-tree-expand").on("click", jQuery.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(false);
    }, this));
    
    this.collapsed = false;
    
    /* Compile list of layer groups */
    this.layerGroupDivs = jQuery("#" + this.target).find("div.layer-group"); 
    
    /* Set up the layer search */
    this.initLayerSearchTypeahead();    

    /* Assign all handlers */
    this.initHandlers(null);  
    this.refreshTreeIndicators(); 
    this.chromeRefreshWorkaround();
};

magic.classes.LayerTree.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.LayerTree.prototype.getLayers = function () {
    return(
        this.layersBySource["base"].concat(
            this.layersBySource["wms"],
            this.layersBySource["geojson"],
            this.layersBySource["esrijson"],
            this.layersBySource["gpx"],
            this.layersBySource["kml"]                                        
    ));        
};

magic.classes.LayerTree.prototype.getBaseLayers = function () {
    return(this.layersBySource["base"]);        
};

magic.classes.LayerTree.prototype.getWmsOverlayLayers = function () {
    return(this.layersBySource["wms"]);        
};

magic.classes.LayerTree.prototype.getNodeId = function (targetId) {
    return(targetId.substring(targetId.length-36));
};

magic.classes.LayerTree.prototype.getCollapsed = function () {
    return(this.collapsed);
};

magic.classes.LayerTree.prototype.setCollapsed = function (collapsed) {
    if (collapsed) {
        jQuery("#" + this.target).hide({
            complete: this.container.fitMapToViewport
        });
    } else {
        jQuery("#" + this.target).show({
            complete: this.container.fitMapToViewport
        });
    }
    this.collapsed = collapsed;
};

/**
 * Add handlers for operations on layer groups, optionally only under the specified element
 * @param {jQuery.object} belowElt
 */
magic.classes.LayerTree.prototype.assignLayerGroupHandlers = function(belowElt) {
    
    /* Assign layer group visibility handlers */
    var groupVis = null;
    if (belowElt) {
        groupVis = belowElt.find("input.layer-vis-group-selector");
    } else {
        groupVis = jQuery("input.layer-vis-group-selector");
    }        
    groupVis.change(jQuery.proxy(this.groupVisibilityHandler, this)); 

    /* Change tooltip for collapsible panels */
    var groupPanel = null;
    if (belowElt) {
        groupPanel = belowElt.find("div[id^='layer-group-panel-']");
    } else {
        groupPanel = jQuery("div[id^='layer-group-panel-']");
    }    
    groupPanel
    .on("shown.bs.collapse", jQuery.proxy(function (evt) {       
        jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Collapse this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this))
    .on("hidden.bs.collapse", jQuery.proxy(function (evt) {        
        jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Expand this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this));        
};

/**
 * Add handlers for operations on layers, optionally only under the specified element
 * @param {jQuery.object} belowElt
 */
magic.classes.LayerTree.prototype.assignLayerHandlers = function(belowElt) {
    
    /* Assign layer visibility handlers */
    var layerVis = null;
    if (belowElt) {
        layerVis = belowElt.find("input.layer-vis-selector");
    } else {
        layerVis = jQuery("input.layer-vis-selector");
    }                
    layerVis.change(jQuery.proxy(this.layerVisibilityHandler, this));
    
    /* The get layer info buttons */
    var layerInfo = null;
    if (belowElt) {
        layerInfo = belowElt.find("a[id^='layer-info-']");
    } else {
        layerInfo = jQuery("a[id^='layer-info-']");
    }    
    layerInfo.on("click", jQuery.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        this.attribution.show(this.nodeLayerTranslation[nodeid]);
    }, this));

    /* Layer dropdown handlers */
    var layerDropdown = null;
    if (belowElt) {
        layerDropdown = belowElt.find("a.layer-tool");
    } else {
        layerDropdown = jQuery("a.layer-tool");
    }    
    layerDropdown.click(jQuery.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        new magic.classes.LayerTreeOptionsMenu({
            nodeid: nodeid,
            layer: this.nodeLayerTranslation[nodeid]
        });
    }, this));          

    /* Initialise checked indicator badges in layer groups */
    var layerBadgeCount = null;
    if (belowElt) {
        layerBadgeCount = belowElt.find("input[id^='layer-cb-']:checked");
    } else {
        layerBadgeCount = jQuery("input[id^='layer-cb-']:checked");
    }    
    layerBadgeCount.each(jQuery.proxy(function(idx, elt) {
        this.setLayerVisibility(jQuery(elt));
    }, this));
};

/**
 * Radio button layer groups - assign handlers for the "turn all layers off" button, optionally below a specified element
 * @param {jQuery.object} belowElt 
 */
magic.classes.LayerTree.prototype.assignOneOnlyLayerGroupHandlers = function(belowElt) {
    var layerRbs;
    if (belowElt) {
        layerRbs = belowElt.find("a[id^='group-rb-off-']");
    } else {
        layerRbs = jQuery("a[id^='layer-info-']");
    }    
    layerRbs.each(jQuery.proxy(function(idx, elt) {
        var allOff = jQuery(elt);
        allOff.click(jQuery.proxy(function(evt) {
            var groupsDone = {};
            allOff.closest("div.layer-group").find("input[type='radio']").each(jQuery.proxy(function(idx2, rbElt) {
                if (!groupsDone[rbElt.name]) {
                    jQuery("input[name='" + rbElt.name + "']").prop("checked", false);                    
                    groupsDone[rbElt.name] = true;
                }
                this.setLayerVisibility(jQuery(rbElt), true);
            }, this));
        }, this));                
    }, this));  
};

/**
 * Initialise handlers
 * @param {jQuery.object} belowElt 
 */
magic.classes.LayerTree.prototype.initHandlers = function(belowElt) {
    this.assignLayerGroupHandlers(belowElt);
    this.assignLayerHandlers(belowElt);  
    this.assignOneOnlyLayerGroupHandlers(belowElt);        
};

/**
 * Insert per-node properties and styling into layer tree structure, as well as creating OL layers where needed
 * @param {array} nodes
 * @param {jQuery,Object} element
 * @param {int} depth
 */
magic.classes.LayerTree.prototype.initTree = function (nodes, element, depth) {
    jQuery.each(nodes, jQuery.proxy(function (i, nd) {
        if (jQuery.isArray(nd.layers)) {
            /* Style a group */
            var groupExpanded = this.userGroupExpanded(nd.id, nd.expanded);      
            var ellipsisName = magic.modules.Common.ellipsis(nd.name, 25);            
            var title = (ellipsisName != nd.name ? nd.name + " - " : "") + (groupExpanded ? "Collapse" : "Expand") + " this group";            
            var hbg = depth == 0 ? "panel-primary" : (depth == 1 ? "panel-info" : "");
            var topMargin = i == 0 ? "margin-top:5px" : "";
            var oneOnly = (nd.base === true || nd.one_only === true);
            element.append(
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.id + '">' : "") +
                    '<div class="panel ' + hbg + ' center-block layer-group" style="' + topMargin + '">' +
                        '<div class="panel-heading" id="layer-group-heading-' + nd.id + '">' +
                            '<span class="icon-layers"></span>' +
                            (nd.base ? '<span style="margin:5px"></span>' : 
                             nd.one_only ? '<a id="group-rb-off-' + nd.id + '" href="Javascript:void(0)" role="button" ' + 
                             'data-toggle="tooltip" data-placement="right" title="Turn all radio button controlled layers off">' + 
                             '<span style="margin:5px; color:' + (depth == 0 ? 'white' : '#202020') + '" class="fa fa-eye-slash">&nbsp;</span></a>' :
                             '<input class="layer-vis-group-selector" id="group-cb-' + nd.id + '" type="checkbox"></input>') +
                            (oneOnly ? '' : '<span class="badge checked-indicator-badge hidden"><span class="fa fa-eye">&nbsp;</span>0</span>') + 
                            '<span class="panel-title layer-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' +
                                '<a class="layer-group-tool" role="button" data-toggle="collapse" href="#layer-group-panel-' + nd.id + '">' +
                                    '<span style="font-weight:bold">' + ellipsisName + '</span>' +
                                '</a>' +
                            '</span>' +
                        '</div>' +
                        '<div id="layer-group-panel-' + nd.id + '" class="panel-collapse collapse' + (groupExpanded ? ' in' : '') + '">' +
                            '<div class="panel-body" style="padding:0px">' +
                                '<ul class="list-group layer-list-group ' + (oneOnly ? 'one-only' : '') + '" id="layer-group-' + nd.id + '">' +
                                '</ul>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '</li>' : "")
                    );
            this.initTree(nd.layers, jQuery("#layer-group-" + nd.id), depth + 1);
            if (nd.autoload === true) {
                /* Layers to be autoloaded from local server later */
                this.autoloadGroups[nd.id] = {
                    expanded: groupExpanded,
                    filter: nd.autoload_filter,
                    popups: nd.autoload_popups === true,
                    insert: this.zIndexWmsStack
                };
                this.zIndexWmsStack++;  /* Make an insert point for the auto layers */
            }
        } else {
            /* Style a data node */
            this.addDataNode(nd, element);            
        }
    }, this));
};

/**
 * Create layer corresponding to a data node
 * @param {object} nd
 * @param {jQuery.Object} element
 */
magic.classes.LayerTree.prototype.addDataNode = function(nd, element) {
    if (!nd || !nd.source) {
        return;
    }
    var cb;
    var isWms = "wms_source" in nd.source;
    var isEsriTile = "esritile_source" in nd.source;
    var isSingleTile = isWms ? nd.source.is_singletile === true : false;
    var isBase = (isWms || isEsriTile) ? nd.source.is_base === true : false;
    var isInteractive = nd.is_interactive === true || (nd.source.geojson_source && nd.source.feature_name);
    var isTimeDependent = nd.source.is_time_dependent;
    var refreshRate = nd.refresh_rate || 0;
    var name = nd.name, /* Save name as we may insert ellipsis into name text for presentation purposes */
            ellipsisName = magic.modules.Common.ellipsis(nd.name, 30),
            infoTitle = "Get layer legend/metadata",
            nameSpan = ellipsisName;
    if (name != ellipsisName) {
        /* Tooltip to give the full version of any shortened name */
        nameSpan = '<span data-toggle="tooltip" data-placement="top" title="' + name + '">' + ellipsisName + '</span>';
    }
    /* Determine visibility */
    var isVisible = this.userLayerAttribute(nd.id, "visibility", nd.is_visible);
    var issueLayerData = magic.runtime.issue.getPayload();
    if (issueLayerData != "None" && issueLayerData.visible && issueLayerData.visible[name]) {
        isVisible = issueLayerData.visible[name];
    }
    /* Determine opacity */
    var layerOpacity = this.userLayerAttribute(nd.id, "opacity", nd.opacity);   
    if (isBase) {
        cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.id + '" type="radio" ' + (isVisible ? "checked" : "") + '></input>';
    } else if (element.hasClass("one-only")) {
        var eltId = element.attr("id");
        cb = '<input class="layer-vis-selector" name="layer-rb-' + eltId + '" id="layer-rb-' + nd.id + '" type="radio" ' + (isVisible ? "checked" : "") + '></input>';
    } else {
        cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.id + '" type="checkbox" ' + (isVisible ? "checked" : "") + '></input>';
    }           
    element.append(
            '<li class="list-group-item layer-list-group-item" id="layer-item-' + nd.id + '">' +
                '<table style="table-layout:fixed; width:100%">' + 
                    '<tr>' + 
                        '<td style="width:5%">' + 
                            '<a id="layer-info-' + nd.id + '" style="cursor:pointer" data-toggle="tooltip" data-placement="right" data-html="true" ' +
                                'title="' + (isInteractive ? infoTitle + "<br>Click on map features for info" : infoTitle) + '">' +
                                '<span class="fa fa-info-circle' + (isInteractive ? ' clickable' : ' non-clickable') + '"></span>' +                                
                            '</a>' +
                        '</td>' +
                        '<td style="width:5%">' +
                            '<div id="vis-wrapper-' + nd.id + '" style="cursor:pointer" tabindex="0"' + 
                            (isTimeDependent ? ' data-trigger="manual" data-toggle="popover" data-placement="bottom"' : '') + '>' + 
                            cb + 
                            '</div>' + 
                        '</td>' +
                        '<td style="width:80%; padding-left:10px; text-overflow: ellipsis">' +  
                            '<a href="Javascript:void(0)">' + 
                                '<span id="layer-filter-badge-' + nd.id + '" class="badge filter-badge hidden" ' + 
                                'data-toggle="tooltip" data-placement="right" title="">filter</span>' +
                            '</a>' + 
                            nameSpan +
                        '</td>' +   
                        '<td style="width:10%">' +
                            '<a class="layer-tool" id="layer-opts-' + nd.id + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                                '<span class="fa fa-bars"></span><b class="caret"></b>' +
                            '</a>' +
                            '<ul id="layer-opts-dm-' + nd.id + '" aria-labelled-by="layer-opts-' + nd.id + '" class="dropdown-menu dropdown-menu-right layer-options-dd-menu">' +
                            '</ul>' +
                        '</td>' +
                    '</tr>' + 
                '</table>' + 
            '</li>'
            );            
    /* Create a data layer */
    var layer = null;
    var proj = ol.proj.get(magic.runtime.map_context.data.projection); 
    var resolutions = magic.runtime.map_context.data.resolutions;
    /* Get min/max resolution */  
    var minRes = undefined, maxRes = undefined;
    if (!(nd.source.wms_source && nd.source.wms_source == "osm")) {
        if (resolutions) {
            minRes = resolutions[resolutions.length-1];
            maxRes = resolutions[0]+1;   /* Note: OL applies this one exclusively, whereas minRes is inclusive - duh! */  
            if (jQuery.isNumeric(nd.min_scale)) {
                minRes = magic.modules.GeoUtils.getResolutionFromScale(nd.min_scale, resolutions, proj);
            }
            if (jQuery.isNumeric(nd.max_scale)) {
                maxRes = magic.modules.GeoUtils.getResolutionFromScale(nd.max_scale, resolutions, proj);
            }
        }
    }
    if (isWms) {
        if (nd.source.wms_source == "osm") {
            /* OpenStreetMap layer */
            layer = magic.modules.Endpoints.getMidLatitudeCoastLayer();
            layer.set("metadata", nd);
        } else if (isSingleTile) {
            /* Render point layers with a single tile for labelling free of tile boundary effects */
            var wmsSource = new ol.source.ImageWMS(({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": nd.source.style_name ? (nd.source.style_name == "default" ? "" : nd.source.style_name) : ""
                },
                projection: proj
            }));
            layer = new ol.layer.Image({
                name: name,
                visible: isVisible,
                opacity: layerOpacity || 1.0,
                metadata: nd,
                source: wmsSource,
                minResolution: minRes,
                maxResolution: maxRes
            });                    
        } else {
            /* Non-point layer */
            var wmsVersion = "1.3.0";
            var wmsSource = new ol.source.TileWMS({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": nd.source.style_name ? (nd.source.style_name == "default" ? "" : nd.source.style_name) : "",
                    "TRANSPARENT": true,
                    "CRS": proj.getCode(),
                    "SRS": proj.getCode(),
                    "VERSION": wmsVersion,
                    "TILED": true
                },
                tileGrid: new ol.tilegrid.TileGrid({
                    resolutions: resolutions,
                    origin: proj.getExtent().slice(0, 2)
                }),
                projection: proj
            });
            layer = new ol.layer.Tile({
                name: name,
                visible: isVisible,
                opacity: layerOpacity || 1.0,
                minResolution: minRes,
                maxResolution: maxRes,
                metadata: nd,
                source: wmsSource
            });
        }
        if (isBase) {
            layer.setZIndex(0);
            this.layersBySource["base"].push(layer);
        } else {
            layer.setZIndex(this.zIndexWmsStack);
            this.zIndexWmsStack++;
            this.layersBySource["wms"].push(layer); 
        }           
    } else if (nd.source.esritile_source) {
        /* ArcGIS Online tiled source */
        layer = new ol.layer.Tile({
            name: name,
            visible: isVisible,
            opacity: layerOpacity || 1.0,
            metadata: nd,
            minResolution: minRes,
            maxResolution: maxRes,
            extent: proj.getExtent(),
            source: new ol.source.TileArcGISRest({
                url: nd.source.esritile_source
            })
        });
        if (isBase) {
            layer.setZIndex(0);
            this.layersBySource["base"].push(layer);
        } else {
            layer.setZIndex(this.zIndexWmsStack);
            this.zIndexWmsStack++;
            this.layersBySource["wms"].push(layer); 
        }           
    } else if (nd.source.geojson_source) {
        /* GeoJSON layer */
        var vectorSource;
        var labelRotation = nd.source.feature_name ? 0.0 : -magic.runtime.map_context.data.rotation;
        var format = new ol.format.GeoJSON();
        var url = nd.source.geojson_source;
        if (nd.source.feature_name) {                           
            /* WFS */
            url = magic.modules.Endpoints.getOgcEndpoint(url, "wfs") + "?service=wfs&version=2.0.0&request=getfeature&outputFormat=application/json&" + 
                "typenames=" + nd.source.feature_name + "&" + 
                "srsname=" + (nd.source.srs || magic.runtime.map.getView().getprojection().getCode());
            vectorSource = new ol.source.Vector({
                format: format,
                loader: function(extent) {
                    if (!jQuery.isArray(extent) || !(isFinite(extent[0]) && isFinite(extent[1]) && isFinite(extent[2]) && isFinite(extent[3]))) {
                        extent = magic.runtime.map_context.data.proj_extent;
                    }
                    var wfs = url + "&bbox=" + extent.join(",");
                    jQuery.ajax({
                        url: wfs,
                        method: "GET"                   
                    })
                    .done(function(data) {
                        vectorSource.addFeatures(format.readFeatures(data));
                    })
                    .fail(function(xhr) {
                        var msg;
                        if (xhr.status == 401) {
                            msg = "Not authorised to access layer " + nd.source.feature_name;
                        } else {
                            try {
                                msg = JSON.parse(xhr.responseText)["detail"];
                            } catch(e) {
                                msg = xhr.responseText;
                            }
                        }
                        magic.modules.Common.showAlertModal(msg, "warning");                        
                    });
                }
            });  
        } else {
            /* Another GeoJSON source */
            url = magic.modules.Common.proxyUrl(url);
            vectorSource = new ol.source.Vector({
                format: format,
                url: url
            });  
        }        
        layer = new ol.layer.Vector({
            name: nd.name,
            visible: isVisible,
            source: vectorSource,
            style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation),
            metadata: nd,
            minResolution: minRes,
            maxResolution: maxRes
        });        
        layer.setZIndex(200);
        this.layersBySource["geojson"].push(layer);
    } else if (nd.source.esrijson_source) {
        /* ESRI JSON layer */
        var vectorSource;
        var format = new ol.format.EsriJSON();
        var labelRotation = -magic.runtime.map_context.data.rotation;
        vectorSource = new ol.source.Vector({
            format: format,
            loader: function() {
                jQuery.getJSON(nd.source.esrijson_source, function(data) {
                    var layerTitle = nd.source.layer_title;
                    var opLayers;
                    try {
                        if (layerTitle) {
                            opLayers = jQuery.grep(data.operationalLayers, function(oplayer) {
                                return(oplayer.title == layerTitle);
                            });
                        } else {
                            opLayers = [data.operationalLayers[0]];
                        }
                        var features = format.readFeatures(opLayers[0].featureCollection.layers[0].featureSet, {
                            dataProjection: "EPSG:3857",
                            featureProjection: magic.runtime.map_context.data.projection
                        });
                        vectorSource.addFeatures(features);
                    } catch(e) {
                        magic.modules.Common.showAlertModal("Failed to parse the output from ESRI JSON service at " + nd.source.esrijson_source, "warning");                          
                    }
                })
                .fail(function(xhr) {
                    var msg;                    
                    try {msg = JSON.parse(xhr.responseText)["detail"];} catch(e) {msg = xhr.responseText;}
                    magic.modules.Common.showAlertModal(msg, "warning");                    
                });
            }
        });        
        layer = new ol.layer.Vector({
            name: nd.name,
            visible: isVisible,
            source: vectorSource,
            style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation),
            metadata: nd,
            minResolution: minRes,
            maxResolution: maxRes
        });        
        layer.setZIndex(200);
        this.layersBySource["esrijson"].push(layer);
    } else if (nd.source.gpx_source) {
        /* GPX layer */
        var labelRotation = -magic.runtime.map_context.data.rotation;
        layer = new ol.layer.Vector({
            name: nd.name,
            visible: isVisible,
            metadata: nd,    
            source: new ol.source.Vector({
                format: new ol.format.GPX({readExtensions: function(f, enode){                       
                    try {
                        var json = xmlToJSON.parseString(enode.outerHTML.trim());
                        if ("extensions" in json && jQuery.isArray(json.extensions) && json.extensions.length == 1) {
                            var eo = json.extensions[0];
                            for (var eok in eo) {
                                if (eok.indexOf("_") != 0) {
                                    if (jQuery.isArray(eo[eok]) && eo[eok].length == 1) {
                                        var value = eo[eok][0]["_text"];
                                        f.set(eok, value, true);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                    }
                    return(f);
                }}),
                url: magic.modules.Common.proxyUrl(nd.source.gpx_source)
            }),
            style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation),
            renderMode: "image",
            minResolution: minRes,
            maxResolution: maxRes
        });
        layer.setZIndex(400);
        this.layersBySource["gpx"].push(layer);
    } else if (nd.source.kml_source) {
        /* KML source */
        var kmlStyle = null;
        var labelRotation = -magic.runtime.map_context.data.rotation;
        if (typeof nd.source.style_definition == "string") {
            var sd = JSON.parse(nd.source.style_definition);
            if (sd.mode != "default") {
                kmlStyle = this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation);
            }
        }
        layer = new ol.layer.Vector({
            name: nd.name,
            visible: isVisible,
            metadata: nd,
            source: new ol.source.Vector({
                format: new ol.format.KML({
                    extractStyles: kmlStyle == null,
                    showPointNames: false
                }),
                url: magic.modules.Common.proxyUrl(nd.source.kml_source)
            }),
            renderMode: "image",
            minResolution: minRes,
            maxResolution: maxRes
        });
        if (kmlStyle != null) {
            layer.setStyle(kmlStyle);
        }
        layer.setZIndex(400);
        this.layersBySource["kml"].push(layer);
    }
    nd.layer = layer;
    this.nodeLayerTranslation[nd.id] = layer;
    if (refreshRate > 0) {
        setInterval(jQuery.proxy(this.refreshLayer, this), 1000*60*refreshRate, layer);
    }
};

/**
 * Fetch the data for all autoload layers
 * @param {ol.Map} map
 */
magic.classes.LayerTree.prototype.initAutoLoadGroups = function(map) { 
    jQuery.each(this.autoloadGroups, jQuery.proxy(function(grpid, grpo) {
        if (grpo.expanded) {
            /* Group starts expanded => layers need to be loaded now */
            this.populateAutoloadGroup(map, grpid, grpo);            
        } else {
            /* Group starts collapsed => layers can be lazily loaded for better map performance */
            jQuery("a[href='#layer-group-panel-" + grpid + "']").one("click", {id: grpid, o: grpo}, jQuery.proxy(function(evt) {
                this.populateAutoloadGroup(map, evt.data.id, evt.data.o);
            }, this));
        }        
    }, this));   
};

/**
 * Populate an auto-load layer group
 * @param {ol.Map} map
 * @param {String} grpid
 * @param {Object} grpo
 */
magic.classes.LayerTree.prototype.populateAutoloadGroup = function(map, grpid, grpo) { 
    var element = jQuery("#layer-group-" + grpid);
    if (element.length > 0) {
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/gs/layers/filter/" + encodeURIComponent(grpo.filter), 
            method: "GET",
            dataType: "json",
            contentType: "application/json"
        }).done(jQuery.proxy(function(data) {
            if (jQuery.isArray(data)) {
                /* Alphabetical order of name */
                data.sort(function(a, b) {
                    return(a.name.localeCompare(b.name));
                });
                for (var i = 0; i < data.length; i++) {
                    var nd = jQuery.extend({}, {
                        id: magic.modules.Common.uuid(),
                        name: data[i].name,
                        geom_type: data[i].geom_type,
                        attribute_map: data[i].attribute_map
                    }, this.defaultNodeAttrs);
                    nd.source = jQuery.extend({}, {
                        wms_source: magic.modules.Endpoints.getOgcEndpoint(data[i].wms_source, "wms"), 
                        feature_name: data[i].feature_name
                    }, this.defaultSourceAttrs);
                    nd.is_interactive = grpo.popups === true;
                    if (jQuery.isArray(nd.attribute_map)) {
                        for (var j = 0; j < nd.attribute_map.length; j++) {
                            /* Allow only 'maxAttrs' attributes to be displayed - http://redmine.nerc-bas.ac.uk/issues/4540 */
                            nd.attribute_map[j] = jQuery.extend({}, nd.attribute_map[j], this.defaultAttributeAttrs, {displayed: j < this.maxAttrs});
                        }                            
                    } else {
                        nd.is_interactive = false;
                    }
                    /* Should now have a node from which to create a WMS layer */
                    this.addDataNode(nd, element);
                    nd.layer.setZIndex(grpo.insert);
                    if (map) {                            
                        map.addLayer(nd.layer);
                    }
                    this.nodeLayerTranslation[nd.id] = nd.layer;
                    this.initHandlers(element);
                    this.refreshTreeIndicators(element.parents("div.layer-group"));
                }                        
            }                   
        }, this)).fail(function(xhr) {
            magic.modules.Common.showAlertModal(JSON.parse(xhr.responseText)["detail"], "warning");            
        });                                
    }
};

/**
 * Initialise typeahead handlers and config for layer search 
 */
magic.classes.LayerTree.prototype.initLayerSearchTypeahead = function() {
    
    jQuery("#" + this.id + "-layersearch-ta").typeahead(
        {minLength: 2, highlight: true}, 
        {
            limit: 100,
            async: true,
            source: jQuery.proxy(this.layerMatcher, this)(),
            templates: {
                notFound: '<p class="suggestion">No results</p>',
                header: '<div class="suggestion-group-header">Data layers</div>',
                suggestion: function(value) {                    
                    return('<p class="suggestion">' + value + '</p>');
                }
            }
        }
    )
    .on("typeahead:autocompleted", jQuery.proxy(this.layerSearchSuggestionSelectHandler, this))
    .on("typeahead:selected", jQuery.proxy(this.layerSearchSuggestionSelectHandler, this));
    
    /* Expand search form */
    jQuery("span.layer-tree-search").on("click", function (evt) {
        evt.stopPropagation();
        var pnl = jQuery(".layersearch-panel");
        pnl.removeClass("hidden").addClass("show");
        /* To work round the time lag with showing the typeahead in the previously hidden form
         * see: https://github.com/twitter/typeahead.js/issues/712 */          
        setTimeout(function() {
            pnl.find("input").focus();
        }, 100);            
    });

    /* Collapse search form */
    jQuery(".layersearch-form").find(".close").on("click", function (evt) {
        evt.stopPropagation();
        jQuery(".layersearch-panel").removeClass("show").addClass("hidden");
    });      
};

/**
 * Handler for an autocompleted selection of layer name
 * @param {jQuery.Event} evt
 * @param {Object} sugg
 */
magic.classes.LayerTree.prototype.layerSearchSuggestionSelectHandler = function(evt, sugg) {
    /* sugg will contain the name of the layer, from which we can deduce the node id */
    var theLayer = null;
    magic.runtime.map.getLayers().forEach(function (layer) {
        if (layer.get("name") == sugg) {
            theLayer = layer;
        }
    });
    if (theLayer != null && theLayer.get("metadata")) {
        /* Got the layer - get the node id */
        var nodeId = theLayer.get("metadata").id;
        var layerControl = jQuery("#layer-item-" + nodeId);
        var context = {nopened: 0, ntotal: 0};         
        var enclosingUnopenedGroups = jQuery.grep(layerControl.parents("[id^='layer-group-panel']"), function(elt, idx) {
            var pnl = jQuery(elt);
            if (!pnl.hasClass("in")) {
                /* This group is not open, so open it */
                pnl.on("shown.bs.collapse", jQuery.proxy(function(e) {
                    this.nopened++;
                    if (this.nopened == this.ntotal) {
                        magic.modules.Common.scrollViewportToElement(layerControl[0]);
                        layerControl.css("background-color", "#ff0000");
                        setTimeout(function() {
                            layerControl.css("background-color", "#ffffff");
                        }, 1000);
                    }
                }, context));
                return(true);
            }
        });
        context.ntotal = enclosingUnopenedGroups.length;
        if (context.ntotal == 0) {
            /* Nothing to open - just scroll to element */
            magic.modules.Common.scrollViewportToElement(layerControl[0]);
            layerControl.css("background-color", "#ff0000");
            setTimeout(function() {
                layerControl.css("background-color", "#ffffff");
            }, 1000);
        } else {
            /* Open layer groups that need it */
            jQuery.each(enclosingUnopenedGroups, function(idx, elt) {
                jQuery(elt).collapse("toggle");            
            });  
        }
    }
};

/**
 * setInterval handler to refresh a layer
 * @param {ol.Layer} layer
 */
magic.classes.LayerTree.prototype.refreshLayer = function(layer) {
    if (typeof layer.getSource().updateParams === "function") {
        /* Add time parameter to force refresh of WMS layer */
        var params = layer.getSource().getParams();
        params.t = new Date().getMilliseconds();
        layer.getSource().updateParams(params);
    } else if (layer.getSource() instanceof ol.source.Vector) {
        /* WFS/GeoJSON layer */
        this.reloadVectorSource(layer.getSource());
    } else if (jQuery.isFunction(layer.getSource().getSource) && layer.getSource().getSource() instanceof ol.source.Vector) {
        /* GPX/KML layers */
        this.reloadVectorSource(layer.getSource().getSource());
    }
};

/**
 * Reload the data from a vector source (layer refresh)
 * See: https://github.com/openlayers/ol3/issues/2683
 * @param {ol.source.Vector} source
 */
magic.classes.LayerTree.prototype.reloadVectorSource = function(source) {
    jQuery.ajax(source.getUrl(), function(response) {
        var format = source.getFormat();
        source.clear(true);
        source.addFeatures(format.readFeatures(response));
    });
};

/**
 * Figures out which (if any) field in the attribute map is designed to be the feature label
 * @param {Array} attrMap
 * @returns {undefined}
 */
magic.classes.LayerTree.prototype.getLabelField = function(attrMap) {
    var labelField = null;
    if (jQuery.isArray(attrMap)) {
        jQuery.each(attrMap, function(idx, attr) {
            if (attr.label === true) {
                labelField = attr.name;
                return(false);
            }
        });
    }
    return(labelField);
};

/**
 * Set layer visibility
 * @param {jQuery.Object} chk
 * @param {boolean} forceOff
 */
magic.classes.LayerTree.prototype.setLayerVisibility = function(chk, forceOff) {   
    var id = chk.prop("id");
    var nodeid = this.getNodeId(id);
    var layer = this.nodeLayerTranslation[nodeid];
    if (id.indexOf("base-layer-rb") == 0) {
        /* Base layer visibility change */
        jQuery.each(this.layersBySource["base"], jQuery.proxy(function (bli, bl) {                
            bl.setVisible(bl.get("metadata")["id"] == nodeid);
        }, this));            
        /* Trigger baselayerchanged event */
        jQuery.event.trigger({
            type: "baselayerchanged",
            layer: layer
        });
    } else if (id.indexOf("layer-rb") == 0) {
        /* Layer visibility change in a one-only display group - http://redmine.nerc-bas.ac.uk/issues/4538 */
        var rbName = chk.prop("name");
        jQuery("input[name='" + rbName + "']").each(jQuery.proxy(function(idx, elt) {
            var bl = this.nodeLayerTranslation[this.getNodeId(jQuery(elt).prop("id"))];
            if (forceOff === true) {
                bl.setVisible(false);
            } else {
                bl.setVisible(bl.get("metadata")["id"] == nodeid);
            }
        }, this));                      
    } else {
        /* Overlay layer visibility change */        
        layer.setVisible(chk.prop("checked"));
        var md = layer.get("metadata");
        if (md && md.source && md.source.is_time_dependent) {
            /* Display time-series movie player for layer */
            if (!this.moviePlayers[md.id]) {
                /* Find enclosing div */
                var lgp = jQuery("#vis-wrapper-" + md.id).closest("li[id^='layer-item-']");
                this.moviePlayers[md.id] = new magic.classes.MosaicTimeSeriesPlayer({
                    "nodeid": md.id, 
                    "target": "vis-wrapper-" + md.id, 
                    "container": lgp ? "#" + lgp.prop("id") : "body",
                    "layer": layer,
                    "cache": this.timeSeriesCache
                });
            }
            if (chk.prop("checked")) {
                this.moviePlayers[md.id].activate();
            } else {
                this.moviePlayers[md.id].deactivate();
            }            
        }
    }    
    if (jQuery.isFunction(magic.runtime.layer_visibility_change_callback)) {
        magic.runtime.layer_visibility_change_callback();
    }
};

/**
 * Handle layer visibility
 * @param {jQuery.Event} evt
 */
magic.classes.LayerTree.prototype.layerVisibilityHandler = function(evt) {
    this.setLayerVisibility(jQuery(evt.currentTarget));    
    this.refreshTreeIndicators(jQuery(evt.currentTarget).parents("div.layer-group"));
};

/**
 * Handler for group visibility checkbox
 * @param {jQuery.Event} evt
 */
magic.classes.LayerTree.prototype.groupVisibilityHandler = function(evt) { 
    var chk = jQuery(evt.currentTarget);
    var checked = chk.prop("checked");
    jQuery.each(chk.closest("div.panel").find("input[type='checkbox']"), jQuery.proxy(function(idx, cb) {
        var jqCb = jQuery(cb);
        if (jqCb.hasClass("layer-vis-selector")) {
            /* Layer visibility */
            jqCb.off("change").prop("checked", checked).change(jQuery.proxy(this.layerVisibilityHandler, this));
            this.setLayerVisibility(jqCb);
        } else {
            /* Group visibility */
            jqCb.off("change").prop("checked", checked).change(jQuery.proxy(this.groupVisibilityHandler, this));
        }
    }, this)); 
    this.refreshTreeIndicators(chk.parents("div.layer-group"));
};

/**
 * Recurse down the tree setting indicator badges, filtering the work by the supplied parental branch
 * @param {Array} branchHierarchy
 */
magic.classes.LayerTree.prototype.refreshTreeIndicators = function(branchHierarchy) {    
    this.layerGroupDivs.each(jQuery.proxy(function(idx, elt) {
        if (!jQuery.isArray(branchHierarchy) || (jQuery.isArray(branchHierarchy) && jQuery.inArray(elt, branchHierarchy) != -1)) {
            var jqp = jQuery(elt);
            var cbs = jqp.find("input[id^='layer-cb-']");
            var cbx = cbs.filter(":checked");
            if (cbx.length == cbs.length) {
                /* Additionally check the group checkbox for this panel */
                var gcb = jqp.first().find("input[id^='group-cb-']");
                if (gcb.length > 0) {
                    gcb.off("change").prop("checked", true).change(jQuery.proxy(this.groupVisibilityHandler, this));
                }
            } else {
                /* Additionally uncheck the group checkbox for this panel */
                var gcb = jqp.first().find("input[id^='group-cb-']");
                if (gcb.length > 0) {
                    gcb.off("change").prop("checked", false).change(jQuery.proxy(this.groupVisibilityHandler, this));
                }
            }    
            var badge = jqp.first().find("span.checked-indicator-badge");
            if (badge.length > 0) {
                badge.html('<span class="fa fa-eye">&nbsp;</span>' + cbx.length + ' / ' + cbs.length);
                if (cbx.length == 0) {
                    badge.removeClass("show").addClass("hidden");
                } else {
                    badge.removeClass("hidden").addClass("show");
                }
            }
        }
    }, this));
};

/**
 * Translate style definition object to OL style
 * @param {object} styleDef
 * @param {string} labelField
 * @param {float} labelRotation (in radians)
 * @returns {Array[ol.style]}
 */
magic.classes.LayerTree.prototype.getVectorStyle = function(styleDef, labelField, labelRotation) {
    return(function(feature, resolution) {
        var returnedStyles = [];
        /* Determine feature type */
        var geomType = magic.modules.GeoUtils.getGeometryType(feature.getGeometry());
        var defaultFill =  {color: "rgba(255, 0, 0, 0.6)"};
        var defaultStroke = {color: "rgba(255, 0, 0, 1.0)", width: 1};   
        var fill = null, stroke = null, graphic = null, text = null;
        if (styleDef) {
            if (typeof styleDef == "string") {
                styleDef = JSON.parse(styleDef);
            }
            if (!jQuery.isEmptyObject(styleDef.predefined) && styleDef.predefined) {
                /* Canned vector style */
                return(jQuery.proxy(magic.modules.VectorStyles[styleDef.predefined](), feature)());
            } else {
                /* Unpack symbology */
                if (styleDef.fill) {
                    fill = new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec(styleDef.fill.color, styleDef.fill.opacity)
                    });
                } else {
                    fill = jQuery.extend({}, defaultFill);
                }
                if (styleDef.stroke) {
                    var lineStyle = styleDef.stroke.linestyle == "dashed" ? [3, 3] : (styleDef.stroke.linestyle == "dotted" ? [1, 1] : undefined);
                    stroke = new ol.style.Stroke({
                        color: magic.modules.Common.rgbToDec(styleDef.stroke.color, styleDef.stroke.opacity),
                        lineDash: lineStyle,
                        width: styleDef.stroke.width || 1
                    });
                } else {
                    stroke = jQuery.extend({}, defaultStroke);
                }
                if (styleDef.graphic) {
                    if (styleDef.graphic.marker == "circle") {
                        graphic = new ol.style.Circle({
                            radius: styleDef.graphic.radius || 5,
                            fill: fill,
                            stroke: stroke
                        });
                    } else if (styleDef.graphic.marker == "star") {
                        var r1 = styleDef.graphic.radius || 7;
                        var r2 = (r1 < 7 ? 2 : r1-5);
                        graphic = new ol.style.RegularShape({
                            radius1: r1,
                            radius2: r2,
                            points: 5,
                            fill: fill,
                            stroke: stroke
                        });
                    } else {
                        var points;
                        switch(styleDef.graphic.marker) {
                            case "triangle": points = 3; break;
                            case "pentagon": points = 5; break;
                            case "hexagon": points = 6; break;
                            default: points = 4; break;                                    
                        }
                        graphic = new ol.style.RegularShape({
                            radius: styleDef.graphic.radius || 5,
                            points: points,
                            fill: fill,
                            stroke: stroke
                        });
                    }
                } else {
                    graphic = new ol.style.Circle({
                        radius: 5, 
                        fill: fill,
                        stroke: stroke
                    });
                }
                text = undefined;
                if (labelField) {
                    /* Transparent text, made opaque on mouseover */
                    var textColor = magic.modules.Common.rgbToDec(styleDef.stroke.color, 0.0)
                    text = new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 10,
                        text: feature.get(labelField) + "",
                        textAlign: "left",
                        fill: new ol.style.Fill({
                            color: textColor
                        }),
                        rotation: labelRotation,
                        stroke: new ol.style.Stroke({
                            color: "rgba(255, 255, 255, 0.0)",
                            width: 1
                        })
                    });                
                }         
            }
        } else {
            /* Default style */
            fill = jQuery.extend({}, defaultFill);
            stroke = jQuery.extend({}, defaultStroke);
            graphic =  new ol.style.Circle({
                radius: 5, 
                fill: fill,
                stroke: stroke
            });
            text = undefined;            
        }
        switch (geomType) {
            case "polygon":
                returnedStyles.push(new ol.style.Style({
                    fill: fill,
                    stroke: stroke,
                    text: text
                }));
                break;
            case "line":
                returnedStyles.push(new ol.style.Style({
                    stroke: stroke,
                    text: text
                }));
                break;
            case "collection":
                var geoms = feature.getGeometry().getGeometries();
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.GeoUtils.getGeometryType(geoms[i]);
                    if (gtype == "point") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            image: graphic,                    
                            text: text
                        }));
                    /* Originally for AAD demonstrator - they export tracks which are monotonically increasing in size and look a real mess rendered */
                    } /*else if (gtype == "line") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            stroke: stroke,
                            text: text
                        }));
                    } else if (gtype == "polygon") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            fill: fill,
                            stroke: stroke,
                            text: text
                        }));
                    }*/
                }
                break;
            default: 
                returnedStyles.push(new ol.style.Style({
                    image: graphic,                    
                    text: text
                }));
                break;                   
        }
        return(returnedStyles);
    });
};

/**
 * Do a longhand find of an ol layer by feature name
 * @param {String} fname
 * @returns {ol.Layer}
 */
magic.classes.LayerTree.prototype.getLayerByFeatureName = function(fname) {
    var targetLayer = null;
    jQuery.each(this.nodeLayerTranslation, jQuery.proxy(function(uuid, layer) {
        var md = layer.get("metadata");
        if (md && md.source && md.source.feature_name ) {
            targetLayer = layer;
            return(false);
        }
        return(true);
    }, this));
    return(targetLayer);
};

/**
 * Typeahead handler for layer search
 * @return {Function}
 */
magic.classes.LayerTree.prototype.layerMatcher = function() {
    var nlData = [];
    jQuery.each(this.nodeLayerTranslation, function(nodeId, layer) {
        nlData.push({"id": nodeId, "layer": layer.get("name")});
    });
    nlData.sort(function(a, b) {
        return(a.layer.localeCompare(b.layer));
    });
    return(function(query, callback) {
        var matches = [];
        var re = new RegExp(query, "i");
        jQuery.each(nlData, function(itemno, item) {
            if (re.test(item.layer)) {
                matches.push(item.layer);
            }
        });
        callback(matches);
    });
};

/**
 * Get layer attribute from the user data payload
 * @param {String} layerId
 * @param {String} attrName
 * @param {Number|Boolean} defVal
 * @return {string}
 */
magic.classes.LayerTree.prototype.userLayerAttribute = function(layerId, attrName, defVal) {
    var attrVal = null;
    if (this.userdata != null && "layers" in this.userdata && layerId in this.userdata.layers) {        
        attrVal = this.userdata.layers[layerId][attrName];
    } else {
        attrVal = defVal;
    }
    return(attrVal);
};

/**
 * Get layer group expanded state from user data payload
 * @param {String} groupId
 * @param {boolean} defVal
 * @return {boolean}
 */
magic.classes.LayerTree.prototype.userGroupExpanded = function(groupId, defVal) {
    var attrVal = false;
    if (this.userdata != null && "groups" in this.userdata && groupId in this.userdata.groups) {        
        attrVal = this.userdata.groups[groupId];
    } else {
        attrVal = defVal;
    }
    return(attrVal);
};

/**
 * Chrome-specific hack to avoid random disappearing elements in layer tree - added 2017-10-26 by David
 * The problem is cured by turning off hardware acceleration in Chrome, so is a bug somewhere in that area
 * this hack is left in to work around the worst symptoms of it for those with HA turned on
 * Commented out 2017-11-16 - not thought to be a common problem
 */
magic.classes.LayerTree.prototype.chromeRefreshWorkaround = function() {
//    if (navigator.appVersion.toLowerCase().indexOf("chrome") >= 0) {
//        console.log("Chrome refresh workaround - test periodically if this is still needed!");
//        /* Force a refresh via tiny resize and back */
//        var lt = jQuery("#" + this.target);
//        var ltw = parseInt(lt.css("width").replace("px", ""));
//        lt.css("width", (ltw+1) + "px");
//        lt.css("width", ltw + "px");
//    }
};
 
/* Layer options context menu */

magic.classes.LayerTreeOptionsMenu = function(options) {    
    
    /* API properties */
    this.nodeid = options.nodeid;
    this.layer = options.layer;

    /* Internal properties */
    this.time_dependent_mosaics = {};
    
    /* Markup */
    jQuery("#layer-opts-dm-" + this.nodeid).html(
        '<li>' + 
            '<a href="Javascript:void(0)" id="ztl-' + this.nodeid + '">Zoom to layer extent</a>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="sty-' + this.nodeid + '">Apply alternate style</a>' +
            '<div class="panel panel-default hidden" style="margin-bottom:0px" id="wrapper-sty-' + this.nodeid + '">' + 
                '<div class="panel-body" style="padding:5px">' + 
                    '<form class="form-inline">' + 
                        '<div class="form-group form-group-sm" style="margin-bottom:0px">' + 
                            '<select class="form-control" id="sty-alts-' + this.nodeid +'"></select>' + 
                        '</div>' + 
                    '</form>' + 
                '</div>' + 
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ftr-' + this.nodeid + '">Filter by attribute</a>' +
            '<div class="panel panel-default hidden" style="margin-bottom:0px" id="wrapper-ftr-' + this.nodeid + '">' +  
                '<div class="panel-body" style="padding:5px">' +
                '</div>' + 
            '</div>' + 
        '</li>' +         
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.nodeid + '">Change layer transparency</a>' + 
            '<div class="panel panel-default hidden" style="margin-bottom:0px" id="wrapper-opc-' + this.nodeid + '">' + 
                '<div class="panel-body" style="padding:5px">' +
                    '<input id="opc-slider-' + this.nodeid + '" data-slider-id="opc-slider-' + this.nodeid + '" ' + 
                        'data-slider-min="0" data-slider-max="1" data-slider-step="0.1" data-slider-value="1">' + 
                    '</input>' + 
                '</div>' +                
            '</div>' + 
        '</li>'
    );        
    if (this.layer) {
        /* Add handlers */
        var ztlMenuLink = jQuery("#ztl-" + this.nodeid);
        var styMenuLink = jQuery("#sty-" + this.nodeid);
        var ftrMenuLink = jQuery("#ftr-" + this.nodeid);

        /* Zoom to layer extent */        
        if (this.canZoomToExtent()) {
            /* Layer is visible on the map, and this is not an OSM layer */            
            ztlMenuLink.off("click").on("click", jQuery.proxy(this.zoomToExtent, this));        
        } else {
            /* Layer invisible (or OSM), so option is unavailable */
            ztlMenuLink.parent().addClass("disabled");
            ztlMenuLink.off("click").on("click", function() {return(false);});
        }
        
        /* Apply an alternate style */
        if (this.canApplyAlternateStyles()) {
            /* Layer is visible on the map, and this is a non-OSM WMS layer */        
            styMenuLink.off("click").on("click", jQuery.proxy(function(evt) {
                evt.stopPropagation();
                /* Allow clicking on the inputs without the dropdown going away */
                jQuery(evt.currentTarget).next("div").find("form").click(function(evt2) {evt2.stopPropagation()});
                this.applyAlternateStyle();
            }, this));
        } else {
            /* Layer invisible (or OSM/non-WMS), so option is unavailable */
            styMenuLink.parent().addClass("disabled");
            styMenuLink.off("click").on("click", function() {return(false);});
        }
        
        /* Filter layer */
        if (this.canFilter()) {
            ftrMenuLink.off("click").on("click", jQuery.proxy(function(evt) {
                evt.stopPropagation();
                var wrapper = jQuery("#wrapper-ftr-" + this.nodeid);
                if (wrapper.hasClass("hidden")) {
                    wrapper.removeClass("hidden");
                    new magic.classes.LayerFilter({               
                        target: wrapper.find("div.panel-body"),
                        nodeid: this.nodeid,
                        layer: this.layer
                    });
                } else {
                    wrapper.addClass("hidden");
                }
            }, this));
        } else {
            /* Hide filter link for layer where it isn't possible */
            ftrMenuLink.parent().addClass("disabled"); 
            ftrMenuLink.off("click").on("click", function() {return(false);});
        }                                
        
        /* Transparency control */
        this.addOpacitySliderHandler();        
    }
};

/**
 * Opacity property slider initialiser
 */
magic.classes.LayerTreeOptionsMenu.prototype.addOpacitySliderHandler = function() {
    var sliderLink = jQuery("#opc-" + this.nodeid);
    if (this.layer.getVisible()) {
        /* Add the handlers */        
        sliderLink.off("click").on("click", jQuery.proxy(function(evt) {
            evt.stopPropagation();
            var wrapper = jQuery("#wrapper-opc-" + this.nodeid);
            if (wrapper.hasClass("hidden")) {
                /* Show the slider and add handlers */
                wrapper.removeClass("hidden");
                jQuery("#opc-slider-" + this.nodeid).slider({
                    min: 0.0,
                    max: 1.0,
                    step: 0.1,
                    value: this.layer.getOpacity()
                }).off("slide").on("slide", jQuery.proxy(function(evt) {
                    this.layer.setOpacity(evt.value);                    
                }, this));
            } else {
                jQuery("#opc-slider-" + this.nodeid).slider("destroy");
                wrapper.addClass("hidden");
            }                        
        }, this));
    } else {
        /* Disable the link */
        sliderLink.parent().addClass("disabled"); 
        sliderLink.off("click").on("click", function() {return(false);});
    }
};

/**
 * Zoom to WMS feature bounding box
 * @param {object} caps
 * @param {string} featureName
 */
magic.classes.LayerTreeOptionsMenu.prototype.zoomToWmsExtent = function(caps, featureName) {   
    var bbox = null;
    if (caps != null && caps[featureName]) {
        var md = caps[featureName];
        if (jQuery.isArray(md["BoundingBox"]) && md["BoundingBox"].length > 0) {
            jQuery.each(md["BoundingBox"], function(idx, bb) {
                if (bb.crs == magic.runtime.map.getView().getProjection().getCode()) {
                    bbox = bb.extent;
                    return(false);
                }
            });
            if (bbox == null) {
                if (jQuery.isArray(md["EX_GeographicBoundingBox"]) && md["EX_GeographicBoundingBox"].length == 4) {
                    /* Get bounding box by means of WGS84 one */
                    bbox = magic.modules.GeoUtils.extentFromWgs84Extent(md["EX_GeographicBoundingBox"]);
                    if (bbox.length == 0) {
                        bbox = magic.runtime.map.getView().getProjection().getExtent();
                    }
                } else {
                    bbox = magic.runtime.map.getView().getProjection().getExtent();
                }
            }
        } else if (jQuery.isArray(md["EX_GeographicBoundingBox"]) && md["EX_GeographicBoundingBox"].length == 4) {
            bbox = magic.modules.GeoUtils.extentFromWgs84Extent(md["EX_GeographicBoundingBox"]);
        } else {
            bbox = magic.runtime.map.getView().getProjection().getExtent();
        }
    } else {
        bbox = magic.runtime.map.getView().getProjection().getExtent();
    }
    magic.runtime.map.getView().fit(bbox, magic.runtime.map.getSize());
};

/**
 * Zoom to a layer extent in the map SRS
 */
magic.classes.LayerTreeOptionsMenu.prototype.zoomToExtent = function() {
    var md = this.layer.get("metadata");
    if (md) {
        if (md.source && md.source.wms_source) {
            /* WMS layer extent needs to come from GetCapabilities */
            var wmsUrl = md.source.wms_source;
            magic.modules.Common.getCapabilities(wmsUrl, jQuery.proxy(this.zoomToWmsExtent, this), md.source.feature_name);            
        } else {
            /* Vector layers have an extent enquiry method */
            var extent = magic.runtime.map.getView().getProjection().getExtent();
            if (jQuery.isFunction(this.layer.getSource().getExtent)) {                
                extent = this.layer.getSource().getExtent();
            } else {
                /* Check a further level of source wrapping for ImageVector layers */
                if (jQuery.isFunction(this.layer.getSource().getSource) && jQuery.isFunction(this.layer.getSource().getSource().getExtent)) {
                    extent = this.layer.getSource().getSource().getExtent();
                } 
            }
            magic.runtime.map.getView().fit(extent, magic.runtime.map.getSize());
        }
    } else {
        /* Default to projection extent */
        magic.runtime.map.getView().fit(magic.runtime.map.getView().getProjection().getExtent(), magic.runtime.map.getSize());
    }   
};

/**
 * Extract and offer a list of alternate styles for a layer
 */
magic.classes.LayerTreeOptionsMenu.prototype.applyAlternateStyle = function() {
    var choices = jQuery("#sty-alts-" + this.nodeid);
    var wrapper = jQuery("#wrapper-sty-" + this.nodeid);
    if (wrapper.hasClass("hidden")) {
        wrapper.removeClass("hidden");
        var feature = null, restEndpoint = null;
        try {
            var md = this.layer.get("metadata");
            feature = md.source.feature_name;
            restEndpoint = magic.modules.Endpoints.getEndpointBy("url", md.source.wms_source);            
        } catch(e) {}
        if (feature != null) {
            var restStyles = magic.config.paths.baseurl + "/gs/styles/" + feature;
            if (restEndpoint != null) {
                restStyles = restStyles + "/" + restEndpoint.id;
            }
            jQuery.ajax({
                url: restStyles, 
                method: "GET",
                dataType: "json",
                contentType: "application/json"
            }).done(jQuery.proxy(function(data) {
                if (data.styles && typeof data.styles == "object" && jQuery.isArray(data.styles.style)) {
                    if (data.styles.style.length > 1) {
                        magic.modules.Common.populateSelect(choices, data.styles.style, "name", "name", "", true);
                        choices.change(jQuery.proxy(function(evt) {
                            this.layer.getSource().updateParams(jQuery.extend({}, 
                                this.layer.getSource().getParams(), 
                                {"STYLES": choices.val()}
                            ));
                        }, this));
                    } else {
                        magic.modules.Common.populateSelect(choices, [{"name": "Default only"}], "name", "name", false);
                    }
                } else {
                    magic.modules.Common.populateSelect(choices, [{"name": "Default only"}], "name", "name", false);
                }                                       
            }, this)).fail(jQuery.proxy(function(xhr) {
                magic.modules.Common.populateSelect(choices, [{"name": "Default only"}], "name", "name", false);                
            }, this));
        }
    } else {
        wrapper.addClass("hidden");
    }        
};

/**
 * Determine if zoom to layer extent is possible (ok for all visible non-OSM layers)
 * @return {Boolean}
 */
magic.classes.LayerTreeOptionsMenu.prototype.canZoomToExtent = function() {
    var md = this.layer.get("metadata");
    return(this.layer.getVisible() && !(md && md.source && md.source.wms_source == "osm"));
};

/**
 * Determine if applying an alternate style is possible (ok for all visible non-OSM WMS layers)
 * @return {Boolean}
 */
magic.classes.LayerTreeOptionsMenu.prototype.canApplyAlternateStyles = function() {
    var md = this.layer.get("metadata");
    return(this.layer.getVisible() && md && md.source && md.source.wms_source && md.source.wms_source != "osm");
};

/**
 * Determine if filtering a layer by attribute is possible (ok for all visible layers specifically tagged as filterable in metadata)
 * @return {Boolean}
 */
magic.classes.LayerTreeOptionsMenu.prototype.canFilter = function() {
    var md = this.layer.get("metadata");
    return(this.layer.getVisible() && md && md.is_filterable === true && jQuery.isArray(md.attribute_map));
};

/**
 * Determine if viewing a layer time series is possible (ok for all visible layers specifically tagged as time-dependent in metadata)
 * @return {Boolean}
 */
magic.classes.LayerTreeOptionsMenu.prototype.canViewTimeSeries = function() {
    var md = this.layer.get("metadata");
    return(this.layer.getVisible() && md && md.source && md.source.is_time_dependent === true);
};

/* Mosaic time series player definition */

magic.classes.MosaicTimeSeriesPlayer = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = jQuery("#" + options.target);
    
    this.container = options.container;
    
    this.layer = options.layer;
    
    /* Cached granule repo */
    this.cache = options.cache;
    
    /* Internal */
    this.imagePointer = -1;
    
    /* Image granules */
    this.granules = null;    
    
    /* Movie interval handle */
    this.movie = null; 
    
    this.template =
        '<div class="popover popover-auto-width movieplayer-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' +
            '<div class="popover-content movieplayer-popover-content" style="padding-top: 0px"></div>' +
        '</div>';
    
    this.content =        
        '<form id="mplayer-form-' + this.nodeid + '">' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<button class="btn btn-primary btn-sm fa fa-fast-backward mosaic-player" type="button" role="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="First image in series" disabled></button>' + 
                '<button class="btn btn-primary btn-sm fa fa-step-backward mosaic-player" type="button" role="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Previous image in series" disabled></button>' + 
                '<button class="btn btn-primary btn-sm fa fa-play mosaic-player" type="button" role="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Play movie of mosaic images" disabled></button>' +
                '<button class="btn btn-primary btn-sm fa fa-step-forward mosaic-player" type="button" role="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Next image in series" disabled></button>' + 
                '<button class="btn btn-primary btn-sm fa fa-fast-forward mosaic-player" type="button" role="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Most recent image in series" disabled></button>' +
            '</div>' +
            '<div class="form-group form-group-sm">' +
                '<label class="col-sm-4 control-label" for="mplayer-refresh-rate-' + this.nodeid + '">Refresh</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="mplayer-refresh-rate-' + this.nodeid + '" class="form-control" ' +
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Frame refresh rate in seconds">' + 
                        '<option value="2000" selected>every 4 sec</option>' + 
                        '<option value="4000">every 6 sec</option>' +
                        '<option value="6000">every 8 sec</option>' +
                        '<option value="8000">every 10 sec</option>' +
                        '<option value="10000">every 20 sec</option>' +
                    '</select>' +                            
                '</div>' + 
            '</div>' + 
            '<div class="col-sm-12" style="margin-top: 5px; margin-bottom: 10px">Data from : <span id="granule-date-' + this.nodeid + '"></span></div>' + 
        '</form>';
    this.target.popover({
        template: this.template,
        title: '<span><strong>Play time series movie</strong><button type="button" class="close">&times;</button></span>',
        container: this.container,
        html: true,
        content: this.content
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        /* Get the GeoJSON for the mosaic time series (assumed on the local server - TODO widen this to any server with REST and appropriate credentials) */
        var params = this.layer.getSource().getParams();
        var featureType = params["LAYERS"];
        if (featureType) {
            if (this.cache[this.nodeid]) {
                /* Use session cached granule data */
                this.loadGranules(this.cache[this.nodeid]);
            } else {
                /* Fetch the granule data - could be slow and costly for big datasets */
                var restEndpoint = magic.modules.Endpoints.getEndpointBy("url", this.layer.get("metadata").source.wms_source);
                var restGranules = magic.config.paths.baseurl + "/gs/granules/" + featureType;
                if (restEndpoint != null) {
                    restGranules = restGranules + "/" + restEndpoint.id;
                }
                jQuery.getJSON(restGranules, jQuery.proxy(function(data) {
                    this.loadGranules(data);
                    this.cache[this.nodeid] = data;
                }, this));
            }
        }
        /* Set button and refresh rate handlers */               
        var btns = jQuery("#mplayer-form-" + this.nodeid).find("button");
        jQuery(btns[0]).off("click").on("click", {pointer: "0"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[1]).off("click").on("click", {pointer: "-"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[2]).off("click").on("click", jQuery.proxy(this.changeMovieState, this));
        jQuery(btns[3]).off("click").on("click",{pointer: "+"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[4]).off("click").on("click",{pointer: "1"}, jQuery.proxy(this.showImage, this));
        jQuery("#mplayer-refresh-rate-" + this.nodeid).off("change").on("change", jQuery.proxy(function(evt) {        
            var playBtn = jQuery(btns[2]);
            if (playBtn.hasClass("fa-pause")) {
                /* Movie is playing => stop it, so user can restart movie with new rate */
                playBtn.trigger("click");
            }
        }, this)); 
        /* Close button */
        jQuery(".movieplayer-popover").find("button.close").click(jQuery.proxy(function () {
            this.stopMovie();
            this.deactivate();
        }, this));        
    }, this))
    .on("hidden.bs.popover", jQuery.proxy(function() {
        this.stopMovie();        
    }, this));        
    
};

magic.classes.MosaicTimeSeriesPlayer.prototype.activate = function(cb) {    
    this.target.popover("show");
};

magic.classes.MosaicTimeSeriesPlayer.prototype.deactivate = function(cb) {    
    this.target.popover("hide");
};

/**
 * Load granule data into the mosaic player
 * @param {Object} data
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.loadGranules = function(data) {
    var feats = data.features;
    if (jQuery.isArray(feats) && feats.length > 0) {
        feats.sort(function(a, b) {
            var datea = a.properties.chart_date;
            var dateb = b.properties.chart_date;
            /* Compensate for brain dead Date parsing in MSIE which can't cope with e.g. '+0000' at the end - sigh */         
            var cda = Date.parse(datea.replace(/\+\d+$/, ""));
            var cdb = Date.parse(dateb.replace(/\+\d+$/, ""));
            return(cda - cdb);
        });
        this.granules = feats;
        this.showInitialState();
    } else {
        magic.modules.Common.showAlertModal("No time series granule data received", "warning");       
    }
};

/**
 * Show the initial state of the player
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.showInitialState = function() {
    this.stopMovie();
    if (this.imagePointer < 0) {
        this.imagePointer = this.granules.length - 1;
    }
    this.syncButtons();
    this.updateLayer();
    jQuery("#granule-date-" + this.nodeid).html(this.getTime());    
};

/**
 * Show the required image from the mosaic
 * @param {jQuery.Event} evt
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.showImage = function(evt) {
    evt.stopPropagation();
    if (evt.data.pointer == "0") {
        this.imagePointer = 0;
    } else if (evt.data.pointer == "-") {
        if (this.imagePointer > 0) {
            this.imagePointer--;
        }
    } else if (evt.data.pointer == "+") {
        if (this.imagePointer < this.granules.length - 1) {
            this.imagePointer++;
        }
    } else {
        this.imagePointer = this.granules.length - 1;
    }
    this.syncButtons();
    this.updateLayer();
};

/**
 * Alter movie play status
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.changeMovieState = function(evt) {
    evt.stopPropagation();
    if (this.movie == null) {
        this.startMovie();
    } else {
        this.stopMovie();
    }    
    this.syncButtons();    
};

/**
 * Start a time series movie
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.startMovie = function() {
    var playBtn = jQuery(jQuery("#mplayer-form-" + this.nodeid).find("button")[2]);
    if (playBtn.hasClass("fa-play")) {
        /* Set play button to pause */
        playBtn.removeClass("fa-play").addClass("fa-pause");
        playBtn.attr("data-original-title", "Pause movie").tooltip("fixTitle");
    }
    this.movie = setInterval(jQuery.proxy(function() {
        if (this.imagePointer < this.granules.length - 1) {
            this.imagePointer++;
            this.updateLayer();
        } else {
            playBtn.removeClass("fa-pause").addClass("fa-play");
            playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
            clearInterval(this.movie);
            this.movie = null;
        }
        this.syncButtons();
    }, this), jQuery("#mplayer-refresh-rate-" + this.nodeid).val());
};

/**
 * Stop a time series movie
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.stopMovie = function() {
    var playBtn = jQuery(jQuery("#mplayer-form-" + this.nodeid).find("button")[2]);
    if (playBtn.hasClass("fa-pause")) {
        playBtn.removeClass("fa-pause").addClass("fa-play");
        playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
    }
    if (this.movie != null) {
        clearInterval(this.movie);
        this.movie = null;
    }
};

/**
 * Set the button disabled statuses according to the current image pointer
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.syncButtons = function() {
    var btns = jQuery("#mplayer-form-" + this.nodeid).find("button");   
    jQuery(btns[0]).prop("disabled", this.imagePointer == 0);
    jQuery(btns[1]).prop("disabled", this.imagePointer == 0);
    jQuery(btns[2]).prop("disabled", this.imagePointer == this.granules.length - 1);
    jQuery(btns[3]).prop("disabled", this.imagePointer == this.granules.length - 1);
    jQuery(btns[4]).prop("disabled", this.imagePointer == this.granules.length - 1);    
};

/**
 * Update the layer parameters
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.updateLayer = function() {
    /* Actually show the image in the layer */
    var t = this.getTime();
    jQuery("#granule-date-" + this.nodeid).html(t.replace(".000Z", ""));
    this.layer.getSource().updateParams(jQuery.extend({}, 
        this.layer.getSource().getParams(), 
        {"time": t}
    ));
};


/**
 * Get the date of the current granule
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.getTime = function() {
    var t = this.granules[this.imagePointer].properties.chart_date;
    /* See http://suite.opengeo.org/4.1/geoserver/tutorials/imagemosaic_timeseries/imagemosaic_time-elevationseries.html for description of the pernickety date format */
    // TODO - need to think about datasets with a sub-day granularity - David 2017-06-13
    //t = t.replace("+0000", "Z");
    return(t.substring(0, 10));
};
