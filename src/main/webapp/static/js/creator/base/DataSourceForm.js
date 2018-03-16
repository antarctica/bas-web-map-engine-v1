/* Prototype class for data source editing */

magic.classes.creator.DataSourceForm = function (options) {

    /* External API options */
    this.prefix = options.prefix;
    
    this.sourceContext = options.sourceContext;
    
    this.region = options.region;
    
    this.formSchema = options.formSchema;
    
    this.styler = null;
    
    /* Internal */
    this.controlCallbacks = {};
  
};

magic.classes.creator.DataSourceForm.prototype.loadContext = function(context) {
    if (!context) {
        context = this.defaultData();
    }
    if (jQuery.isFunction(this.controlCallbacks.onLoadContext)) {
        this.controlCallbacks.onLoadContext(context);
    }
};

magic.classes.creator.DataSourceForm.prototype.formToPayload = function(context) {
    return({
        "source": magic.modules.Common.formToJson(this.formSchema, this.prefix)
    });
};

magic.classes.creator.DataSourceForm.prototype.setStyleHandlers = function(context) {
    
    var ddStyleMode = jQuery("#" + this.prefix + "-style-mode");
    var btnStyleEdit = jQuery("#" + this.prefix + "-style-edit");
    var predefinedStyleDiv = jQuery("div.predefined-style-input");
    
    if (ddStyleMode.length > 0 && btnStyleEdit.length > 0) {
        
        /* Create the styler popup dialog */
        this.styler = new magic.classes.StylerPopup({
            target: this.prefix + "-style-edit",
            onSave: jQuery.proxy(this.writeStyle, this)                    
        });

        /* Change handler for style mode */
        ddStyleMode.off("change").on("change", jQuery.proxy(function(evt) {
            var changedTo = jQuery(evt.currentTarget).val();
            jQuery("#" + this.prefix + "-style_definition").val("{\"mode\":\"" + changedTo + "\"}");
            if (predefinedStyleDiv.length > 0) {
                if (changedTo == "predefined") {
                    predefinedStyleDiv.removeClass("hidden");
                } else {
                    predefinedStyleDiv.addClass("hidden");
                }
            }
            btnStyleEdit.prop("disabled", (changedTo == "predefined" || changedTo == "file" || changedTo == "default"));
        }, this));

        /* Style edit button click handler */
        btnStyleEdit.off("click").on("click", jQuery.proxy(function(evt) {
            var styledef = jQuery("#" + this.prefix + "-style_definition").val();
            if (!styledef) {
                styledef = {"mode": (ddStyleMode.val() || "default")};
            } else if (typeof styledef == "string") {
                styledef = JSON.parse(styledef);
            }
            this.styler.activate(styledef);
        }, this));
        
        /* Set the style mode appropriately */
        ddStyleMode.val("default");
        btnStyleEdit.prop("disabled", true);        
        context.style_definition = this.styler.convertLegacyFormats(context.style_definition);
        var mode = context.style_definition.mode;
        ddStyleMode.val(mode);
        btnStyleEdit.prop("disabled", mode == "predefined" || mode == "default" || mode == "file");
    }
};

magic.classes.creator.DataSourceForm.prototype.defaultData = function() {
    var defaultData = {};
    jQuery.each(this.formSchema, jQuery.proxy(function(idx, elt) {
        defaultData[elt["field"]] = elt["default"];
    }, this));
    return(defaultData);
};

magic.classes.creator.DataSourceForm.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};


