/* Prototype class for pop-up editable form tools */

magic.classes.PopupForm = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Popover selector (can assign to multiple elements) */
    this.target = jQuery("#" + options.target);
    
    /* Caption for the popover */
    this.caption = options.caption || "Popup edit form";
    
    /* Classes to apply to popover and popover-content */
    this.popoverClass = options.popoverClass || "";
    this.popoverContentClass = options.popoverContentClass || "";
    
    /* Pre-populator */
    this.prePopulator = options.prePopulator || {};
    
    /* Sub-forms */
    this.subForms = {};
    
    /* === Internal properties === */
    this.active = false;

    /* Control callbacks */
    this.controlCallbacks = {
        onActivate: jQuery.proxy(function(payload) {
            this.prePopulator = payload;            
            this.target.popover("show");    
        }, this),
        onDeactivate: jQuery.proxy(function(quiet) {            
            if (!quiet && this.formDirty()) { 
                /* Prompt user about unsaved edits */
                bootbox.confirm({
                    message: "Unsaved edits - save before closing?",
                    buttons: {
                        confirm: {
                            label: "Yes",
                            className: "btn-success"
                        },
                        cancel: {
                            label: "No",
                            className: "btn-danger"
                        }
                    },
                    callback: jQuery.proxy(function (result) {
                        if (result) {                
                            if (jQuery.isFunction(this.saveForm)) {
                                if (!jQuery.isEmptyObject(this.subForms)) {
                                    jQuery.each(this.subForms, function(k, frm) {
                                        if (jQuery.isFunction(frm.saveForm)) {
                                            frm.saveForm();
                                        }                                        
                                    });
                                }                               
                                this.saveForm();
                            }                
                        } else {
                            this.savedState = {};
                            this.cleanForm();
                            this.tidyUp();
                            this.target.popover("hide");
                        }                        
                    }, this)
                });
            } else {                
                this.savedState = {};
                this.cleanForm();
                this.tidyUp();
                this.target.popover("hide");
            }    
        }, this)
    };    
    
    /* Form changed */
    this.formEdited = false; 
    
    /* The state of the form on save */
    this.clearState();
    
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

magic.classes.PopupForm.prototype.getCaption = function () {
    return(this.caption);
};

magic.classes.PopupForm.prototype.setCaption = function (newCaption) {
    this.caption = newCaption;
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
    jQuery("." + this.popoverClass).find("button.dialog-deactivate").off("click").on("click", jQuery.proxy(function () {
        this.deactivate(false);        
    }, this));    
};  

/**
 * Activate the control, optionally populating the form
 * @param {Object} payload
 */
magic.classes.PopupForm.prototype.activate = function (payload) {
    this.active = true; 
    if (jQuery.isFunction(this.controlCallbacks["onActivate"])) {
        this.controlCallbacks["onActivate"](payload);
    }
};

/**
 * Deactivate the control
 * @param {boolean} suppress prompt inform about unsaved edits
 */
magic.classes.PopupForm.prototype.deactivate = function (quiet) {    
    this.active = false;
    if (jQuery.isFunction(this.controlCallbacks["onDeactivate"])) {
        this.controlCallbacks["onDeactivate"](quiet);
    }
};

/**
 * Deactivate the control after n milliseconds
 * @param {int} wait time
 */
magic.classes.PopupForm.prototype.delayedDeactivate = function (millis) {    
    setTimeout(jQuery.proxy(function() {
        this.deactivate(true);
    }, this), millis);
};

/**
 * Clear a saved state
 */
magic.classes.PopupForm.prototype.clearState = function () {
    this.savedState = {};
};

/**
 * Has the form been edited?
 * @return {Boolean}
 */
magic.classes.PopupForm.prototype.formDirty = function() {
    return(this.formEdited);
};

/**
 * Clean the form i.e. reset the edited flag
 * @return {Boolean}
 */
magic.classes.PopupForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

/**
 * Deactivate all sub-forms
 * @param {boolean} quiet to suppress warnings about unsaved edits  
 */
magic.classes.PopupForm.prototype.tidyUp = function(quiet) {
    if (!jQuery.isEmptyObject(this.subForms)) {
        jQuery.each(this.subForms, function(k, frm) {
            if (frm != null && jQuery.isFunction(frm.deactivate)) {
                frm.deactivate(quiet);
            }                                        
        });
    }      
};