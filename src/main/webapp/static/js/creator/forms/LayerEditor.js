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
    
    /* Form inputs, per source */
    this.sourceSchemas = {
        "wms": [
            {"field": "wms_source", "default": ""}, 
            {"field": "feature_name", "default": ""}, 
            {"field": "style_name", "default": ""},            
            {"field": "is_base", "default": false}, 
            {"field": "is_singletile", "default": false}, 
            {"field": "is_dem", "default": false}, 
            {"field": "is_time_dependent", "default": false}
        ],
        "geojson": [
            {"field": "geojson_source", "default": ""},
            {"field": "feature_name", "default": ""},
            {"field": "srs", "default": ""}
        ],
        "gpx": [
            {"field": "gpx_source", "default": ""}
        ],
        "kml": [
            {"field": "kml_source", "default": ""}
        ]                
    };
    
    /* Source editor */
    this.sourceEditor = null;
    
    /* Form active flag */
    this.active = false;
    
    /* Save and cancel buttons */
    this.saveBtn = jQuery("#" + this.prefix + "-save");
    this.cancelBtn = jQuery("#" + this.prefix + "-cancel");   
    
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
    
    /* Region sources are defined in */
    this.region = null;
    
};

magic.classes.creator.LayerEditor.prototype.isActive = function() {
    return(this.active);
};

magic.classes.creator.LayerEditor.prototype.isDirty = function() {
    return(this.formDirty);
};

magic.classes.creator.LayerEditor.prototype.setRegion = function(region) {
    this.region = region;
};

magic.classes.creator.LayerEditor.prototype.loadContext = function(context) {
    
    if (!context) {
        return;
    }
    
    this.sourceMarkup(context);    
    
    /* Disable save button until form is changed */
    this.saveBtn.prop("disabled", true);
      
    /* Populate form from data */
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);  
    
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
 * @param {Object} context
 */
magic.classes.creator.LayerEditor.prototype.sourceMarkup = function(context) {
    if (context.source.geojson_source) {
        /* GeoJSON */
        this.sourceEditor = new magic.classes.creator.GeoJsonSourceEditor({
            sourceContext: context.source,
            region: this.region
        });
    } else if (context.source.gpx_source) {
        /* GPX */
        this.sourceEditor = new magic.classes.creator.GpxSourceEditor({
            sourceContext: context.source,
            region: this.region
        });
    } else if (context.source.kml_source) {
        /* KML */
        this.sourceEditor = new magic.classes.creator.KmlSourceEditor({
            sourceContext: context.source,
            region: this.region
        });
    } else {
        /* Default to WMS */
        this.sourceEditor = new magic.classes.creator.WmsSourceEditor({
            sourceContext: context.source,
            region: this.region
        });        
    }
    jQuery("#" + this.prefix + "-layer-source").removeClass("hidden").html(this.sourceEditor.markup());
};