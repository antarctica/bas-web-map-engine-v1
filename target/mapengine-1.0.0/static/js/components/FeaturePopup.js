/* Construct markup for popup content on a list of features */

magic.classes.FeaturePopup = function(options) {
    
    /* API */
    
    /* List of features to render attributes of */
    this.featureCollection = options.features || [];    
    /* id of DOM element to bind popup to */
    this.popupId = options.popupId || "popup";
    /* Name prefix (will strip this from the beginning of popup titles) */
    this.namePrefix = options.namePrefix || "";
    
    /* Internal */  
    
    /* Set to true when all pager handlers have been bound */
    this.initPager = false;
    /* Pointer to which feature in the list is being displayed */
    this.featurePointer = 0;
    
    if ($("#" + this.popupId).length == 0) {
        /* Popup div needs creating */
        $("#map-container").after(
            '<!-- Pop-up overlay -->' + 
            '<div id="' + this.popupId + '" class="ol-popup">' + 
                '<div id="popup-content"></div>' + 
            '</div>'
        );
    }    
    this.popup = new ol.Overlay({
        element: $("#" + this.popupId),
        positioning: "center-center"
    });
    magic.runtime.map.addOverlay(this.popup);
    
    /* Text continuation markup */
    if ($("#all-attributes-modal").length == 0) {
        $("#map-container").after(
            '<!-- Full attribute set modal -->' + 
            '<div class="modal fade" id="all-attributes-modal" tabindex="-1" role="dialog" aria-labelledby="all-attributes-title" aria-hidden="true">' + 
                '<div class="modal-dialog">' + 
                    '<div class="modal-content">' + 
                        '<div class="modal-header">' + 
                            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + 
                            '<h4 class="modal-title" id="all-attributes-title">Full attribute set</h4>' + 
                        '</div>' + 
                        '<div id="all-attributes-content" class="modal-body">' + 
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
    $(magic.runtime.map.getViewport()).on("mousemove", function(e) {
        var pixel = magic.runtime.map.getEventPixel(e.originalEvent);
        var hit = magic.runtime.map.forEachFeatureAtPixel(pixel, function() {
            return(true);
        });
        $("#" + magic.runtime.map.getTarget()).css("cursor", hit ? "pointer" : "");        
    });
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
            placement: function() {
                var placement = "bottom",
                    popoverLocation = magic.runtime.map.getPixelFromCoordinate(showAt),
                    mapHeight = $("#map").outerHeight(),
                    mtop = popoverLocation[1] - 400,
                    mbtm = popoverLocation[1] + 400;
                if (mbtm > mapHeight) {
                    /* Bottom-placed popover off bottom of map - consider top placement */
                    placement = mtop > 0 ? "top" : "bottom";
                }            
                return(placement);
            },        
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
        if (this.gfi) {
            /* GetFeatureInfo */
            content += '<span class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">' + this.layerNameFromFid(feat.id) +
                '<button type="button" style="float:right" class="close">&times;</button></span>'; 
        } else {
            /* Vector feature(s) */
            if (feat.getProperties()["__gaz_name"]) {
                /* Geosearch */
                content += '<span class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">Geosearch location' +
                    '<button type="button" style="float:right" class="close">&times;</button></span>'; 
            }
        }                      
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
            content += '<tr><td colspan="2" align="center"><button type="button" id="full-attr-set-' + i + '" class="btn btn-primary btn-xs">Full attribute set</button></td></tr>';
        }
        content += '</table>';
        content += '</div>';
    }, this));
    
    if (this.featureCollection.length > 1) {
        /* Output a pager in initial configuration i.e. viewing first feature */               
        content += 
            '<div id="popup-pager">' + 
                '<div class="btn-group btn-group-xs" role="group">' + 
                    '<button id="popup-pager-first" type="button" class="btn btn-default disabled">' + 
                        '<span class="fa fa-angle-double-left" data-toggle="tooltip" data-placement="left" title="First feature"></span>' + 
                    '</button>' + 
                    '<button id="popup-pager-prev" type="button" class="btn btn-default disabled">' + 
                        '<span class="fa fa-angle-left" data-toggle="tooltip" data-placement="top" title="Previous feature"></span>' + 
                    '</button>' + 
                    '<div id="popup-pager-xofy">Showing 1 of ' + this.featureCollection.length + '</div>' + 
                    '<button id="popup-pager-next" type="button" class="btn btn-default">' + 
                        '<span class="fa fa-angle-right" data-toggle="tooltip" data-placement="top" title="Next feature"></span>' + 
                    '</button>' + 
                    '<button id="popup-pager-last" type="button" class="btn btn-default">' + 
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
        $("#popup-pager-xofy").html("Showing " + (this.featurePointer+1) + " of " + this.featureCollection.length);
    }
    /* Show the relevant title from the markup */
    $("span.feature-popup-title-cont").each($.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            $(elt).toggleClass("hidden");
        } else {
            $(elt).toggleClass("hidden");
        }
    }, this));
    /* Show the relevant div from the combined markup */
    $("div.feature-popup-table-cont").each($.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            $(elt).toggleClass("hidden");
        } else {
            $(elt).toggleClass("hidden");
        }
    }, this));
    /* Add full attribute set modal handler */
    $("div.feature-popup-table-cont").find("button").off("click").on("click", $.proxy(function(evt) {
        var btnId = evt.currentTarget.id;
        var fidx = parseInt(btnId.substring(btnId.lastIndexOf("-")+1));
        if (!isNaN(fidx) && fidx < this.featureCollection.length) {
            /* Got an index into the current feature collection */
            var data = this.gfi ? this.featureCollection[fidx]["properties"] : this.featureCollection[fidx].getProperties();
            var content = '<table class="table table-striped table-condensed feature-popup-table">';
            $.each(data, $.proxy(function(key, value) {
                if (key != "gid") {
                    if ($.isNumeric(value)) {
                        if (Math.floor(value) != value) {
                            /* Floating point */
                            value = value.toFixed(4);
                        }
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                    }
                    else if (key != "geometry" && key != "bbox" && key.indexOf("__") == -1 && value != null) {
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td>' + value + '</td></tr>';
                    }    
                }
            }, this));
            content += '</table>';
            $("#all-attributes-content").html(content);
            $("#all-attributes-modal").modal("show");
        }
    }, this));
    if (this.featureCollection.length > 1) {
        /* Do we need to add handlers for pager buttons? */
        if (!this.initPager) {
            /* Add handlers */
            $("#popup-pager div button").off("click").on("click", $.proxy(function(evt) {                
                switch(evt.currentTarget.id) {
                    case "popup-pager-first":
                        this.featurePointer = 0;                       
                        break;
                    case "popup-pager-prev":
                        if (this.featurePointer > 0) {
                            this.featurePointer--;                           
                        }                                                
                        break;
                    case "popup-pager-next":
                        if (this.featurePointer < this.featureCollection.length-1) {
                            this.featurePointer++;                            
                        }
                        break;
                    case "popup-pager-last":
                        this.featurePointer = this.featureCollection.length-1;
                        break;
                    default:
                        break;
                }
                if (this.featurePointer == 0) {
                    $("#popup-pager-first").addClass("disabled").prop("disabled", true);
                    $("#popup-pager-prev").addClass("disabled").prop("disabled", true);
                    $("#popup-pager-next").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-last").removeClass("disabled").prop("disabled", false);
                } else if (this.featurePointer == this.featureCollection.length-1) {
                    $("#popup-pager-first").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-prev").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-next").addClass("disabled").prop("disabled", true);
                    $("#popup-pager-last").addClass("disabled").prop("disabled", true);
                } else {
                    $("#popup-pager-first").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-prev").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-next").removeClass("disabled").prop("disabled", false);
                    $("#popup-pager-last").removeClass("disabled").prop("disabled", false);
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
    if (magic.modules.Common.objectLength(attrs) > 10 && geomType.toLowerCase() == "point") {
        /* Try and extract a core set for points with a large number of attributes which would be hard to display in a single popup */
        coreAttrs = {
            name: null,
            lon: null,
            lat: null
        };
        $.each(attrs, $.proxy(function(key, value) {
            key = key.toLowerCase();
            if (coreAttrs.name == null && (key.indexOf("name") == 0 || magic.modules.Common.endsWith(key.toLowerCase(), "name"))) {
                coreAttrs.name = value;
            } else if (coreAttrs.lon == null && (key == "lon" || key == "longitude" || key == "x")) {
                if ($.isNumeric(value)) {
                    coreAttrs.lon = parseFloat(value).toFixed(4);
                }
            } else if (coreAttrs.lat == null && (key == "lat" || key == "latitude" || key == "y")) {
                if ($.isNumeric(value)) {
                    coreAttrs.lat = parseFloat(value).toFixed(4);
                }
            }
        }, this));
        /* Fill in any remaining null values with defaults or best guesses */
        if (coreAttrs.name == null) {
            coreAttrs.name = "Feature";
        }
        if (coreAttrs.lon == null || coreAttrs.lat == null) {
            if (this.gfi) {
                /* Project the geometry coordinates */
                var coordWgs84 = ol.proj.transform(feat.geometry.coordinates, magic.runtime.projection, "EPSG:4326");
                coreAttrs.lon = coordWgs84[0].toFixed(4);
                coreAttrs.lat = coordWgs84[1].toFixed(4);
            } else {
                coreAttrs.lon = coreAttrs.lat = 0.0;
            }
        }
        reduced = true;
    } else {
        $.each(attrs, $.proxy(function(key, value) {
            key = key.toLowerCase();
            if (key != "gid" && key != "id" && key != "bbox") {
                coreAttrs[key] = value;
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
 */
magic.classes.FeaturePopup.prototype.layerNameFromFid = function(fid) {
    var layerName = "unknown";
    if (fid) {
        layerName = fid;
        var dotAt = layerName.indexOf(".");
        if (dotAt != -1) {
            layerName = layerName.substring(0, dotAt);
        }        
        layerName = layerName.replace(/_/g, " ");
        if (this.namePrefix != "") {
            var re = new RegExp("^" + this.namePrefix + "\\s+");
            layerName = layerName.replace(re, "");
        }
        layerName = magic.modules.Common.initCap(layerName);
    }
    return(layerName);
};
