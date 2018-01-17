/* GPX source editor */

magic.classes.creator.GpxSourceEditor = function(options) {
    
    options = jQuery.extend({}, {
        prefix: "gpx-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "gpx_source", "default": ""}
        ]
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(this.init, this)
    }));   
    
    this.styler = null;
                
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

magic.classes.creator.GpxSourceEditor.prototype.init = function() {
    
    /* Create the styler popup dialog */
    this.styler = new magic.classes.StylerPopup({
        target: this.prefix + "-style-edit",
        onSave: jQuery.proxy(this.writeStyle, this)                    
    });
    
    /* Change handler for style mode */
    jQuery("#" + this.prefix + "-style-mode").off("change").on("change", jQuery.proxy(function(evt) {
        var changedTo = jQuery(evt.currentTarget).val();
        jQuery("#" + this.prefix + "-style_definition").val("{\"mode\":\"" + changedTo + "\"}");        
        jQuery("#" + this.prefix + "-style-edit").prop("disabled", changedTo == "default");
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
};

magic.classes.creator.GpxSourceEditor.prototype.sourceSpecified = function() {
    return(jQuery("#" + this.prefix + "-gpx_source").val() ? true : false);    
};

