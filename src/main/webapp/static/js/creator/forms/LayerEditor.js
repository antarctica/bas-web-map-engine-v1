/* Layer editing form */

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
    
    /* Edited attribute map repository */
    this.attrEditorUpdates = {};
    
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
    return(this.formDirty || !jQuery.isEmptyObject(this.attrEditorUpdates));
};

magic.classes.creator.LayerEditor.prototype.loadContext = function(context) {
    
    if (!context) {
        return;
    }   
    
    /* Reset the editor */
    if (this.attributeEditor) {
        this.attributeEditor.deactivate(true);
    }
    if (this.sourceEditor) {
        this.sourceEditor.deactivateStyler(true);
    }
    this.attrEditorUpdates = {};
    
    /* Disable save button until form is changed */
    this.saveBtn.prop("disabled", true);
    
    /* Source type dropdown */
    var ddSourceType = jQuery("#" + this.prefix + "-source_type");
    ddSourceType.off("change").on("change", jQuery.proxy(function(evt) {
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
    this.sourceMarkup(null, context);
    
    /* Determine when there has been a form change */
    jQuery("[id^='" + this.prefix + "']").filter(":input").on("change keyup", jQuery.proxy(this.setFormDirty, this));
    
    /* Interactivity triggers */
    var chkInteractivity = jQuery("#" + this.prefix + "-is_interactive");
    var chkFilterable = jQuery("#" + this.prefix + "-is_filterable");
    chkInteractivity.on("change", jQuery.proxy(function(evt) {
        if (jQuery(evt.currentTarget).prop("checked") === true) {
            jQuery("div.attribute-editor").removeClass("hidden");
        } else if (chkFilterable.prop("checked") === false) {
            jQuery("div.attribute-editor").addClass("hidden");
        }
    }, this));
    
    /* Initialise attribute button sensitive checkboxes */
    chkInteractivity.prop("checked", context.is_interactive);
    chkFilterable.prop("checked", context.is_filterable);
    if (context.is_interactive === true || context.is_filterable === true) {        
        jQuery("div.attribute-editor").removeClass("hidden");
    } else {
        jQuery("div.attribute-editor").addClass("hidden");
    }
    
    /* Filterability trigger */    
    chkFilterable.on("change", jQuery.proxy(function(evt) {
        if (jQuery(evt.currentTarget).prop("checked") === true) {
            jQuery("div.attribute-editor").removeClass("hidden");
        } else if (chkInteractivity.prop("checked") === false) {
            jQuery("div.attribute-editor").addClass("hidden");
        }
    }, this));
   
    /* Attribute edit button */
    jQuery("#" + this.prefix + "-attribute-edit").off("click").on("click", jQuery.proxy(function(evt) {
        if (!this.attributeEditor) {
            this.attributeEditor = new magic.classes.creator.AttributeEditorPopup({
                target: this.prefix + "-attribute-edit",
                onSave: jQuery.proxy(this.saveAttributes, this)
            });
        }
        if (this.sourceEditor.sourceSpecified()) {
            this.attributeEditor.activate(jQuery.extend(context, this.sourceEditor.formToPayload(), this.attrEditorUpdates));
        } else {
            magic.modules.Common.showAlertModal("Please specify at least a source URL (and a feature name for WFS feeds)", "warning");           
        }
    }, this));    
    
    /* Clean the form */
    this.formDirty = false;  
    
    /* Activate */
    this.active = true;
};

magic.classes.creator.LayerEditor.prototype.saveContext = function() {
    
    if (jQuery.isFunction(this.onSave)) {
        /* Populate form from data */
        //console.log("===== LayerEditor.saveContext() called");
        //console.trace();
        var totalPayload = jQuery.extend(true, {},
            magic.modules.Common.formToJson(this.formSchema, this.prefix),
            this.sourceEditor.formToPayload(),
            this.attrEditorUpdates
        );
        //console.log("Payload to write follows...");
        //console.log(totalPayload);
        //console.log("===== LayerEditor.saveContext() calling onSave...");
        this.onSave(totalPayload);
        //console.log("===== LayerEditor.saveContext() Done");
    }
    
    /* Clean the form */
    this.formDirty = false;
    
    /* Deactivate */
    this.active = false;
};

magic.classes.creator.LayerEditor.prototype.saveAttributes = function(attrPayload) {
    this.attrEditorUpdates = attrPayload;
    this.saveBtn.prop("disabled", false);
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
        ok = this.sourceEditor.validate();
    }
    return(ok);
};

/**
 * Show the layer source editing markup
 * @param {String} type
 * @param {Object} context
 */
magic.classes.creator.LayerEditor.prototype.sourceMarkup = function(type, context) {
    type = type || this.typeFromContext(context);   
    jQuery("#" + this.prefix + "-source_type").val(type);
    var payload = {
        prefix: this.prefix,
        sourceContext: context ? (context.source || null) : null,
        onSaveContext: jQuery.proxy(this.setFormDirty, this)
    };    
    switch(type) {
        case "esritile": this.sourceEditor = new magic.classes.creator.EsriTileSourceEditor(payload); break;
        case "geojson": this.sourceEditor = new magic.classes.creator.GeoJsonSourceEditor(payload); break;
        case "esrijson": this.sourceEditor = new magic.classes.creator.EsriJsonSourceEditor(payload); break;
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
        var sourceTypes = ["esritile", "geojson", "esrijson", "gpx", "kml", "wms"];
        for (var i = 0; i < sourceTypes.length; i++) {
            if (context.source[sourceTypes[i] + "_source"]) {
                type = sourceTypes[i];
                break;
            }
        }        
    }
    return(type);
};

/**
 * Handler to ensure form is in 'dirty' state reflecting user changes at a lower level
 */
magic.classes.creator.LayerEditor.prototype.setFormDirty = function() {
    this.saveBtn.prop("disabled", false);
    this.formDirty = true;
};

