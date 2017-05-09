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
        magic.runtime.map_container.after(
            '<!-- Pop-up overlay -->' + 
            '<div id="' + this.popupId + '" class="ol-popup">' + 
                '<div id="' + this.popupId + '-content"></div>' + 
            '</div>'
        );
    }    
    this.popup = new ol.Overlay({
        element: jQuery("#" + this.popupId)[0],
        positioning: "center-center"
    });
    this.map.addOverlay(this.popup);
    
    /* Text continuation markup (always done in main map as will never fit in an inset!) */
    if (jQuery(this.continuation).length == 0) {
        magic.runtime.map_container.after(
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
    jQuery(this.map.getViewport()).on("mousemove", jQuery.proxy(function(e) {
        var pixel = this.map.getEventPixel(e.originalEvent);
        var hit = this.map.forEachFeatureAtPixel(pixel, function() {
            return(true);
        });
        jQuery("#" + this.map.getTarget()).css("cursor", hit ? "pointer" : "");        
    }, this));
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
        jQuery("#" + this.popupId).popover({
            placement: jQuery.proxy(function() {
                var placement = "bottom",
                    popoverLocation = this.map.getPixelFromCoordinate(showAt),
                    mapHeight = magic.runtime.map_div.outerHeight(),
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
        }).on("shown.bs.popover", jQuery.proxy(function() {
            this.selectFeature();            
            /* Close button */
            jQuery("span.feature-popup-title-cont").find("button.close").click(jQuery.proxy(function() { 
                jQuery("#" + this.popupId).popover("hide");
            }, this));
        }, this));
        jQuery("#" + this.popupId).popover("show");
    }
};
/**
 * Hide (i.e. destroy) the popup
 */
magic.classes.FeaturePopup.prototype.hide = function() {
    jQuery("#" + this.popupId).popover("destroy");
};

/**
 * Create title string
 * @return {string} title (including close button markup)
 */
magic.classes.FeaturePopup.prototype.title = function() {
    var content = "";
    jQuery.each(this.featureCollection, jQuery.proxy(function(i, feat) {
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
    jQuery.each(this.featureCollection, jQuery.proxy(function(i, feat) {
        content += '<div class="feature-popup-table-cont ' + (i > 0 ? "hidden" : "show") + '">';
        content += '<table class="table table-striped table-condensed feature-popup-table">';
        var nDisplayed = 0, nAttrs = -1, isVectorFeat = false;
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
        if (nAttrs == -1 || nAttrs > nDisplayed || isVectorFeat) {
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
            if (feat[key] && !jQuery.isNumeric(feat[key])) {
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
    jQuery("span.feature-popup-title-cont").each(jQuery.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            jQuery(elt).removeClass("hidden").addClass("show");
        } else {
            jQuery(elt).removeClass("show").addClass("hidden");
        }
    }, this));
    /* Show the relevant div from the combined markup */
    jQuery("div.feature-popup-table-cont").each(jQuery.proxy(function(idx, elt) {
        if (idx == this.featurePointer) {
            jQuery(elt).removeClass("hidden").addClass("show");
        } else {
            jQuery(elt).removeClass("show").addClass("hidden");
        }
    }, this));
    /* Add long field popup extension handler */
    jQuery("div.feature-popup-table-cont").find("button.long-field-extension").each(function(i, b) {
        var divs = jQuery(b).children("div");
        if (divs.length > 0) {
            jQuery(b).popover({
                title: false,
                html: true,
                content: '<div style="width:200px">' + jQuery(divs[0]).html() + '</div>'
            });
        }
    });
    /* Add full attribute set modal handler */
    jQuery("div.feature-popup-table-cont").find("button[id^='" + this.popupId + "-full-attr-set-']").off("click").on("click", jQuery.proxy(function(evt) {
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
                    jQuery("#" + this.popupId + "-pager-first").addClass("disabled").prop("disabled", true);
                    jQuery("#" + this.popupId + "-pager-prev").addClass("disabled").prop("disabled", true);
                    jQuery("#" + this.popupId + "-pager-next").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-last").removeClass("disabled").prop("disabled", false);
                } else if (this.featurePointer == this.featureCollection.length-1) {
                    jQuery("#" + this.popupId + "-pager-first").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-prev").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-next").addClass("disabled").prop("disabled", true);
                    jQuery("#" + this.popupId + "-pager-last").addClass("disabled").prop("disabled", true);
                } else {
                    jQuery("#" + this.popupId + "-pager-first").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-prev").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-next").removeClass("disabled").prop("disabled", false);
                    jQuery("#" + this.popupId + "-pager-last").removeClass("disabled").prop("disabled", false);
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
    var parentPopover = jQuery("div.feature-popup-table-cont").parents("div.popover");
    if (parentPopover.hasClass("top")) {
        /* Redjustment potentially necessary */   
        parentPopover.css("top", -parentPopover.outerHeight() + "px");
    }
    /* Fix horizontal positioning where content width allowed to vary e.g. when images are loaded */
    var po = jQuery("div.feature-popup-table-cont").parents("div.popover");
    console.log(po.outerWidth());
    po.find("div.arrow").css("left", parseInt(100*116/po.innerWidth()) + "%");
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
            newValue = magic.runtime.preferences.applyPref("coordinates", value, "lon");
        } else if (magic.modules.Common.isLatitudeLike(key)) {
            if (!jQuery.isNumeric(value)) {
                value = value.replace(/&[^;]+;\s?/g, " ");  /* Tracker co-ordinates have HTML escapes in them - sigh */
            }
            newValue = magic.runtime.preferences.applyPref("coordinates", value, "lat");
        } else if (magic.modules.Common.isDatetimeLike(key)) {
            newValue = magic.runtime.preferences.applyPref("dates", value);
        } else {
            newValue = value;
        }
    }
    return(newValue);
};
