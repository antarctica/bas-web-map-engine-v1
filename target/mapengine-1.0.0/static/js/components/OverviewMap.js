/* Overview map, implemented as a Bootstrap popover */

magic.classes.OverviewMap = function(options) {

    /* API properties */
    
    /* id allows more than one tool per application */
    this.id = options.id || "overview-map-tool";
      
    this.target = $("#" + options.target);
    
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
        title: '<span>Overview map<button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: "Overview map"
    })
    .on("show.bs.popover", $.proxy(function() {
        return(this.setEnabledStatus());
    }, this))
    .on("shown.bs.popover", $.proxy(function() {
        this.initControl();        
        /* Close button */
        $(".overview-map-popover").find("button.close").click($.proxy(function() { 
            this.target.popover("hide");
        }, this));
    }, this));
    $(document).on("baselayerchanged", $.proxy(this.initControl, this));
};

magic.classes.OverviewMap.prototype.initControl = function() {
    var poContent = $("div.overview-map-popover-content");
    poContent.html("");
    if (this.control != null) {
        magic.runtime.map.removeControl(this.control);
        this.control = null;
    }
    this.control = new ol.control.OverviewMap({
        target: poContent[0],
        collapsed: false,
        className: "ol-overviewmap custom-overview-map",
        layers: this.getOverviewLayers()
    });        
    magic.runtime.map.addControl(this.control);
    $("button[title='Overview map']").addClass("hidden");
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
    if (magic.runtime.layertree) {
        $.each(magic.runtime.layertree.getBaseLayers(), $.proxy(function(bi, bl) {
            if (bl.getVisible()) {
                /* This is the visible base layer */
                oLayers.push(bl);
                return(false);
            }
        }, this));
        if (oLayers.length > 0) {
            if (!magic.runtime.layertree.isRasterLayer(oLayers[0])) {
                $.each(magic.runtime.layertree.getOverlayLayers(), $.proxy(function(oi, olyr) {
                    if (olyr.get("name").toLowerCase().indexOf("coastline") != -1) {
                        /* Coastline */
                        oLayers.push(olyr);
                    }
                }, this));
            }
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
        enable = magic.runtime.map.getView().getResolution() <= 2000.0;
    }
    if (!enable) {        
        this.target.popover("hide");
        this.target.attr("title", "Overview disabled for zoomed out maps");
    } else {
        this.target.attr("title", "");
    }
    return(enable);
};
