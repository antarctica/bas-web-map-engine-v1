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
