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
    
    /* === Internal properties === */
    this.active = false;

    /* Corresponding layer */
    this.layer = new ol.layer.Vector({
        name: this.layername,
        visible: true,
        source: new ol.source.Vector({features: []}),
        style: this.styleFunction,
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

magic.classes.GeneralSearch.prototype.assignCloseButtonHandler = function (callback) {
    jQuery("." + this.popoverClass).find("button.close").click(jQuery.proxy(function () {
        this.deactivate(callback);
        this.target.popover("hide");
    }, this));
};    

/**
 * Activate the search control
 * @param {Function} onActivate
 * @param {Function} onDeactivate
 */
magic.classes.GeneralSearch.prototype.activate = function (onActivate, onDeactivate) {    
    if (!this.layerAdded) {
        this.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    if (this.interactsMap()) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);
    }
    this.active = true;
    this.layer.setVisible(true);
    this.assignCloseButtonHandler(onDeactivate);
    if (jQuery.isFunction(onActivate)) {
        onActivate();
    }
};

/**
 * Deactivate the search control
 * @param {Function} callback
 */
magic.classes.GeneralSearch.prototype.deactivate = function (callback) {
    this.active = false;
    this.layer.getSource().clear();
    this.layer.setVisible(false);
    if (this.mapinteraction) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);
    }
    if (jQuery.isFunction(callback)) {
        callback();
    }
};

magic.classes.GeneralSearch.prototype.interactsMap = function () {
    return(false);
};

/**
 * Add a Bootstrap tagsinput plugin widget to the input with given id
 * @param {string} id
 */
magic.classes.GeneralSearch.prototype.addTagsInput = function (id) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        var tooltip = elt.attr("title");
        elt.tagsinput({
            trimValue: true,
            allowDuplicates: false,
            cancelConfirmKeysOnEmpty: false
        });
        if (tooltip) {
            /* Locate the input added by the tagsInput plugin to attach tooltip */
            var btInput = elt.closest("div").find(".bootstrap-tagsinput :input");
            if (btInput) {
                btInput.attr("data-toggle", "tooltip");
                btInput.attr("data-placement", "right");
                btInput.attr("title", tooltip);
            }
        }
    }
};

/**
 * Populate a Bootstrap tagsinput plugin widget with the give value
 * @param {string} id
 * @param {string} value comma-separated string representing array of values
 */
magic.classes.GeneralSearch.prototype.populateTagsInput = function (id, value) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        jQuery.each(value.split(","), function(idx, v) {
            elt.tagsinput("add", v);
        });
    }
};

/**
 * Reset a Bootstrap tagsinput plugin widget by removing all entered values
 * @param {string} id
 */
magic.classes.GeneralSearch.prototype.resetTagsInput = function (id) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        elt.tagsinput("removeAll");
    }
};

/**
 * Format error messages about problem fields from validation
 * @param {Object} errors
 * @return {String}
 */
magic.classes.GeneralSearch.prototype.formatErrors = function (errors) {
    var html = "";
    for (var errkey in errors) {
        html += '<p>' + errkey + ' - ' + errors[errkey] + '</p>';
    }
    return(html);
};
