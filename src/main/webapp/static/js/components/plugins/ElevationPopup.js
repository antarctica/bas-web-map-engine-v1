/* Height enquiry from a map base raster, displayed as a popover on the map */

magic.classes.ElevationPopup = function(options) {
        
    magic.classes.DemAwareTool.call(this, options);
    
    /* The pop-up indicating height at a point, done as an overlay */
    var hPopDiv = jQuery("#height-popup");
    if (hPopDiv.length == 0) {
        jQuery("body").append('<div id="height-popup" title="Elevation"></div>');
        hPopDiv = jQuery("#height-popup");
    }
    this.heightPopup = new ol.Overlay({element: hPopDiv[0]});
    this.map.addOverlay(this.heightPopup);
    
};

magic.classes.ElevationPopup.prototype = Object.create(magic.classes.DemAwareTool.prototype);
magic.classes.ElevationPopup.prototype.constructor = magic.classes.ElevationPopup;

magic.classes.ElevationPopup.prototype.activate = function() {
    this.map.on("singleclick", this.showHeightPopover, this);
    this.map.on("moveend", this.destroyPopup, this);
};

magic.classes.ElevationPopup.prototype.deactivate = function() {
    this.destroyPopup();
    this.map.un("singleclick", this.showHeightPopover, this);
    this.map.un("moveend", this.destroyPopup, this);
};
        
/**
 * Map click handler to query DEM elevation at a point and display in a popover overlay
 * @param {jQuery.Event} evt
 */
magic.classes.ElevationPopup.prototype.showHeightPopover = function(evt) {
    this.queryElevation(evt, 
    jQuery.proxy(function(clickPt, x, y, z) {
        var jqElt = jQuery(this.heightPopup.getElement());
        jqElt.popover("destroy");
        this.heightPopup.setPosition(clickPt);
        jqElt.popover({
            "container": "body",
            "placement": "top",
            "animation": false,
            "html": true,
            "content": magic.modules.GeoUtils.formatSpatial(z, 1, this.units, "m", 2) + " at (" + x + ", " + y + ")"
        }); 
        jqElt.popover("show");
    }, this),
    jQuery.proxy(function(clickPt, xhr) {
        var jqElt = jQuery(this.heightPopup.getElement());
        jqElt.popover("destroy");
        this.heightPopup.setPosition(clickPt);
        var msg = xhr.status == 401 ? "Not authorised to query DEM" : "Failed to get height";        
        jqElt.popover({
            "container": "body",
            "placement": "top",
            "animation": false,
            "html": true,
            "content": msg
        }); 
        jqElt.popover("show");
    }, this));    
};

/**
 * Destroy the height information popup
 */
magic.classes.ElevationPopup.prototype.destroyPopup = function() {
    jQuery(this.heightPopup.getElement()).popover("destroy");
};



