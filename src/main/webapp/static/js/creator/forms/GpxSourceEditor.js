/* GPX source editor */

magic.classes.creator.GpxSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "gpx-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "gpx_source", "default": ""},
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

magic.classes.creator.GpxSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.GpxSourceEditor.prototype.constructor = magic.classes.creator.GpxSourceEditor;

magic.classes.creator.GpxSourceEditor.prototype.markup = function() {
    return(
        '<input type="hidden" name="' + this.prefix + '-style_definition" id="' + this.prefix + '-style_definition"></input>' + 
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-gpx_source" class="col-md-3 control-label">Feed URL</label>' + 
            '<div class="col-md-9">' + 
                '<input type="url" class="form-control" id="' + this.prefix + '-gpx_source" name="' + this.prefix + '-gpx_source" ' +  
                       'placeholder="URL of GPX source" required="required" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Source URL for GPX feed">' +                                    
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

magic.classes.creator.GpxSourceEditor.prototype.init = function(context) {    
    this.setStyleHandlers(context);    
    magic.modules.Common.jsonToForm(this.formSchema, context, this.prefix);
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.creator.GpxSourceEditor.prototype.writeStyle = function(styledef) {
    if (!styledef) {        
        styledef = {"mode": "default"};
    }
    jQuery("#" + this.prefix + "-style_definition").val(JSON.stringify(styledef));
    jQuery("#" + this.prefix + "-style-edit").prop("disabled", styledef.mode == "default");
    
    if (jQuery.isFunction(this.controlCallbacks.onSaveContext)) {
        this.controlCallbacks.onSaveContext();
    }
};

magic.classes.creator.GpxSourceEditor.prototype.sourceSpecified = function() {
    return(magic.modules.Common.isUrl(jQuery("#" + this.prefix + "-gpx_source").val()));    
};

magic.classes.creator.GpxSourceEditor.prototype.validate = function() {
    magic.modules.Common.resetFormIndicators();
    if (this.sourceSpecifed()) {
        return(true);
    } else {
        magic.modules.Common.flagInputError(jQuery("#" + this.prefix + "-gpx_source"));
        return(false);
    }
};

