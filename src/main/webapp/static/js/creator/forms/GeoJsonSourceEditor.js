/* GeoJSON source editor */

magic.classes.creator.GeoJsonSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "geojson-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "geojson_source", "default": ""},
            {"field": "feature_name", "default": ""},
            {"field": "srs", "default": ""},
            {"field": "style_definition", "default": "{\"mode\": \"default\"}"}
        ],
        onSaveContext: function() {}
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(this.init, this),
        onSaveContext: options.onSaveContext
    }));   
                    
};

magic.classes.creator.GeoJsonSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.GeoJsonSourceEditor.prototype.constructor = magic.classes.creator.GeoJsonSourceEditor;

magic.classes.creator.GeoJsonSourceEditor.prototype.markup = function() {
    return(
        '<input type="hidden" name="' + this.prefix + '-style_definition" id="' + this.prefix + '-style_definition"></input>' + 
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-geojson_source" class="col-md-3 control-label"><span class="label label-danger">Feed URL</span></label>' + 
            '<div class="col-md-9">' + 
                '<input type="url" class="form-control" id="' + this.prefix + '-geojson_source" name="' + this.prefix + '-geojson_source" ' +  
                       'placeholder="URL of GeoJSON source" required="required" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Source URL for GeoJSON e.g. WFS feed, API output etc">' +                                    
                '</input>' + 
            '</div>' + 
        '</div>' + 
        '<div class="form-group">' + 
            '<label class="col-md-3 control-label" for="' + this.prefix + '-feature_name">' + 
                'Feature' + 
            '</label>' + 
            '<div class="col-md-9">' + 
                '<input type="text" class="form-control" id="' + this.prefix + '-feature_name" name="' + this.prefix + '-feature_name" ' + 
                        'data-toggle="tooltip" data-placement="left" title="Feature name (only relevant if data is a WFS feed)" pattern="^[a-zA-Z0-9_:]+$">' + 
                '</input>' + 
            '</div>' + 
        '</div>' +        
        '<div class="form-group">' + 
            '<label class="col-md-3 control-label" for="' + this.prefix + '-srs">' + 
                'Projection' + 
            '</label>' + 
            '<div class="col-md-9">' + 
                '<select class="form-control" id="' + this.prefix + '-srs" name="' + this.prefix + '-srs" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Projection of GeoJSON feed data (defaults to lat/lon WGS84). If feed is WFS, set this value to reproject the data to this SRS">' +                     
                '</select>' + 
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

magic.classes.creator.GeoJsonSourceEditor.prototype.init = function(context) {
    
    /* Populate the projection choices */
    jQuery("#" + this.prefix + "-srs").html(
        '<option value="EPSG:4326" selected>WGS84 (lat/lon) - EPSG:4326</option>' + 
        '<option value="' + magic.runtime.projection + '">' + magic.runtime.projection + '</option>'
    );
    
    var mode = this.getStyleParameter(context.style_definition, "mode");
    var predefined = this.getStyleParameter(context.style_definition, "predefined") || "";
    this.populateCannedStylesDropdown(predefined);
    this.setStyleHandlers(context);               
    
    /* Show canned styles input if appropriate */
    var predefinedStyleDiv = jQuery("div.predefined-style-input");
    if (predefinedStyleDiv.length > 0) {
        if (mode == "predefined" && predefined) {              
            predefinedStyleDiv.removeClass("hidden");
        } else {
            predefinedStyleDiv.addClass("hidden");
        }
    }
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix); 
};

/**
 * Overridden here as need to cope with the use of canned styles for GeoJSON layers
 */
magic.classes.creator.GeoJsonSourceEditor.prototype.formToPayload = function() {
    /* Check for canned styles */
    var styleMode = jQuery("#" + this.prefix + "-style-mode").val();
    if (styleMode == "predefined") {
        jQuery("#" + this.prefix + "-style_definition").val(JSON.stringify({
            "mode": "predefined",
            "predefined": jQuery("#" + this.prefix + "-style-predefined").val()
        }));
    }
    return({
        "source": magic.modules.Common.formToJson(this.formSchema, this.prefix)
    });
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.creator.GeoJsonSourceEditor.prototype.writeStyle = function(styledef) {
    if (!styledef) {        
        styledef = {"mode": "default"};
    }
    jQuery("#" + this.prefix + "-style_definition").val(JSON.stringify(styledef));
    jQuery("#" + this.prefix + "-style-edit").prop("disabled", (styledef.mode == "predefined" || styledef.mode == "default"));
    
    if (jQuery.isFunction(this.controlCallbacks.onSaveContext)) {
        this.controlCallbacks.onSaveContext();
    }
};

/**
 * Load the values of any predefined vector styles
 * @param {String} defaultVal
 */
magic.classes.creator.GeoJsonSourceEditor.prototype.populateCannedStylesDropdown = function(defaultVal) {
    defaultVal = defaultVal || "";
    var predefKeys = [];
    for(var key in magic.modules.VectorStyles) {
        predefKeys.push(key);
    }
    predefKeys.sort();
    var populator = [];
    jQuery.each(predefKeys, function(idx, key) {
        populator.push({key: key, value: key});
    });    
    magic.modules.Common.populateSelect(jQuery("#" + this.prefix + "-style-predefined"), populator, "key", "value", defaultVal, false);
};

magic.classes.creator.GeoJsonSourceEditor.prototype.sourceSpecified = function() {
    var sourceUrl = jQuery("#" + this.prefix + "-geojson_source").val();
    var featureName = jQuery("#" + this.prefix + "-feature_name").val();
    var isWfs = sourceUrl.indexOf("/wfs") > 0;
    return((isWfs && magic.modules.Common.isUrl(sourceUrl) && featureName) || (!isWfs && magic.modules.Common.isUrl(sourceUrl)));
};

magic.classes.creator.GeoJsonSourceEditor.prototype.validate = function() {
    magic.modules.Common.resetFormIndicators();
    var sourceUrlInput = jQuery("#" + this.prefix + "-geojson_source");
    var sourceUrl = sourceUrlInput.val();   
    var featureNameInput = jQuery("#" + this.prefix + "-feature_name");
    var featureName = featureNameInput.val();
    var isWfs = sourceUrl.indexOf("/wfs") > 0;
    if ((isWfs && magic.modules.Common.isUrl(sourceUrl) && featureName) || (!isWfs && magic.modules.Common.isUrl(sourceUrl))) {
        /* Ok - remove all errors */        
        return(true);
    }
    /* Url is not filled in => error */
    magic.modules.Common.flagInputError(sourceUrlInput);
    if (isWfs && !featureName) {
        magic.modules.Common.flagInputError(featureNameInput);  
    }
    return(false);
};
