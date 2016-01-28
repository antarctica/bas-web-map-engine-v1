/* Static low-level common methods module */

magic.modules.Common = function () {

    return({
        /* Possible WMS endpoints for each projection */
        wms_endpoints: {
            "EPSG:3031": [
                {
                    "name": "Antarctic Digital Database",
                    "wms": "https://maps.bas.ac.uk/antarctic/wms",
                    "coast": ["add:antarctic_coastline", "add:sub_antarctic_coastline"],
                    "graticule": "add:antarctic_graticule"
                },
                {
                    "name": "Operations GIS",
                    "wms": "http://rolgis.nerc-bas.ac.uk:8080/geoserver/wms"
                },
                {
                    "name": "CCAMLR GIS",
                    "wms": "https://gis.ccamlr.org/geoserver/wms"
                },
                {
                    "name": "Antarctic Peninsula Information Portal",
                    "wms": "http://bslbatgis.nerc-bas.ac.uk:8080/geoserver/wms"
                },
                {
                    "name": "Polar View",
                    "wms": "http://geos.polarview.aq/geoserver/wms"
                }
            ],
            "EPSG:3995": [
                {
                    "name": "NERC Arctic Office Map",
                    "wms": "https://maps.bas.ac.uk/arctic/wms",
                    "coast": ["arctic:arctic_coastline"],
                    "graticule": "arctic:arctic_graticule"
                }
            ],
            "EPSG:3762": [
                {
                    "name": "South Georgia GIS",
                    "wms": "https://maps.bas.ac.uk/southgeorgia/wms",
                    "coast": ["sggis:sg_coastline"],
                    "graticule": "ol"
                }
            ],
            "EPSG:3857": [
                {
                    "name": "OpenStreetMap",
                    "wms": "osm",
                    "coast": "osm"
                }
            ]
        },
        proxy_endpoints: {
            "https://gis.ccamlr.org/geoserver/wms": true,
            "https://gis.ccamlr.org/geoserver/wfs": true
        },
        /* Default local Geoserver endpoint */
        default_geoserver_wms: {
            "name": "Local Geoserver WMS",
            "wms": magic.config.paths.baseurl + "/geoserver/wms"
        },               
        /* Taken from OL2 Util.js */
        inches_per_unit: {
            "inches": 1.0,
            "ft": 12.0,
            "miles": 63360.0,
            "m": 39.37,
            "km": 39370,
            "dd": 4374754,
            "yd": 36,
            "nm": 1852 * 39.37
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
            opacity = opacity || 1.0;
            rgb = eval("0x" + rgb.replace(/#/, ""));
            var components = {
                r: (rgb & 0xff0000) >> 16, 
                g: (rgb & 0x00ff00) >> 8, 
                b: (rgb & 0x0000ff)
            };
            return("rgba(" + components.r + "," + components.g + "," + components.b + "," + opacity + ")");
        },
        /**
         * Create a set of buttons suitable for giving feedback on a POST/PUT/DELETE operation
         * @param {type} btnBaseId
         * @param {type} msg
         * @returns {String}
         */
        buttonFeedbackSet: function(btnBaseId, msg) {
            return(
                '<button id="' + btnBaseId + '-go" class="btn btn-primary" type="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="' + msg + '">' + 
                    '<span class="fa fa-floppy-o"></span>' + 
                '</button>' +
                '<button id="' + btnBaseId + '-fb-ok" class="btn btn-success" style="display:none" type="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Ok">' + 
                    '<span class="glyphicon glyphicon-ok post-ok"></span>' + 
                '</button>' +
                '<button id="' + btnBaseId + '-fb-error" class="btn btn-danger" style="display:none" type="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Error">' + 
                    '<span class="glyphicon glyphicon-remove post-error"></span>' + 
                '</button>'
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
            var btnGo = $("#" + btnBaseId + "-go"),
                btnFbOk = $("#" + btnBaseId + "-fb-ok"),
                btnFbError = $("#" + btnBaseId + "-fb-error"),
                effect;
            btnGo.hide();
            /* See https://api.jquery.com/promise/ for queuing up animations like this */
            if (success) {                            
                btnFbOk.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function(){return(btnFbOk.fadeIn(300).delay(1200).fadeOut(300))};                                                      
            } else {
                btnFbError.attr("data-original-title", msg).tooltip("fixTitle");
                effect = function(){return(btnFbError.fadeIn(600).delay(1200).fadeOut(600))};
            }
            $.when(effect()).done(function() {
                btnGo.show();                            
            });                        
        },
        flagInputError: function(inputEl) {
             var fg = inputEl.closest("div.form-group");
             if (fg) {
                 fg.removeClass("has-success").addClass("has-error");
             }
        },
        /**
         * Put together a suitable style for an uploaded layer, distinct from the rest
         * @param {string} geomType
         * @param {int} paletteEntry
         * @param {string} label
         * @returns {Array<ol.Style>}
         */
        fetchStyle: function(geomType, paletteEntry, label) {
            var style = magic.modules.Common.default_styles[geomType];
            if (style) {
                var styling = {};
                if (geomType.toLowerCase().indexOf("point") >= 0) {
                    /* Create image */
                    styling.image = this.getPointImageStyle(paletteEntry)                 
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
                    })                    
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
         * Retrieve a WMS GetCapabilities document for the URL, calling the given callback with the supplied arguments
         * @param {string} url
         * @param {Function} callback
         * @param {string} typename
         */
        getCapabilities: function(url, callback, typename) {
            if (magic.runtime.capabilities[url]) {
                callback(magic.runtime.capabilities[url], typename);
            } else {
                var parser = new ol.format.WMSCapabilities();
                var wmsUrl = url + "?request=GetCapabilities";
                if (magic.modules.Common.proxy_endpoints[url]) {
                    wmsUrl = magic.config.paths.baseurl + "/proxy?url=" + wmsUrl;
                }
                var jqXhr = $.get(wmsUrl, $.proxy(function(response) {
                    try {
                        var capsJson = $.parseJSON(JSON.stringify(parser.read(response)));
                        if (capsJson) {
                            var ftypes = null;
                            if ("Capability" in capsJson && "Layer" in capsJson.Capability && "Layer" in capsJson.Capability.Layer && $.isArray(capsJson.Capability.Layer.Layer)) {
                                var layers = capsJson.Capability.Layer.Layer;
                                ftypes = {};
                                $.each(layers, function(idx, layer) {
                                    ftypes[layer.Name] = layer;
                                });
                            }
                            if (ftypes != null) {
                                magic.runtime.capabilities[url] = ftypes;
                                callback(magic.runtime.capabilities[url], typename);
                            } else {
                                callback(null, typename);
                            }                            
                        } else {
                            callback(null, typename);
                        }
                    } catch(e) {
                        alert(e);
                    }
                }, this)).fail(function() {
                    callback(null, typename);
                });
            }
        },
        /**
         * Get a suitable mid-latitudes coast layer (OSM, except if in a low bandwidth location, in which case default to Natural Earth)
         * @returns {ol.layer}
         */
        midLatitudeCoastLayer: function() {
            var lowBandwidthHosts = [
                "rothera.nerc-bas.ac.uk",
                "halley.nerc-bas.ac.uk",
                "jcr.nerc-bas.ac.uk",
                "es.nerc-bas.ac.uk"
            ];
            var hostname = window.location.hostname;
            var isLowBandwidth = false;
            $.each(lowBandwidthHosts, function(idx, lbh) {
                if (hostname.indexOf(lbh) != -1) {
                    isLowBandwidth = true;
                    return(false);
                }
                return(true);
            });
            if (isLowBandwidth) {
                /* Low bandwidth location - fallback to locally-hosted Natural Earth data */
                var wmsSource = new ol.source.TileWMS({
                    url: this.wms,
                    params: {
                        "LAYERS": "natearth_world_10m_land", 
                        "CRS": "EPSG:4326",
                        "SRS": "EPSG:4326",
                        "VERSION": "1.3.0",
                        "WORKSPACE": this.ws
                    },            
                    projection: "EPSG:4326"
                });                     
                return(new ol.layer.Tile({source: wmsSource}));        
            } else {
                /* Any other higher bandwidth location - use OSM */
                return(new ol.layer.Tile({source: new ol.source.OSM()}));
            }
        },
        /**
         * Populate a select list from given array of option objects
         * @param {Element} select
         * @param {Array} optArr
         * @param {string} valAttr
         * @param {string} txtAttr
         * @param {string} defval
         */
        populateSelect: function(select, optArr, valAttr, txtAttr, defval) {
            var selOpt = null;
            select.append($("<option>", {value: "", text: "Please select"}));
            $.each(optArr, function(idx, optObj) {
                var opt = $("<option>", {value: optObj[valAttr]});
                opt.text(optObj[txtAttr]);            
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
         * Convert date value to format
         * @param {string} value
         * @param {string} format (dmy|ymd)
         * @returns {string} the date formatted accordingly
         */
        dateFormat: function (value, format) {
            var formattedValue = value;
            var dateParts = value.substring(0, 10).split(/[^\d]/);
            var dateRest = value.substring(10);
            if (dateParts.length == 3) {
                /* Determine current format */
                if ((dateParts[0].length == 4 && format == "dmy") || (dateParts[0].length == 2 && format == "ymd")) {
                    /* Currently ymd => dmy, or currently dmy => ymd */
                    formattedValue = dateParts[2] + "-" + dateParts[1] + "-" + dateParts[0];
                    if (dateRest != "") {
                        formattedValue += dateRest;
                    }
                }
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
         * Replace urls in given value by links
         * Courtesy of http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
         * @param {type} value
         * @returns {String}
         */
        linkify: function (value) {

            if (!value) {
                return("");
            }
            
            if (typeof value == "string") {

                /* http://, https://, ftp:// */
                var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

                /* www. sans http:// or https:// */
                var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

                /* Email addresses */
                var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;

                return(value
                        .replace(urlPattern, '<a href="$&" title="$&" target="_blank">[external resource]</a>')
                        .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
                        .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>')
                        );
            } else {
                return(value);
            }
        },
        /**
         * Break long string every 'size' characters with a <br />
         * @param {string} str
         * @param {int} size
         * @returns {string}
         */
        chunk: function (str, size) {
            if (typeof size == "undefined") {
                size = 2;
            }
            return(str.match(RegExp('.{1,' + size + '}', 'g')).join("<br />"));
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
         * @param {string} from units e.g. km for lengths, km2 for areas etc
         * @param {string} to units e.g. miles for lengths, miles2 for areas etc
         * @returns {String}
         */
        unitConverter: function (value, from, to) {
            var converted = 0.0, fromUnits = from, toUnits = to, order = 1;
            if (from.indexOf("2") == from.length - 1) {
                fromUnits = from.substring(0, from.length - 1);
                order = 2;
            }
            if (to.indexOf("2") == to.length - 1) {
                toUnits = to.substring(0, to.length - 1);
            }
            if (fromUnits in this.inches_per_unit && toUnits in this.inches_per_unit && (order == 1 || order == 2)) {
                converted = value * Math.pow(this.inches_per_unit[fromUnits] / this.inches_per_unit[toUnits], order);
                converted = converted.toFixed(3) + " " + toUnits + (order == 2 ? "<sup>2</sup>" : "");
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
                var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
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