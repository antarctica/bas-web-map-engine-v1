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
            '<a href="Javascript:void(0)" id="ftr-' + this.nodeid + '">Filter by attribute</a>' +
            '<div class="hidden" id="wrapper-ftr-' + this.nodeid + '">' +                                    
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.nodeid + '">Change layer transparency</a>' + 
            '<div class="layer-options-dd-entry layer-options-slider hidden" id="wrapper-opc-' + this.nodeid + '">' + 
                '<input id="opc-slider-' + this.nodeid + '" data-slider-id="opc-slider-' + this.nodeid + '" data-slider-min="0" data-slider-max="1" data-slider-step="0.1" data-slider-value="1">' + 
            '</div>' + 
        '</li>' +
        '<li>' + 
            '<a href="Javascript:void(0)" id="tss-' + this.nodeid + '">View time series</a>' +
            '<div class="layer-options-dd-entry hidden" id="wrapper-tss-' + this.nodeid + '">' +                                    
            '</div>' + 
        '</li>'
/* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */        
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="brt-' + this.nodeid + '">Change layer brightness</a>' + 
//            '<div class="layer-options-slider hidden" id="wrapper-brt-' + this.nodeid + '" style="">' + 
//                '<input id="brt-slider-' + this.nodeid + '" data-slider-id="brt-slider-' + this.nodeid + '" data-slider-min="-1" data-slider-max="1" data-slider-step="0.2" data-slider-value="0">' + 
//            '</div>' + 
//        '</li>' + 
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="ctr-' + this.nodeid + '">Change layer contrast</a>' + 
//            '<div class="layer-options-slider hidden" id="wrapper-ctr-' + this.nodeid + '" style="">' + 
//                '<input id="ctr-slider-' + this.nodeid + '" data-slider-id="ctr-slider-' + this.nodeid + '" data-slider-min="0" data-slider-max="10" data-slider-step="1" data-slider-value="5">' + 
//            '</div>' +
//        '</li>'  
    );        
    if (this.layer) {
        /* Add handlers */

        /* Zoom to layer extent */
        var md = this.layer.get("metadata");
        var layerVis = this.layer.getVisible();
        if (layerVis && !(md && md.source && md.source.wms_source == "osm")) {
            /* Layer is visible on the map, and this is not an OSM layer */        
            jQuery("#ztl-" + this.nodeid).off("click").on("click", jQuery.proxy(this.zoomToExtent, this));        
        } else {
            /* Layer invisible (or OSM), so option is unavailable */
            jQuery("#ztl-" + this.nodeid).parent().addClass("disabled");
        }
        
        /* Filter layer */
        if (layerVis && md && md.is_filterable === true && jQuery.isArray(md.attribute_map)) {
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
        
        /* Time series movie player, if layer supports the time dimension */
        if (layerVis && md && md.source && md.source.is_time_dependent === true) {
            jQuery(".tooltip").attr("container", "body");
            jQuery("#tss-" + this.nodeid).off("click").on("click", jQuery.proxy(function(evt) {
                evt.stopPropagation();
                var layerName = this.layer.get("name");
                if (!this.time_dependent_mosaics[layerName]) {
                    /* Allocate time series player */
                    this.time_dependent_mosaics[layerName] = new magic.classes.MosaicTimeSeriesPlayer({               
                        target: jQuery(evt.currentTarget).next("div"),
                        nodeid: this.nodeid,
                        layer: this.layer
                    }); 
                } else {
                    this.time_dependent_mosaics[layerName].showCurrentState();
                }
            }, this));
        } else {
            /* Hide time series link for layer where it isn't possible */
            jQuery("#tss-" + this.nodeid).parent().addClass("disabled");        
        }
        
        /* Transparency control */
        this.addWebglSliderHandler("opc", 0.0, 1.0, 0.1);
        
        /* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */
        /* Brightness control */
        //this.addWebglSliderHandler("brt", -1.0, 1.0, 0.2);
        /* Contrast control */
        //this.addWebglSliderHandler("ctr", 0.0, 10.0, 1.0);
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
                        case "brt": layer.setBrightness(newVal); break;
                        case "ctr": layer.setContrast(newVal); break;        
                    }
                }).relayout();
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
 * Extract a layer extent in the map SRS
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
                if (this.layer.getSource().getSource() && jQuery.isFunction(this.layer.getSource().getSource().getExtent)) {
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
