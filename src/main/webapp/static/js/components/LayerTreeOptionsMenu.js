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
            '<div class="layer-options-dd-entry hidden" id="wrapper-sty-' + this.nodeid + '">' + 
                '<form class="form-inline">' + 
                    '<div class="form-group form-group-sm col-sm-12">' + 
                        '<select class="form-control" id="sty-alts-' + this.nodeid +'"></select>' + 
                    '</div>' + 
                '</form>' + 
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ftr-' + this.nodeid + '">Filter by attribute</a>' +
            '<div class="hidden" id="wrapper-ftr-' + this.nodeid + '">' +                                    
            '</div>' + 
        '</li>' +         
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.nodeid + '">Change layer transparency</a>' + 
            '<div class="layer-options-dd-entry layer-options-slider hidden" id="wrapper-opc-' + this.nodeid + '">' + 
                '<input id="opc-slider-' + this.nodeid + '" data-slider-id="opc-slider-' + this.nodeid + '" data-slider-min="0" data-slider-max="1" data-slider-step="0.1" data-slider-value="1">' + 
            '</div>' + 
        '</li>'
    );        
    if (this.layer) {
        /* Add handlers */

        /* Zoom to layer extent */        
        if (this.canZoomToExtent()) {
            /* Layer is visible on the map, and this is not an OSM layer */        
            jQuery("#ztl-" + this.nodeid).off("click").on("click", jQuery.proxy(this.zoomToExtent, this));        
        } else {
            /* Layer invisible (or OSM), so option is unavailable */
            jQuery("#ztl-" + this.nodeid).parent().addClass("disabled");
        }
        
        /* Apply an alternate style */
        if (this.canApplyAlternateStyles()) {
            /* Layer is visible on the map, and this is a non-OSM WMS layer */        
            jQuery("#sty-" + this.nodeid).off("click").on("click", jQuery.proxy(function(evt) {
                evt.stopPropagation();
                /* Allow clicking on the inputs without the dropdown going away */
                jQuery(evt.currentTarget).next("div").find("form").click(function(evt2) {evt2.stopPropagation()});
                this.applyAlternateStyle();
            }, this));
        } else {
            /* Layer invisible (or OSM/non-WMS), so option is unavailable */
            jQuery("#sty-" + this.nodeid).parent().addClass("disabled");
        }
        
        /* Filter layer */
        if (this.canFilter()) {
            jQuery("#ftr-" + this.nodeid).off("click").on("click", jQuery.proxy(function(evt) {
                evt.stopPropagation();
                new magic.classes.LayerFilter({               
                    target: jQuery(evt.currentTarget).next("div"),
                    nodeid: this.nodeid,
                    layer: this.layer
                });                       
            }, this));
        } else {
            /* Hide filter link for layer where it isn't possible */
            jQuery("#ftr-" + this.nodeid).parent().addClass("disabled");        
        }                                
        
        /* Transparency control */
        this.addWebglSliderHandler("opc", 0.0, 1.0, 0.1);        
    }
};

/**
 * WebGL property slider initialiser
 * @param {string} idbase (opc|brt|ctr for opacity, brightness and contrast respectively)
 * @param {float} minVal slider minimum value
 * @param {float} maxVal slider maximum value
 * @param {float} step 
 */
magic.classes.LayerTreeOptionsMenu.prototype.addWebglSliderHandler = function(idbase, minVal, maxVal, step) { 
    if (this.layer.getVisible()) {
        /* Add the handlers */
        jQuery("#" + idbase + "-" + this.nodeid).off("click").on("click", jQuery.proxy(function(evt) {
            evt.stopPropagation();
            var wrapper = jQuery(evt.currentTarget).next("div");
            if (wrapper.hasClass("hidden")) {
                wrapper.removeClass("hidden").addClass("show");
                var layer = this.layer;
                var startValue = 0.0;
                switch(idbase) {
                    case "opc": startValue = layer.getOpacity(); break;
                    /* These have been removed from OL3 - may be other means to do them */
                    case "brt": startValue = layer.getBrightness(); break;
                    case "ctr": startValue = layer.getContrast(); break;        
                }
                jQuery("#" + idbase + "-slider-" + this.nodeid).slider({
                    value: startValue,
                    formatter: function(value) {
                        return("Value: " + value);
                    }
                }).on("slide", function(evt) {
                    var newVal = evt.value;
                    switch(idbase) {
                        case "opc": layer.setOpacity(newVal); break;
                         /* These have been removed from OL3 - may be other means to do them */
                        case "brt": layer.setBrightness(newVal); break;
                        case "ctr": layer.setContrast(newVal); break;        
                    }
                });
            } else {
                wrapper.removeClass("show").addClass("hidden");
            }                        
        }, this));
    } else {
        jQuery("#" + idbase + "-" + this.nodeid).parent().addClass("disabled");
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
                if (bb.crs == magic.runtime.viewdata.projection.getCode()) {
                    bbox = bb.extent;
                    return(false);
                }
            });
            if (bbox == null && jQuery.isArray(md["EX_GeographicBoundingBox"]) && md["EX_GeographicBoundingBox"].length == 4) {
                /* Get bounding box by means of WGS84 one */
                bbox = magic.modules.GeoUtils.extentFromWgs84Extent(md["EX_GeographicBoundingBox"]);
            } else {
                bbox = magic.runtime.viewdata.proj_extent;
            }
        } else if (jQuery.isArray(md["EX_GeographicBoundingBox"]) && md["EX_GeographicBoundingBox"].length == 4) {
            bbox = magic.modules.GeoUtils.extentFromWgs84Extent(md["EX_GeographicBoundingBox"]);
        } else {
            bbox = magic.runtime.viewdata.proj_extent;
        }
    } else {
        bbox = magic.runtime.viewdata.proj_extent;
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
            var extent = magic.runtime.viewdata.proj_extent;
            if (jQuery.isFunction(this.layer.getSource().getExtent)) {                
                extent = this.layer.getSource().getExtent();
            } else {
                /* Check a further level of source wrapping for ImageVector layers */
                if (Query.isFunction(this.layer.getSource().getSource) && jQuery.isFunction(this.layer.getSource().getSource().getExtent)) {
                    extent = this.layer.getSource().getSource().getExtent();
                } 
            }
            magic.runtime.map.getView().fit(extent, magic.runtime.map.getSize());
        }
    } else {
        /* Default to projection extent */
        magic.runtime.map.getView().fit(magic.runtime.viewdata.proj_extent, magic.runtime.map.getSize());
    }   
};

/**
 * Extract and offer a list of alternate styles for a layer
 */
magic.classes.LayerTreeOptionsMenu.prototype.applyAlternateStyle = function() {
    var choices = jQuery("#sty-alts-" + this.nodeid);
    var wrapperDiv = jQuery("#wrapper-sty-" + this.nodeid);
    wrapperDiv.toggleClass("hidden");
    var feature = null;
    try {
        feature = this.layer.get("metadata").source.feature_name;
    } catch(e) {}
    if (feature != null) {
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/gs/styles/" + feature, 
            method: "GET",
            dataType: "json",
            contentType: "application/json"
        }).done(jQuery.proxy(function(data) {
            if (data.styles && typeof data.styles == "object" && jQuery.isArray(data.styles.style)) {
                if (data.styles.style.length > 0) {
                    magic.modules.Common.populateSelect(choices, data.styles.style, "name", "name", false);
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
