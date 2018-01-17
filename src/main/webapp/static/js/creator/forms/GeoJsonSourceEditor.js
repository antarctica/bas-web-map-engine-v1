/* GeoJSON source editor */

magic.classes.creator.GeoJsonSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "geojson-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "geojson_source", "default": ""},
            {"field": "feature_name", "default": ""},
            {"field": "srs", "default": ""}
        ]
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(this.init, this)
    }));   
    
    this.styler = null;
                
};

magic.classes.creator.GeoJsonSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.GeoJsonSourceEditor.prototype.constructor = magic.classes.creator.GeoJsonSourceEditor;

magic.classes.creator.GeoJsonSourceEditor.prototype.markup = function() {
    return(
        '<input type="hidden" name="' + this.prefix + '-style_definition" id="' + this.prefix + '-style_definition"></input>' + 
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-geojson_source" class="col-md-3 control-label">Feed URL</label>' + 
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

magic.classes.creator.GeoJsonSourceEditor.prototype.init = function() {
    
    /* Populate the projection choices */
    jQuery("#" + this.prefix + "-srs").html(
        '<option value="EPSG:4326" selected>WGS84 (lat/lon) - EPSG:4326</option>' + 
        '<option value="' + magic.runtime.projection + '">' + magic.runtime.projection + '</option>'
    );
    
    /* Create the styler popup dialog */
    this.styler = new magic.classes.StylerPopup({
        target: this.prefix + "-style-edit",
        onSave: jQuery.proxy(this.writeStyle, this)                    
    });
    
    /* Change handler for style mode */
    jQuery("#" + this.prefix + "-style-mode").off("change").on("change", jQuery.proxy(function(evt) {
        var changedTo = jQuery(evt.currentTarget).val();
        jQuery("#" + this.prefix + "-style_definition").val("{\"mode\":\"" + changedTo + "\"}");
        if (changedTo == "predefined") {
            jQuery("div.predefined-style-input").removeClass("hidden");
        } else {
            jQuery("div.predefined-style-input").addClass("hidden");
        }
        jQuery("#" + this.prefix + "-style-edit").prop("disabled", (changedTo == "predefined" || changedTo == "default"));
    }, this));
    
    /* Style edit button */
    jQuery("#" + this.prefix + "-style-edit").off("click").on("click", jQuery.proxy(function(evt) {
        var styledef = jQuery("#" + this.prefix + "-style_definition").val();
        if (!styledef) {
            styledef = {"mode": (jQuery("#" + this.prefix + "-style-mode").val() || "default")};
        } else if (typeof styledef == "string") {
            styledef = JSON.parse(styledef);
        }
        this.styler.activate(styledef);
    }, this));
    
    this.populateCannedStylesDropdown();
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.creator.GeoJsonSourceEditor.prototype.writeStyle = function(styledef) {
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
magic.classes.creator.GeoJsonSourceEditor.prototype.populateCannedStylesDropdown = function() {    
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

magic.classes.creator.GeoJsonSourceEditor.prototype.sourceSpecified = function() {
    var sourceUrl = jQuery("#" + this.prefix + "-geojson_source").val();
    var featureName = jQuery("#" + this.prefix + "-feature_name").val();
    var isWfs = sourceUrl.indexOf("/wfs") > 0;
    return((isWfs && sourceUrl && featureName) || (!isWfs && sourceUrl));
};
