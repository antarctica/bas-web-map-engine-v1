/* Construct markup for popup content on a list of features */

magic.classes.FeaturePopup = function(options) {
    
    /* API */
    
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
        content += '<span class="feature-popup-title-cont ' + (i > 0 ? "hidden" : "show") + '">' + feat["__title"] +
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
    var basicSchema = ["name", "lon", "lat", "date"];
    $.each(this.featureCollection, $.proxy(function(i, feat) {
        var attrdata = this.prepareAttributeData(feat);
        content += '<div class="feature-popup-table-cont ' + (i > 0 ? "hidden" : "show") + '">';
        content += '<table class="table table-striped table-condensed feature-popup-table">';
        var nDisplayed = 0;
        $.each(basicSchema, $.proxy(function(idx, elt) {
            var coreKey = attrdata.core[elt];
            if (coreKey) {
                nDisplayed++;
                var coreVal = attrdata.attrs[coreKey];
                if (coreVal) {
                    if ($.isNumeric(coreVal)) {
                        content += '<tr><td>' + magic.modules.Common.initCap(coreKey) + '</td><td align="right">' + coreVal + '</td></tr>';
                    } else {
                        content += '<tr><td>' + magic.modules.Common.initCap(coreKey) + '</td><td>' + magic.modules.Common.linkify(coreVal) + '</td></tr>';
                    }   
                }
            }
        }, this));
        var totalKeys = magic.modules.Common.objectLength(attrdata.attrs);
        if (totalKeys > nDisplayed) {
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
            var attrdata = this.prepareAttributeData(this.featureCollection[fidx]);
            var keys = [];
            for (var k in attrdata.attrs) {
                keys.push(k);
            }
            var content = '<table class="table table-striped table-condensed feature-popup-table">';
            $.each(keys.sort(), function(idx, key) {
                var value = attrdata.attrs[key];
                if (value) {
                    if ($.isNumeric(value)) {                        
                        content += '<tr><td>' + magic.modules.Common.initCap(key) + '</td><td align="right">' + value + '</td></tr>';
                    } else {                        
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
 * Scan data object to isolate name, lon, lat values if possible
 * @param {Object} attrs feature attributes
 */
magic.classes.FeaturePopup.prototype.prepareAttributeData = function(attrs) {
    var coreAttrs = {
        name: null,
        lon: null,
        lat: null,
        date: null
    }, fullAttrs = {}; 
    var geomType = attrs["__geomtype"];
    if (geomType && geomType != "unknown") {
        /* Sieve the attributes according to type, and cull unimportant ones */
        var sieve = {
            ints: [],
            floats: [],
            dates: [],
            strings: []
        };
        $.each(attrs, $.proxy(function(key, value) {
            if (!this.isCullable(key)) {
                if ($.isNumeric(value)) {
                    if (Math.floor(value) == value) {
                        sieve.ints.push(key);
                    } else {
                        sieve.floats.push(key);
                    }
                } else if (!isNaN(Date.parse(value))) {
                    sieve.dates.push(key);
                } else {
                    sieve.strings.push(key);
                }            
            }
        }, this));
        /* Now have a sieve of attributes sorted by type */
        $.each(sieve.ints, $.proxy(function(idx, key) {        
            fullAttrs[key] = parseInt(attrs[key]);               
        }, this));
        $.each(sieve.floats, $.proxy(function(idx, key) {
            if (geomType == "point" && magic.modules.Common.isLongitudeLike(key)) {
                fullAttrs[key] = magic.runtime.preferences.applyPref("coordinates", parseFloat(attrs[key]).toFixed(4), "lon");
                if (coreAttrs.lon == null) {
                    coreAttrs.lon = key;
                }
            } else if (geomType == "point" && magic.modules.Common.isLatitudeLike(key)) {
                fullAttrs[key] = magic.runtime.preferences.applyPref("coordinates", parseFloat(attrs[key]).toFixed(4), "lat");
                if (coreAttrs.lat == null) {
                    coreAttrs.lat = key;
                }
            } else {
                fullAttrs[key] = parseFloat(attrs[key]).toFixed(2);
            }       
        }, this));
        $.each(sieve.dates, $.proxy(function(idx, key) {
            fullAttrs[key] = magic.runtime.preferences.applyPref("dates", attrs[key]);
            if (magic.modules.Common.isDatetimeLike(key) && coreAttrs.date == null) {
                coreAttrs.date = key;
            }        
        }, this));
        $.each(sieve.strings, $.proxy(function(idx, key) {
            fullAttrs[key] = attrs[key];
            if (magic.modules.Common.isNameLike(key) && attrs[key] && new RegExp("^[A-Za-z0-9 -_]+$").test(attrs[key]) && coreAttrs.name == null) {
                coreAttrs.name = key;
            }        
        }, this));
        if (coreAttrs.name == null) {
            /* Name will be the first string value */
            coreAttrs.name = sieve.strings[0];
        }   
    }
    return({
        attrs: fullAttrs,   /* Processed key/value pairs */
        core: coreAttrs     /* Keys for the core attributes */
    });
};

/**
 * Is this an important attribute or one that can be ignored?
 * @param {string} attrKey
 * @returns {Boolean}
 */
magic.classes.FeaturePopup.prototype.isCullable = function(attrKey) {
    var cull = ["^id$", "^gid$", "^bbox$", "^geom.*$", "^__.*$", "^bounded.*$"];
    attrKey = attrKey.toLowerCase();
    for (var i = 0; i < cull.length; i++) {
        var patt = new RegExp(cull[i]);
        if (patt.test(attrKey)) {
            return(true);
        }
    }
    return(false);
};