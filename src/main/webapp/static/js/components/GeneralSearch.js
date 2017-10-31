/* Prototype class for a general search resulting in clickable points on the map */

magic.classes.GeneralSearch = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover target */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Search by";
    
    /* Dialog id, for autogeneration of defaults */
    this.dialogId = "search" + magic.modules.Common.uuid();
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || this.dialogId;
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* Name for the results layer */
    this.layername = options.layername || this.dialogId;
    
    /* Map to add layer to */
    this.map = options.map || magic.runtime.map;
    
    /* Icon to be used on the map (should be a path under static/images, without the .png on the end */
    this.mapicon = options.mapicon || "marker_red";
    
    /* Whether the search control fires a 'mapinteractionactivated' event */
    this.mapinteraction = options.mapinteraction;
    
    /* Callbacks for activate/deactivate */
    this.activateCallback = options.activateCallback || null;
    this.deactivateCallback = options.deactivateCallback || null;

    /* === Internal properties === */
    this.active = false;

    /* Corresponding layer */
    this.layer = new ol.layer.Vector({
        name: this.layername,
        visible: true,
        source: new ol.source.Vector({features: []}),
        style: magic.modules.Common.getIconStyle(0.8, this.mapicon),
        metadata: {}
    });
    
    /* Don't add layer to map at creation time - other map layers may not have finished loading */
    this.layerAdded = false;    

    /* Popover template */    
    this.template = 
        '<div class="popover popover-auto-width' + (this.popoverClass ? ' ' + this.popoverClass : '') + '" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' +
            '<div class="popover-content' + (this.popoverContentClass ? ' ' + this.popoverContentClass : '') + '"></div>' +
        '</div>';;       
};

magic.classes.GeneralSearch.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.GeneralSearch.prototype.getTemplate = function () {
    return(this.template);
};

magic.classes.GeneralSearch.prototype.isActive = function () {
    return(this.active);
};

magic.classes.GeneralSearch.prototype.assignCloseButtonHandler = function () {
    jQuery("." + this.popoverClass).find("button.close").click(jQuery.proxy(function () {
        this.target.popover("hide");
    }, this));
};    

/**
 * Activate the search control
 */
magic.classes.GeneralSearch.prototype.activate = function () {    
    if (!this.layerAdded) {
        this.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    if (this.mapinteraction) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);
    }
    this.active = true;
    this.layer.setVisible(true); 
    if (jQuery.isFunction(this.activateCallback)) {
        this.activateCallback();
    }
};

/**
 * Deactivate the search control
 */
magic.classes.GeneralSearch.prototype.deactivate = function () {
    this.active = false;
    this.layer.setVisible(false);
    if (this.mapinteraction) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);
    }
    if (jQuery.isFunction(this.deactivateCallback)) {
        this.deactivateCallback();
    }
};
