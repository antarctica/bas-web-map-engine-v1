/* Prototype class for navigation bar tools */

magic.classes.NavigationBarTool = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover target */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Untitled";
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || "";
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* Name for the results layer */
    this.layername = options.layername;
    
    /* Map to add layer to */
    this.map = options.map || magic.runtime.map;    
    
    /* === Internal properties === */
    this.active = false;

    /* Corresponding layer */
    if (this.layername == null) {
        this.layer = null;
    } else {
        this.layer = new ol.layer.Vector({
            name: this.layername,
            visible: false,
            source: new ol.source.Vector({features: []}),
            style: null,
            metadata: {}
        });
    }
    
    /* Control callbacks */
    this.controlCallbacks = {};
    
    /* Don't add layer to map at creation time - other map layers may not have finished loading */
    this.layerAdded = false;    

    /* Popover template */    
    this.template = 
        '<div class="popover popover-auto-width' + (this.popoverClass ? ' ' + this.popoverClass : '') + '" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title">' + this.caption + '</h3>' +
            '<div class="popover-content' + (this.popoverContentClass ? ' ' + this.popoverContentClass : '') + '"></div>' +
        '</div>';;       
};

magic.classes.NavigationBarTool.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.NavigationBarTool.prototype.getTemplate = function () {
    return(this.template);
};

magic.classes.NavigationBarTool.prototype.isActive = function () {
    return(this.active);
};

magic.classes.NavigationBarTool.prototype.titleMarkup = function() {
    return(
        '<span><big><strong>' + this.caption + '</strong></big>' + 
            '<button type="button" class="close dialog-deactivate" style="margin-left:5px">&times;</button>' + 
            '<button type="button" class="close dialog-minimise" data-toggle="tooltip" data-placement="bottom" ' + 
                'title="Minimise pop-up to see the map better - does not reset dialog"><i class="fa fa-caret-up"></i>' + 
            '</button>' + 
        '</span>'
    );
};

/**
 * Set the callbacks to be invoked on tool activate, deactivate and minimise
 * keys:
 *   onActivate
 *   onDeactivate
 *   onMinimise
 * @param {Object} callbacksObj
 */
magic.classes.NavigationBarTool.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};

magic.classes.NavigationBarTool.prototype.assignCloseButtonHandler = function () {
    jQuery("." + this.popoverClass).find("button.dialog-deactivate").click(jQuery.proxy(function () {
        this.deactivate();
        this.target.popover("hide");
    }, this));
    jQuery("." + this.popoverClass).find("button.dialog-minimise").click(jQuery.proxy(function () {
        if (jQuery.isFunction(this.controlCallbacks["onMinimise"])) {
            this.controlCallbacks["onMinimise"]();
        }
        this.target.popover("hide");
    }, this));
};  

/**
 * Activate the control 
 */
magic.classes.NavigationBarTool.prototype.activate = function () {    
    if (this.layer != null && !this.layerAdded) {
        this.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    if (this.interactsMap()) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);
    }
    this.active = true;
    if (this.layer != null) {
        this.layer.setVisible(true);
    }
    this.assignCloseButtonHandler();
    if (jQuery.isFunction(this.controlCallbacks["onActivate"])) {
        this.controlCallbacks["onActivate"]();
    }
};

/**
 * Deactivate the control
 */
magic.classes.NavigationBarTool.prototype.deactivate = function () {
    this.active = false;
    if (this.layer != null) {
        this.layer.getSource().clear();
        this.layer.setVisible(false);
    }
    if (this.interactsMap()) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);
    }
    if (jQuery.isFunction(this.controlCallbacks["onDeactivate"])) {
        this.controlCallbacks["onDeactivate"]();
    }
};

/**
 * Set template for a 'further info' link button
 * @param {string} helpText
 */
magic.classes.NavigationBarTool.prototype.infoLinkButtonMarkup = function (helpText) {
    return(
        '<div style="float:right">' +
            '<a href="JavaScript:void(0)" class="fa fa-info-circle further-info" data-toggle="tooltip" data-placement="bottom" title="' + helpText + '">&nbsp;' +
                '<span class="fa fa-caret-down"></span>' +
            '</a>' +
        '</div>'
    );
};

/**
 * Set template for a 'further info' text area
 */
magic.classes.NavigationBarTool.prototype.infoAreaMarkup = function () {
    return('<div id="' + this.id + '-further-info" class="alert alert-info hidden"></div>');
};

/**
 * Assign handler for info button click
 * @param {string} caption
 * @para, {string} text
 */
magic.classes.NavigationBarTool.prototype.infoButtonHandler = function (caption, text) {
    jQuery("a.further-info").click(jQuery.proxy(function (evt) {
        var attribArea = jQuery("#" + this.id + "-further-info");
        attribArea.toggleClass("hidden");
        if (!attribArea.hasClass("hidden")) {
            attribArea.html(text);
            jQuery(evt.currentTarget).children("span").removeClass("fa-caret-down").addClass("fa-caret-up");
            jQuery(evt.currentTarget).attr("data-original-title", "Hide " + caption).tooltip("fixTitle");
        } else {
            jQuery(evt.currentTarget).children("span").removeClass("fa-caret-up").addClass("fa-caret-down");
            jQuery(evt.currentTarget).attr("data-original-title", "Show " + caption).tooltip("fixTitle");
        }
    }, this));
};