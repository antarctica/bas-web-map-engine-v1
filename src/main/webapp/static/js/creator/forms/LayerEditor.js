/* Layer group editing form */

magic.classes.creator.LayerEditor = function(options) {
            
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = options.prefix || "map-layers-layer";
    
    /* Callbacks */
    this.onSave = options.onSave || null;
    this.onCancel = options.onCancel || null;
    
    /* Field names */
    this.formSchema = [
        {"field": "id", "default": ""}, 
        {"field": "name", "default": ""},
        {"field": "refresh_rate", "default": 0},
        {"field": "legend_graphic", "default": ""},
        {"field": "geom_type", "default": "unknown"},
        {"field": "min_scale", "default": 100}, 
        {"field": "max_scale", "default": 100000000}, 
        {"field": "opacity", "default": 1.0}, 
        {"field": "is_visible", "default": false}, 
        {"field": "is_interactive", "default": false}, 
        {"field": "is_filterable", "default": false}
    ];
    
    /* Source editor */
    this.sourceEditor = null;
    
    /* Attribute editor */
    this.attributeEditor = null;
    
    /* Form active flag */
    this.active = false;
    
    /* Save and cancel buttons */
    this.saveBtn = jQuery("#" + this.prefix + "-save");
    this.cancelBtn = jQuery("#" + this.prefix + "-cancel");   
    
    /* Form change handling */
    this.formDirty = false;                
    
    /* Save button handling */
    this.saveBtn.off("click").on("click", jQuery.proxy(this.saveContext, this));
    
    /* Cancel button handling */
    this.cancelBtn.off("click").on("click", jQuery.proxy(this.cancelEdit, this));
    
};

magic.classes.creator.LayerEditor.prototype.isActive = function() {
    return(this.active);
};

magic.classes.creator.LayerEditor.prototype.isDirty = function() {
    return(this.formDirty);
};

magic.classes.creator.LayerEditor.prototype.loadContext = function(context) {
    
    if (!context) {
        return;
    }
    
    this.sourceMarkup(null, context); 
    
    jQuery("[id^='" + this.prefix + "']").filter(":input").off("change keyup").on("change keyup", jQuery.proxy(function() {
        this.saveBtn.prop("disabled", false);
        this.formDirty = true;
    }, this)); 
    
    /* Disable save button until form is changed */
    this.saveBtn.prop("disabled", true);
    
    /* Source type dropdown */
    jQuery("#" + this.prefix + "-source_type").off("change").on("change", jQuery.proxy(function(evt) {
        if (this.formDirty) {
            bootbox.confirm(
                '<div class="alert alert-danger" style="margin-top:10px">You have unsaved changes - proceed?</div>', 
                jQuery.proxy(function(result) {
                    if (result) {
                        this.sourceMarkup(jQuery(evt.currentTarget).val(), null);
                    }  
                    bootbox.hideAll();
                }, this)); 
        } else {
            this.sourceMarkup(jQuery(evt.currentTarget).val(), null);
        }        
    }, this));
      
    /* Populate form from data */
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);
    
    /* Interactivity triggers */
    jQuery("#" + this.prefix + "-is_interactive").off("change").on("change", jQuery.proxy(function(evt) {
        if (jQuery(evt.currentTarget).prop("checked") === true) {
            jQuery("div.attribute-editor").removeClass("hidden");
        } else {
            jQuery("div.attribute-editor").addClass("hidden");
        }
    }, this));
    if (context.is_interactive === true) {
        jQuery("div.attribute-editor").removeClass("hidden");
    } else {
        jQuery("div.attribute-editor").addClass("hidden");
    }
    /* Attribute edit button */
    jQuery("#" + this.prefix + "-attribute-edit").off("click").on("click", jQuery.proxy(function(evt) {
        if (!this.attributeEditor) {
            this.attributeEditor = new magic.classes.creator.AttributeEditorPopup({
                target: this.prefix + "-attribute-edit"
            });
        }
        if (this.sourceEditor.sourceSpecified()) {
            this.attributeEditor.activate(jQuery.extend({}, context.source, {"attribute_map": context.attribute_map}));
        } else {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    'Please specify at least a source URL (and a feature name for WFS feeds)' + 
                '</div>'
            );
        }
    }, this));
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Activate */
    this.active = true;
};

magic.classes.creator.LayerEditor.prototype.saveContext = function(context) {
    
    if (jQuery.isFunction(this.onSave)) {
        /* Populate form from data */
        this.onSave(magic.modules.Common.formToJson(this.formSchema, this.prefix));
    }
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Deactivate */
    this.active = false;
};

magic.classes.creator.LayerEditor.prototype.cancelEdit = function() {
    
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
magic.classes.creator.LayerEditor.prototype.validate = function() {    
    var ok = jQuery("#" + this.prefix + "-form")[0].checkValidity();
    /* Indicate invalid fields */
    jQuery.each(jQuery("#" + this.prefix + "-form").find("input"), function(idx, ri) {
        var riEl = jQuery(ri);
        var fg = riEl.closest("div.form-group");
        var vState = riEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error").addClass("has-success");
        } else {
            fg.removeClass("has-success").addClass("has-error");
        }
    });
    if (ok) {
        /* Check filter is specified if autoload box is ticked */
        if (jQuery("#" + this.prefix + "-autoload").is(":checked")) {
            var filterInput = jQuery("#" + this.prefix + "-autoload_filter");
            if (!filterInput.val()) {                
                filterInput.closest("div.form-group").removeClass("hidden has-success").addClass("show has-error");
                ok = false;
            } else {
                /* Add the capability to use wildcards ? (0-1 chars), * (0 or more chars), + (1 or more chars) - David 13/03/2017 */
                var fval = filterInput.val();
                if (fval.match(/[A-Za-z0-9+*?-_]+/)) {                
                    filterInput.closest("div.form-group").removeClass("has-error").addClass("has-success");
                } else {
                    filterInput.closest("div.form-group").removeClass("hidden has-success").addClass("show has-error");
                    ok = false;
                }                
            }            
        }
    }
    return(ok);
};

/**
 * Show the layer source editing markup
 * @param {String} type
 * @param {Object} context
 */
magic.classes.creator.LayerEditor.prototype.sourceMarkup = function(type, context) {
    if (!type) {
        type = this.typeFromContext(context);   
        jQuery("#" + this.prefix + "-source_type").val(type);
    }
    var payload = {
        prefix: this.prefix,
        sourceContext: context ? context.source : null
    };
    switch(type) {
        case "geojson": this.sourceEditor = new magic.classes.creator.GeoJsonSourceEditor(payload); break;
        case "gpx": this.sourceEditor = new magic.classes.creator.GpxSourceEditor(payload); break;
        case "kml": this.sourceEditor = new magic.classes.creator.KmlSourceEditor(payload); break;
        default: this.sourceEditor = new magic.classes.creator.WmsSourceEditor(payload); break;
    }   
    jQuery("#" + this.prefix + "-source").removeClass("hidden").html(this.sourceEditor.markup());
    this.sourceEditor.loadContext(payload.sourceContext);      
};

/**
 * Determine a one word data source type from an existing context
 * @param {Object} context
 * @return {String}
 */
magic.classes.creator.LayerEditor.prototype.typeFromContext = function(context) {
    var type = "wms";            
    if (context && context.source) {
        var sourceTypes = ["geojson", "gpx", "kml", "wms"];
        for (var i = 0; i < sourceTypes.length; i++) {
            if (context.source[sourceTypes[i] + "_source"]) {
                type = sourceTypes[i];
                break;
            }
        }        
    }
    return(type);
};