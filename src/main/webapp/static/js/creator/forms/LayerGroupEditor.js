/* Layer group editing form */

magic.classes.creator.LayerGroupEditor = function(options) {            
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = options.prefix || "map-layers-group";
    
    /* Callbacks */
    this.onSave = options.onSave || null;
    this.onCancel = options.onCancel || null;
    
    /* Field names */
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name", "default": ""},
        {"field": "expanded", "default": false},
        {"field": "base", "default": false},
        {"field": "autoload", "default": false},
        {"field": "autoload_filter", "default": ""},
        {"field": "autoload_popups", "default": false},
        {"field": "one_only", "default": false}
    ];   
    
    /* Form active flag */
    this.active = false;
    
    /* Save and cancel buttons */
    this.saveBtn = jQuery("#" + this.prefix + "-save");
    this.cancelBtn = jQuery("#" + this.prefix + "-cancel");
   
    /* Add handler for autoload checkbox click */
    jQuery("#" + this.prefix + "-autoload").change(function(evt) {
        jQuery("#" + evt.currentTarget.id + "_filter").closest("div.form-group").toggleClass("hidden");
        jQuery("#" + evt.currentTarget.id + "_popups").closest("div.form-group").toggleClass("hidden");
    });
    
    /* Form change handling */
    this.formDirty = false;
    jQuery("[id^='" + this.prefix + "']").filter(":input").on("change keyup", jQuery.proxy(function() {
        this.saveBtn.prop("disabled", false);
        this.formDirty = true;
    }, this)); 
    
    /* Save button handling */
    this.saveBtn.off("click").on("click", jQuery.proxy(this.saveContext, this));
    
    /* Cancel button handling */
    this.cancelBtn.off("click").on("click", jQuery.proxy(this.cancelEdit, this));
            
};

magic.classes.creator.LayerGroupEditor.prototype.isActive = function() {
    return(this.active);
};

magic.classes.creator.LayerGroupEditor.prototype.isDirty = function() {
    return(this.formDirty);
};

magic.classes.creator.LayerGroupEditor.prototype.loadContext = function(context) {
    
    if (!context) {
        return;
    }
    
    /* Disable save button until form is changed */
    this.saveBtn.prop("disabled", true);
    
    /* Display the filter and popup choice inputs if the autoload checkbox is ticked */
    var alFilterDiv = jQuery("#" + this.prefix + "-autoload_filter").closest("div.form-group");
    var alPopupsDiv = jQuery("#" + this.prefix + "-autoload_popups").closest("div.form-group");
    if (context.autoload) {
        alFilterDiv.removeClass("hidden");
        alPopupsDiv.removeClass("hidden");
    } else {
        alFilterDiv.addClass("hidden");
        alPopupsDiv.addClass("hidden");
    }
    
    /* Populate form from data */
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);  
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Activate */
    this.active = true;
};

magic.classes.creator.LayerGroupEditor.prototype.saveContext = function() {
    
    //console.log("===== LayerGroupEditor.saveContext() called");
    
    if (jQuery.isFunction(this.onSave)) {
        /* Populate form from data */
        var payload = magic.modules.Common.formToJson(this.formSchema, this.prefix);
        if (!payload.layers) {
            payload.layers = [];
        }
        this.onSave(payload);
    }
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Deactivate */
    this.active = false;
    
    //console.log("===== LayerGroupEditor.saveContext() end");
};

magic.classes.creator.LayerGroupEditor.prototype.cancelEdit = function() {
    
    if (jQuery.isFunction(this.onCancel)) {
        /* Callback invocation */
        this.onCancel();
    }
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Deactivate */
    this.active = false;
};

/**
 * Validate form inputs
 */
magic.classes.creator.LayerGroupEditor.prototype.validate = function() {
    magic.modules.Common.resetFormIndicators();
    var ok = jQuery("#" + this.prefix + "-form")[0].checkValidity();
    /* Indicate invalid fields */
    jQuery.each(jQuery("#" + this.prefix + "-form").find("input"), function(idx, ri) {
        var riEl = jQuery(ri);
        var vState = riEl.prop("validity");
        if (!vState.valid) {
            magic.modules.Common.flagInputError(riEl);
        } 
    });
    if (ok) {
        /* Check filter is specified if autoload box is ticked */
        if (jQuery("#" + this.prefix + "-autoload").is(":checked")) {
            var filterInput = jQuery("#" + this.prefix + "-autoload_filter");
            if (!filterInput.val()) {                
                filterInput.closest("div.form-group").removeClass("hidden").addClass("has-error");
                ok = false;
            } else {
                /* Add the capability to use wildcards ? (0-1 chars), * (0 or more chars), + (1 or more chars) - David 13/03/2017 */
                var fval = filterInput.val();
                if (fval.match(/[A-Za-z0-9+*?-_]+/)) {                
                    filterInput.closest("div.form-group").removeClass("has-error").addClass("hidden");
                } else {
                    filterInput.closest("div.form-group").removeClass("hidden").addClass("has-error");
                    ok = false;
                }                
            }            
        }
    }
    return(ok);
};