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
        element: $("#" + this.popupId)[0],
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
 * @param {Array} featureData array of feature attribute objects, with __geomtype set to the geometry type (in lower case)
 */
magic.classes.FeaturePopup.prototype.show = function(showAt, featureData) {    
    $("#" + this.popupId).popover("destroy");
    var showPopup = featureData.length > 0;    
    if (showPopup) {        
        this.popup.setPosition(showAt);
        $.extend(this, {
            featurePointer: 0,
            initPager: false,
            featureCollection: featureData
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
        var name = feat.layer.get("name");
        content += '<span class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">' + magic.modules.Common.ellipsis(name, 20) +
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
    //var basicSchema = ["name", "lon", "lat", "date"];
    $.each(this.featureCollection, $.proxy(function(i, feat) {
        content += '<div class="feature-popup-table-cont ' + (i > 0 ? "hidden" : "show") + '">';
        content += '<table class="table table-striped table-condensed feature-popup-table">';
        var nDisplayed = 0, nAttrs = -1;
        if (feat.layer) {            
            var md = feat.layer.get("metadata");
            if (md && $.isArray(md.attribute_map)) {
                nAttrs = md.attribute_map.length;
                $.each(md.attribute_map, $.proxy(function(idx, attrdata) {
                    if (attrdata.displayed === true) {
                        var nameStr = attrdata.alias || attrdata.name;
                        if (attrdata.type == "xsd:string") {
                            content += '<tr><td>' + nameStr + '</td><td>' + magic.modules.Common.linkify(feat[attrdata.name]) + '</td></tr>';
                        } else {                            
                            content += '<tr><td>' + nameStr + '</td><td align="right">' + this.attributeValue(attrdata.name, feat[attrdata.name]) + '</td></tr>';
                        }
                        nDisplayed++;
                    }
                }, this));
            }
        }
        if (nAttrs == -1 || nAttrs > nDisplayed) {
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
            var attrdata = this.featureCollection[fidx];
            var keys = [];
            for (var k in attrdata) {
                if (k != "layer" && k != "bbox" && k != "geometry") {
                    keys.push(k);
                }
            }
            var content = '<table class="table table-striped table-condensed feature-popup-table">';
            $.each(keys.sort(), function(idx, key) {
                var value = attrdata[key];
                if (value) {
                    if ($.isNumeric(value)) {                        
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                    } else if (key.toLowerCase().indexOf("geom") == -1) {                        
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td>' + magic.modules.Common.linkify(value) + '</td></tr>';
                    }
                }
            });
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
 * Apply preferences (using some guesswork) to an attribute whose key and value are supplied
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
magic.classes.FeaturePopup.prototype.attributeValue = function(key, value) {
    var newValue = "";
    if (value != null && value != "" && value != undefined) {
        if (magic.modules.Common.isLongitudeLike(key)) {
            newValue = magic.runtime.preferences.applyPref("coordinates", parseFloat(value).toFixed(4), "lon");
        } else if (magic.modules.Common.isLatitudeLike(key)) {
            newValue = magic.runtime.preferences.applyPref("coordinates", parseFloat(value).toFixed(4), "lat");
        } else if (magic.modules.Common.isDatetimeLike(key)) {
            newValue = magic.runtime.preferences.applyPref("dates", value);
        } else {
            newValue = value;
        }
    }
    return(newValue);
};
