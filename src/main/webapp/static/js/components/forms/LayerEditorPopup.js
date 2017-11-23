/* Layer edit/upload, implemented as a Bootstrap popover */

magic.classes.LayerEditorPopup = function(options) {
    
    options = jQuery.extent({}, {
        id: "layer-editor-popup-tool",
        styleMode: "default",
        caption: "Edit layer data",
        popoverClass: "layer-editor-popover",
        popoverContentClass: "layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function(payload) {
            this.init(payload);            
        }, this),
        onDeactivate: null
    });    
   
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    });
       
};

magic.classes.LayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.LayerEditorPopup.prototype.constructor = magic.classes.LayerEditorPopup;

magic.classes.LayerEditorPopup.prototype.markup = function() {
    return(
        '<div class="col-sm-12 well well-sm edit-view-fs hidden">' +
            '<div id="' + this.id + '-layer-edit-title" class="form-group form-group-sm col-sm-12"><strong>Upload a new layer</strong></div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-caption">Name</label>' + 
                '<div class="col-sm-8">' + 
                    '<input type="text" id="' + this.id + '-layer-caption" class="form-control" ' + 
                        'placeholder="Layer caption" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-description">Description</label>' + 
                '<div class="col-sm-8">' + 
                    '<textarea id="' + this.id + '-layer-description" class="form-control" ' + 
                        'style="height:8em !important" ' + 
                        'placeholder="Detailed layer description, purpose, content etc" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Longer description of the layer">' +                                           
                    '</textarea>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-mode">Style</label>' + 
                '<div class="form-inline col-sm-8">' + 
                    '<select id="' + this.id + '-layer-style-mode" class="form-control" style="width:80%" ' + 
                        'data-toggle="tooltip" data-placement="top" ' + 
                        'title="Layer styling">' +
                        '<option value="default" default>Default</option>' + 
                        '<option value="file">Use style in file</option>' +
                        '<option value="point">Point style</option>' +
                        '<option value="line">Line style</option>' +
                        '<option value="polygon">Polygon style</option>' +
                    '</select>' + 
                    '<button id="' + this.id + '-layer-style-edit" style="width:20%" data-toggle="popover" data-placement="right" ' + 
                        ' type="button" role="button"class="btn btn-sm btn-primary">Edit</button>' +
                '</div>' + 
            '</div>' +                    
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-allowed_usage">Share</label>' + 
                '<div class="col-sm-8">' + 
                    '<select name="' + this.id + '-layer-allowed_usage" id="' + this.id + '-layer-allowed_usage" class="form-control" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Sharing permissions">' +
                        '<option value="owner" default>no</option>' + 
                        '<option value="public">with everyone</option>' +
                        '<option value="login">with logged-in users only</option>' +
                    '</select>' + 
                '</div>' + 
            '</div>' + 
            '<div id="publish-files-dz" class="dropzone col-sm-12">' +                        
            '</div>' +                    
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<label class="col-sm-4 control-label">Modified</label>' + 
                '<div class="col-sm-8">' + 
                    '<p id="' + this.id + '-layer-last-mod" class="form-control-static"></p>' + 
                '</div>' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                magic.modules.Common.buttonFeedbackSet(this.id, "Publish layer", "xs", "Publish") +                         
                '<button id="' + this.id + '-cancel" class="btn btn-sm btn-danger" type="button" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                    '<span class="fa fa-times-circle"></span> Cancel' + 
                '</button>' +                        
            '</div>' +  
        '</div>'
    );
};

