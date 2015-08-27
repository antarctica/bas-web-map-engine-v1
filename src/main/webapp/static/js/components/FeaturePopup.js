/* Construct markup for popup content on a list of features */

magic.classes.FeaturePopup = function(options) {
    
    /* API */
    
    /* List of features to render attributes of */
    this.featureCollection = options.features || [];    
    /* id of DOM element to bind popup to */
    this.popupId = options.popupId || "popup";
    /* Name prefix (will strip this from the beginning of popup titles) */
    this.namePrefix = options.namePrefix || "";
    /* The map the popup will appear on (defaults to main map) */
    this.map = options.map || magic.runtime.map;
    /* The map target div (defaults to map-container) */
    this.mapdiv = options.mapdiv || "map-container";
    /* Continuation modal id (defaults to all-attributes-modal) */
    this.continuation = "all-attributes-modal";
    
    /* Internal */      
    
    /* Set to true when all pager handlers have been bound */
    this.initPager = false;
    /* Pointer to which feature in the list is being displayed */
    this.featurePointer = 0;
    
    if ($("#" + this.popupId).length == 0) {
        /* Popup div needs creating */
        $("#" + this.mapdiv).after(
            '<!-- Pop-up overlay -->' + 
            '<div id="' + this.popupId + '" class="ol-popup">' + 
                '<div id="' + this.popupId + '-content"></div>' + 
            '</div>'
        );
    }    
    this.popup = new ol.Overlay({
        element: $("#" + this.popupId),
        positioning: "center-center"
    });
    this.map.addOverlay(this.popup);
    
    /* Text continuation markup (always done in main map as will never fit in an inset!) */
    if ($(this.continuation).length == 0) {
        $("#map-container").after(
            '<!-- Full attribute set modal -->' + 
            '<div class="modal fade" id="' + this.continuation + '" tabindex="-1" role="dialog" aria-labelledby="' + this.continuation + '-title" aria-hidden="true">' + 
                '<div class="modal-dialog">' + 
                    '<div class="modal-content">' + 
                        '<div class="modal-header">' + 
                            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + 
                            '<h4 class="modal-title" id="' + this.continuation + '-title">Full attribute set</h4>' + 
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
    
    /* Change mouse cursor when over a vector feature/overlay */
    $(this.map.getViewport()).on("mousemove", $.proxy(function(e) {
        var pixel = this.map.getEventPixel(e.originalEvent);
        var hit = this.map.forEachFeatureAtPixel(pixel, function() {
            return(true);
        });
        $("#" + this.map.getTarget()).css("cursor", hit ? "pointer" : "");        
    }, this));
};

/**
 * Show the popup at the given point with the feature data
 * @param {ol.coordinate} showAt
 * @param {Array|Object} featureData
 */
magic.classes.FeaturePopup.prototype.show = function(showAt, featureData) {    
    $("#" + this.popupId).popover("destroy");
    var showPopup = false, isGfi = false, collection = [];
    if ($.isPlainObject(featureData) && "features" in featureData) {
        /* Probably from GetFeatureInfo */
        isGfi = true;
        showPopup = true;
        collection = featureData.features;
    } else if ($.isArray(featureData) && featureData.length > 0) {
        /* Vectors */
        showPopup = true;
        collection = featureData;
    }    
    if (showPopup) {        
        this.popup.setPosition(showAt);
        var isGfi = "features" in featureData;
        $.extend(this, {
            featurePointer: 0,
            initPager: false,
            featureCollection: collection,
            gfi: isGfi
        });
        $("#" + this.popupId).popover({
            placement: $.proxy(function() {
                var placement = "bottom",
                    popoverLocation = this.map.getPixelFromCoordinate(showAt),
                    mapHeight = $("#map").outerHeight(),
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
            content: this.basicMarkup()  /* Basic feature attributes i.e. name, lon, lat */
        }).on("shown.bs.popover", $.proxy(function() {
            this.selectFeature();
            /* Close button */
            $("span.feature-popup-title-cont").find("button.close").click($.proxy(function() { 
                $("#" + this.popupId).popover("hide");
            }, this));
        }, this));
        $("#" + this.popupId).popover("show");
    }
};
/**
 * Hide (i.e. destroy) the popup
 */
magic.classes.FeaturePopup.prototype.hide = function() {
    $("#" + this.popupId).popover("destroy");
};

/**
 * Create title string
 * @return {string} title (including close button markup)
 */
magic.classes.FeaturePopup.prototype.title = function() {
    var content = "";
    $.each(this.featureCollection, $.proxy(function(i, feat) {
        content += '<span class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">' + this.getCaption(feat) +
                   '<button type="button" style="float:right" class="close">&times;</button></span>';      
    }, this));    
    return(content);
    
};

/**
 * Create basic (name, lon, lat) data markup for feature set
 * @return {string} description
 */
magic.classes.FeaturePopup.prototype.basicMarkup = function() {    
    var content = "";
    $.each(this.featureCollection, $.proxy(function(i, feat) {
        var cad = this.coreAttributeData(feat);
        content += '<div class="feature-popup-table-cont ' + (i > 0 ? "hidden" : "show") + '">';
        content += '<table class="table table-striped table-condensed feature-popup-table">';
        $.each(cad.attrs, $.proxy(function(key, value) {
            if (value) {
                if ($.isNumeric(value)) {
                    content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                } else {
                    content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td>' + value + '</td></tr>';
                }   
            }
        }, this));
        if (cad.reduced) {
            content += '<tr><td colspan="2" align="center"><button type="button" id="' + this.popupId + '-full-attr-set-' + i + '" class="btn btn-primary btn-xs">Full attribute set</button></td></tr>';
        }
        content += '</table>';
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
 * Display the attribute markup for the feature at the given index
 * @returns {undefined}
 */
magic.classes.FeaturePopup.prototype.selectFeature = function() {
    if (this.featureCollection.length > 1) {
        /* Update "showing x of y" message */
        $("#" + this.popupId + "-pager-xofy").html("Showing " + (this.featurePointer+1) + " of " + this.featureCollection.length);
    }
    /* Show the relevant title from the markup */
    $("span.feature-popup-title-cont").each($.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            $(elt).removeClass("hidden").addClass("show");
        } else {
            $(elt).removeClass("show").addClass("hidden");
        }
    }, this));
    /* Show the relevant div from the combined markup */
    $("div.feature-popup-table-cont").each($.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            $(elt).removeClass("hidden").addClass("show");
        } else {
            $(elt).removeClass("show").addClass("hidden");
        }
    }, this));
    /* Add full attribute set modal handler */
    $("div.feature-popup-table-cont").find("button").off("click").on("click", $.proxy(function(evt) {
        var btnId = evt.currentTarget.id;
        var fidx = parseInt(btnId.substring(btnId.lastIndexOf("-")+1));
        if (!isNaN(fidx) && fidx < this.featureCollection.length) {
            /* Got an index into the current feature collection */
            var data = this.gfi ? this.featureCollection[fidx]["properties"] : this.featureCollection[fidx].getProperties();
            var keys = [];
            for (var k in data) {
                keys.push(k);
            }
            var content = '<table class="table table-striped table-condensed feature-popup-table">';
            $.each(keys.sort(), $.proxy(function(idx, key) {
                var value = data[key];
                if (key != "gid") {
                    if ($.isNumeric(value)) {
                        if (Math.floor(value) != value) {
                            /* Floating point */
                            value = value.toFixed(4);
                        }
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                    }
                    else if (key.indexOf("geom") == -1 && key != "bbox" && key.indexOf("__") == -1 && value != null) {
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td>' + value + '</td></tr>';
                    }    
                }
            }, this));
            content += '</table>';
            $("#" + this.continuation + "-content").html(content);
            $("#" + this.continuation).modal("show");
        }
    }, this));
    if (this.featureCollection.length > 1) {
        /* Do we need to add handlers for pager buttons? */
        if (!this.initPager) {
            /* Add handlers */
            $("#" + this.popupId + "-pager div button").off("click").on("click", $.proxy(function(evt) {                
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
                    $("#" + this.popupId + "-pager-first").addClass("disabled").prop("disabled", true);
                    $("#" + this.popupId + "-pager-prev").addClass("disabled").prop("disabled", true);
                    $("#" + this.popupId + "-pager-next").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-last").removeClass("disabled").prop("disabled", false);
                } else if (this.featurePointer == this.featureCollection.length-1) {
                    $("#" + this.popupId + "-pager-first").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-prev").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-next").addClass("disabled").prop("disabled", true);
                    $("#" + this.popupId + "-pager-last").addClass("disabled").prop("disabled", true);
                } else {
                    $("#" + this.popupId + "-pager-first").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-prev").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-next").removeClass("disabled").prop("disabled", false);
                    $("#" + this.popupId + "-pager-last").removeClass("disabled").prop("disabled", false);
                }
                this.selectFeature();
                this.fixPopoverPosition();
            }, this));            
            this.initPager = true;
        }        
    }    
};

/**
 * Make sure the popover arrow is anchored to the location of the first feature in the list, and remains so anchored through dynamic content changes
 */
magic.classes.FeaturePopup.prototype.fixPopoverPosition = function() {
    var parentPopover = $("div.feature-popup-table-cont").parents("div.popover");
    if (parentPopover.hasClass("top")) {
        /* Redjustment potentially necessary */   
        parentPopover.css("top", -parentPopover.outerHeight() + "px");
    }
};

/**
 * Scan data object to isolate name, lon, lat values if possible
 * @param {Object} feat feature
 */
magic.classes.FeaturePopup.prototype.coreAttributeData = function(feat) {
    var coreAttrs = {}; 
    var reduced = false;
    var geomType = this.gfi ? feat.geometry.type : feat.getGeometry().getType();
    var attrs = this.gfi ? feat.properties : feat.getProperties();
    if (magic.modules.Common.objectLength(attrs) > 5 && geomType.toLowerCase() == "point") {
        /* Try and extract a core set for points with a large number of attributes which would be hard to display in a single popup */
        coreAttrs = {
            name: null,
            lon: null,
            lat: null,
            date: null
        };
        $.each(attrs, $.proxy(function(key, value) {
            if (coreAttrs.name == null && this.isNameLike(key)) {
                coreAttrs.name = value;
            } else if (coreAttrs.lon == null && this.isLongitudeLike(key)) {
                coreAttrs.lon = magic.runtime.preferences.applyPref("coordinates", $.isNumeric(value) ? parseFloat(value).toFixed(4) : value, "lon");
            } else if (coreAttrs.lat == null && this.isLatitudeLike(key)) {
                coreAttrs.lat = magic.runtime.preferences.applyPref("coordinates", $.isNumeric(value) ? parseFloat(value).toFixed(4) : value, "lat");
            } else if (coreAttrs.date == null && this.isDatetimeLike(key)) {
                coreAttrs.date = magic.runtime.preferences.applyPref("dates", value);
            }
        }, this));
        /* Fill in any remaining null values with defaults or best guesses */
        if (coreAttrs.name == null) {
            coreAttrs.name = "Feature";
        }
        if (coreAttrs.lon == null || coreAttrs.lat == null) {
            if (this.gfi) {
                /* Project the geometry coordinates */
                var coordWgs84 = ol.proj.transform(feat.geometry.coordinates, this.map.getView().getProjection(), "EPSG:4326");
                coreAttrs.lon = magic.runtime.preferences.applyPref("coordinates", coordWgs84[0].toFixed(4), "lon");
                coreAttrs.lat = magic.runtime.preferences.applyPref("coordinates", coordWgs84[1].toFixed(4), "lat");
            } else {
                var pclone = feat.getGeometry().clone();
                pclone.transform(this.map.getView().getProjection(), "EPSG:4326");
                coreAttrs.lon = magic.runtime.preferences.applyPref("coordinates", pclone.getFirstCoordinate().toFixed(4), "lon");
                coreAttrs.lat = magic.runtime.preferences.applyPref("coordinates", pclone.getLastCoordinate().toFixed(4), "lat");
            }
        }
        reduced = true;
    } else {
        $.each(attrs, $.proxy(function(key, value) {
            key = key.toLowerCase();
            if (key != "gid" && key != "id" && key != "bbox" && key.indexOf("geom") == -1) {
                if (this.isLongitudeLike(key)) {
                    coreAttrs[key] = magic.runtime.preferences.applyPref("coordinates", value, "lon");
                } else if (this.isLatitudeLike(key)) {
                    coreAttrs[key] = magic.runtime.preferences.applyPref("coordinates", value, "lat");
                } else if (this.isDatetimeLike(key)) {
                    coreAttrs[key] = magic.runtime.preferences.applyPref("dates", value);
                } else {
                    coreAttrs[key] = value;
                }
            }            
        }, this));
    }
    return({
        attrs: coreAttrs,
        reduced: reduced
    });
};

/**
 * Convert a feature id e.g. antarctic_facilities.23 to a layer name i.e. Antarctic facilities
 * @param {ol.Feature} feat
 */
magic.classes.FeaturePopup.prototype.getCaption = function(feat) {
    var caption = "Feature";
    var fid = feat.id;
    if (fid) {
        caption = fid;
        var dotAt = caption.indexOf(".");
        if (dotAt != -1) {
            caption = caption.substring(0, dotAt);
        }        
        caption = caption.replace(/_/g, " ");
        if (this.namePrefix != "") {
            var re = new RegExp("^" + this.namePrefix + "\\s+");
            caption = caption.replace(re, "");
        }
        caption = magic.modules.Common.initCap(caption);
    } else if (feat.getProperties()["__title"]) {
        caption = feat.getProperties()["__title"];
    }
    return(caption);
};

/**
 * Does the given key name look name-like?
 * @param {String} key
 * @returns {boolean}
 */
magic.classes.FeaturePopup.prototype.isNameLike = function(key) {
    key = key.toLowerCase();
    return(key.indexOf("name") == 0 || key.indexOf("callsign") == 0 ||  magic.modules.Common.endsWith(key.toLowerCase(), "name"));
};

/**
 * Does the given key name look like a longitude?
 * @param {String} key
 * @returns {boolean}
 */
magic.classes.FeaturePopup.prototype.isLongitudeLike = function(key) {
    key = key.toLowerCase();
    return(key == "lon" || key == "long" || key == "longitude" || key == "x");
};

/**
 * Does the given key name look like a latitude?
 * @param {String} key
 * @returns {boolean}
 */
magic.classes.FeaturePopup.prototype.isLatitudeLike = function(key) {
    key = key.toLowerCase();
    return(key == "lat" || key == "latitude" || key == "y");
};

/**
 * Does the given key name look like a date/time?
 * @param {String} key
 * @returns {boolean}
 */
magic.classes.FeaturePopup.prototype.isDatetimeLike = function(key) {
    key = key.toLowerCase();
    return(key.indexOf("date") == 0 || key.indexOf("time") == 0 || key.indexOf("utc") != -1);
};