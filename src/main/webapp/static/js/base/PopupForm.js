/* Prototype class for pop-up editable form tools */

magic.classes.PopupForm = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover target */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Popup edit form";
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || "";
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* === Internal properties === */
    this.active = false;

    /* Control callbacks */
    this.controlCallbacks = {};    
    
    /* The state of the form on save */
    this.savedState = {};
    
    /* Popover template */    
    this.template = 
        '<div class="popover popover-auto-width' + (this.popoverClass ? ' ' + this.popoverClass : '') + '" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title">' + this.caption + '</h3>' +
            '<div class="popover-content' + (this.popoverContentClass ? ' ' + this.popoverContentClass : '') + '"></div>' +
        '</div>';       
};

magic.classes.PopupForm.prototype.getFormValue = function () {
    return(this.savedState);
};

magic.classes.PopupForm.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.PopupForm.prototype.getTemplate = function () {
    return(this.template);
};

magic.classes.PopupForm.prototype.isActive = function () {
    return(this.active);
};

magic.classes.PopupForm.prototype.titleMarkup = function() {
    return(
        '<span><big><strong>' + this.caption + '</strong></big>' + 
            '<button type="button" class="close dialog-deactivate" style="margin-left:5px">&times;</button>' +             
        '</span>'
    );
};

/**
 * Set the callbacks to be invoked on tool activate, deactivate and minimise
 * keys:
 *   onActivate
 *   onDeactivate
 * @param {Object} callbacksObj
 */
magic.classes.PopupForm.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};

magic.classes.PopupForm.prototype.assignCloseButtonHandler = function () {
    jQuery("." + this.popoverClass).find("button.dialog-deactivate").click(jQuery.proxy(function () {
        this.deactivate();
        this.target.popover("hide");
    }, this));    
};  

/**
 * Activate the control, optionally populating the form
 * @param {Object} payload
 */
magic.classes.PopupForm.prototype.activate = function (payload) {
    this.active = true;   
    this.payloadToForm(payload);
    this.assignCloseButtonHandler();
    if (jQuery.isFunction(this.controlCallbacks["onActivate"])) {
        this.controlCallbacks["onActivate"](payload);
    }
};

/**
 * Deactivate the control
 */
magic.classes.PopupForm.prototype.deactivate = function () {
    this.active = false;
    if (jQuery.isFunction(this.controlCallbacks["onDeactivate"])) {
        this.controlCallbacks["onDeactivate"]();
    }
};