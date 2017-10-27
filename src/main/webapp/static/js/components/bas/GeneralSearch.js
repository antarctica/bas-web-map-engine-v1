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

    /* === Internal properties === */
    this.active = false;

    /* Corresponding layer */
    this.layer = new ol.layer.Vector({
        name: this.layername,
        visible: true,
        source: new ol.source.Vector({features: []}),
        style: this.getIconStyle(0.8, this.mapicon),
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
    
    /* Popover content */
    this.content = "";    
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
 * Activate the geosearch control
 * @param {boolean} quiet whether to fire event
 */
magic.classes.GeneralSearch.prototype.activate = function (quiet) {    
    if (!this.layerAdded) {
        this.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    if (!quiet) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);
    }
    this.active = true;
    this.layer.setVisible(true);   
};

/**
 * Activate the geosearch control
 * @param {boolean} quiet whether to fire event
 */
magic.classes.GeneralSearch.prototype.deactivate = function (quiet) {
    this.active = false;
    this.layer.setVisible(false);
    if (!quiet) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);
    }
};

/**
 * Create a style with the given opacity
 * @param {float} opacity
 * @param {String} icon
 * @returns {ol.style.Style}
 */
magic.classes.GeneralSearch.prototype.getIconStyle = function (opacity, icon) {
    return(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            opacity: opacity,
            src: magic.config.paths.baseurl + "/static/images/" + icon + ".png"
        })
    }));
};
