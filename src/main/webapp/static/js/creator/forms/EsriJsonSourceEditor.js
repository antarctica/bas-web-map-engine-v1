/* ESRI JSON source editor */

magic.classes.creator.EsriJsonSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "esrijson-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "esrijson_source", "default": ""},
            {"field": "style_definition", "default": "{\"mode\": \"default\"}"}
        ]
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(this.init, this)
    }));   
    
    this.styler = null;
                
};

magic.classes.creator.EsriJsonSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.EsriJsonSourceEditor.prototype.constructor = magic.classes.creator.EsriJsonSourceEditor;

magic.classes.creator.EsriJsonSourceEditor.prototype.markup = function() {
    return(
        '<input type="hidden" name="' + this.prefix + '-style_definition" id="' + this.prefix + '-style_definition"></input>' + 
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-esrijson_source" class="col-md-3 control-label">Feed URL</label>' + 
            '<div class="col-md-9">' + 
                '<input type="url" class="form-control" id="' + this.prefix + '-esrijson_source" name="' + this.prefix + '-esrijson_source" ' +  
                       'placeholder="URL of ESRI  source" required="required" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Source URL for ArcGIS Online JSON feed">' +                                    
                '</input>' + 
            '</div>' + 
        '</div>' +                 
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.prefix + '-style-mode">Style</label>' +                 
            '<div class="form-inline col-md-9">' + 
                '<select id="' + this.prefix + '-style-mode" class="form-control" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Layer styling">' +
                    '<option value="default" selected="selected">Default</option>' + 
                    '<option value="predefined">Use pre-defined style</option>' +
                    '<option value="point">Point style</option>' +
                    '<option value="line">Line style</option>' +
                    '<option value="polygon">Polygon style</option>' +
                '</select>' + 
                '<button id="' + this.prefix + '-style-edit" data-trigger="manual" data-container="body" data-toggle="popover" data-placement="left" ' + 
                    ' type="button" role="button"class="btn btn-md btn-primary" disabled="disabled"><span class="fa fa-pencil"></span>' + 
                '</button>' +
            '</div>' + 
        '</div>' + 
        '<div class="form-group hidden predefined-style-input">' + 
            '<label class="col-md-3 control-label" for="' + this.prefix + '-style-predefined">' + 
                'Style name' + 
            '</label>' + 
            '<div class="col-md-9">' + 
                '<select class="form-control" id="' + this.prefix + '-style-predefined" name="' + this.prefix + '-style-predefined" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Select a canned style for a vector layer">' + 
                '</select>' + 
            '</div>' + 
        '</div>'
    );
};

magic.classes.creator.EsriJsonSourceEditor.prototype.init = function(context) {
        
    /* Create the styler popup dialog */
    this.styler = new magic.classes.StylerPopup({
        target: this.prefix + "-style-edit",
        onSave: jQuery.proxy(this.writeStyle, this)                    
    });
    
    /* Change handler for style mode */
    var ddStyleMode = jQuery("#" + this.prefix + "-style-mode");
    var btnStyleEdit = jQuery("#" + this.prefix + "-style-edit");
    ddStyleMode.off("change").on("change", jQuery.proxy(function(evt) {
        var changedTo = jQuery(evt.currentTarget).val();
        jQuery("#" + this.prefix + "-style_definition").val("{\"mode\":\"" + changedTo + "\"}");
        if (changedTo == "predefined") {
            jQuery("div.predefined-style-input").removeClass("hidden");
        } else {
            jQuery("div.predefined-style-input").addClass("hidden");
        }
        btnStyleEdit.prop("disabled", (changedTo == "predefined" || changedTo == "default"));
    }, this));
    
    /* Style edit button */
    btnStyleEdit.off("click").on("click", jQuery.proxy(function(evt) {
        var styledef = jQuery("#" + this.prefix + "-style_definition").val();
        if (!styledef) {
            styledef = {"mode": (ddStyleMode.val() || "default")};
        } else if (typeof styledef == "string") {
            styledef = JSON.parse(styledef);
        }
        this.styler.activate(styledef);
    }, this));
    
    this.populateCannedStylesDropdown();
    
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);
    
    /* Set the style mode appropriately */
    ddStyleMode.val("default");
    btnStyleEdit.prop("disabled", true);
    var sd = context.style_definition;
    if (typeof sd == "string") {
        sd = JSON.parse(sd);
    }
    if (sd.mode) {
        ddStyleMode.val(sd.mode);
        btnStyleEdit.prop("disabled", sd.mode == "default");
    }
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.creator.EsriJsonSourceEditor.prototype.writeStyle = function(styledef) {
    if (!styledef) {
        /* Bit more work to determine style - not come straight from an edit */
        var mode = jQuery("#" + this.prefix + "-style-mode").val();
        if (mode == "predefined") {
            styledef = {
                "mode": "predefined", 
                "predefined": jQuery("#" + this.prefix + "-style-predefined").val()
            };
        } else {
            styledef = {"mode": "default"};
        }
    }
    jQuery("#" + this.prefix + "-style_definition").val(JSON.stringify(styledef));
    jQuery("#" + this.prefix + "-style-edit").prop("disabled", (mode == "predefined" || mode == "default"));
};

/**
 * Load the values of any predefined vector styles 
 */
magic.classes.creator.EsriJsonSourceEditor.prototype.populateCannedStylesDropdown = function() {    
    var predefKeys = [];
    for(var key in magic.modules.VectorStyles) {
        predefKeys.push(key);
    }
    predefKeys.sort();
    var populator = [];
    jQuery.each(predefKeys, function(idx, key) {
        populator.push({key: key, value: key});
    });    
    magic.modules.Common.populateSelect(jQuery("#" + this.prefix + "-style-predefined"), populator, "key", "value", "", false);
};

magic.classes.creator.EsriJsonSourceEditor.prototype.sourceSpecified = function() {
    return(jQuery("#" + this.prefix + "-esrijson_source").val());    
};

magic.classes.creator.EsriJsonSourceEditor.prototype.validate = function() {
    magic.modules.Common.resetFormIndicators();
    var sourceUrlInput = jQuery("#" + this.prefix + "-esrijson_source");
    var sourceUrl = sourceUrlInput.val();   
    if (!magic.modules.Common.isUrl(sourceUrl)) {
        /* Url is not filled in => error */
        magic.modules.Common.flagInputError(sourceUrlInput);
        return(false);
    }
    return(true);
};
