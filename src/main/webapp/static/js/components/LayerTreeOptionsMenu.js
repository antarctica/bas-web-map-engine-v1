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
                    '<input id="opc-slider-' + this.nodeid + '" type="range" min="0.0" max="1.0" step="0.1">' + 
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
    var sliderInput = jQuery("#opc-slider-" + this.nodeid);
    if (this.layer.getVisible()) {
        /* Add the handlers */
        sliderLink.off("click").on("click", jQuery.proxy(function(evt) {
            evt.stopPropagation();
            sliderInput.off("click input change").on("click input change", jQuery.proxy(function(evt2) {
                evt2.stopPropagation();
                var wrapper = jQuery("#wrapper-opc-" + this.nodeid);
                if (wrapper.hasClass("hidden")) {
                    /* Show the slider range input and add handler */
                    wrapper.removeClass("hidden");
                    this.layer.setOpacity(evt.currentTarget.value); 
                } else {
                    wrapper.addClass("hidden");
                }                        
            }, this));
        }, this);
    } else {
        /* Disable the link */
        sliderLink.parent().addClass("disabled"); 
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
