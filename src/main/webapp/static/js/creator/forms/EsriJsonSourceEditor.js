/* ESRI JSON source editor */

magic.classes.creator.EsriJsonSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "esrijson-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "esrijson_source", "default": ""},
            {"field": "layer_title", "default": ""},
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

magic.classes.creator.EsriJsonSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.EsriJsonSourceEditor.prototype.constructor = magic.classes.creator.EsriJsonSourceEditor;

magic.classes.creator.EsriJsonSourceEditor.prototype.markup = function() {
    return(
        '<input type="hidden" name="' + this.prefix + '-style_definition" id="' + this.prefix + '-style_definition"></input>' + 
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-esrijson_source" class="col-md-3 control-label"><span class="label label-danger">Feed URL</span></label>' + 
            '<div class="col-md-9">' + 
                '<input type="url" class="form-control" id="' + this.prefix + '-esrijson_source" name="' + this.prefix + '-esrijson_source" ' +  
                       'placeholder="URL of ESRI source" required="required" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Source URL for ArcGIS Online JSON feed">' +                                    
                '</input>' + 
            '</div>' + 
        '</div>' +   
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-layer_title" class="col-md-3 control-label">Layer title</label>' + 
            '<div class="col-md-9">' + 
                '<input type="text" class="form-control" id="' + this.prefix + '-layer_title" name="' + this.prefix + '-layer_title" ' +  
                       'placeholder="Title of operational data layer" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Title of operational layer containing the data - leave blank to use the first available">' +                                    
                '</input>' + 
            '</div>' + 
        '</div>' +   
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.prefix + '-style-mode">Style</label>' +                 
            '<div class="form-inline col-md-9">' + 
                '<select id="' + this.prefix + '-style-mode" class="form-control" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Layer styling">' +
                    '<option value="default" selected="selected">Default</option>' + 
                    '<option value="point">Point style</option>' +
                    '<option value="line">Line style</option>' +
                    '<option value="polygon">Polygon style</option>' +
                '</select>' + 
                '<button id="' + this.prefix + '-style-edit" data-trigger="manual" data-container="body" data-toggle="popover" data-placement="left" ' + 
                    ' type="button" role="button"class="btn btn-md btn-primary" disabled="disabled"><span class="fa fa-pencil"></span>' + 
                '</button>' +
            '</div>' + 
        '</div>'
    );
};

magic.classes.creator.EsriJsonSourceEditor.prototype.init = function(context) {
    this.setStyleHandlers(context);    
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.creator.EsriJsonSourceEditor.prototype.writeStyle = function(styledef) {
    if (!styledef) {
        styledef = {"mode": "default"};
    }
    jQuery("#" + this.prefix + "-style_definition").val(JSON.stringify(styledef));
    jQuery("#" + this.prefix + "-style-edit").prop("disabled", (styledef.mode == "predefined" || styledef.mode == "default"));    
    if (jQuery.isFunction(this.controlCallbacks.onSaveContext)) {
        this.controlCallbacks.onSaveContext();
    }
};

magic.classes.creator.EsriJsonSourceEditor.prototype.sourceSpecified = function() {
    return(magic.modules.Common.isUrl(jQuery("#" + this.prefix + "-esrijson_source").val()));    
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
