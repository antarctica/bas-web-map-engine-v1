/* Layer editor for embedded maps, implemented as a Bootstrap popover */

magic.classes.creator.EmbeddedLayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-layer-editor",
        caption: "Edit layer data",
        popoverClass: "em-layer-editor-popover",
        popoverContentClass: "em-layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);    
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name","default": ""},
        {"field": "opacity", "default": 1.0},
        {"field": "is_base", "default": false},            
        {"field": "is_singletile", "default": false},                
        {"field": "is_interactive", "default": false},
        {"field": "is_extent", "default": false},
        {"field": "is_filterable", "default": false}
    ];
    
    /* Linked WMS feature select menus */
    this.wmsSelectors = new magic.classes.creator.WmsFeatureLinkedMenus({
        id: this.id
    });
    
    /* Attribute map editor */
    this.subForms.attributeEditor = null;
    
    /* Repository for layer attributes edited via the above sub-form */
    this.editedAttributes = [];
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-name").focus();
        
        this.editedAttributes = [];
        
        this.assignCloseButtonHandler();                
        this.assignHandlers();                
        this.payloadToForm(this.prePopulator);
    }, this));
       
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedLayerEditorPopup;

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-md-12">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<div class="form-group form-group-md col-md-12">' +                     
                '<label class="col-md-3 control-label" for="' + this.id + '-name">Name</label>' + 
                '<div class="col-md-9">' + 
                    '<input type="text" id="' + this.id + '-name" class="form-control" ' + 
                        'placeholder="Layer name" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            this.wmsSelectors.markup() + 
            '<div class="form-group form-group-md col-md-12">' + 
                '<label for="' + this.id + '-opacity" class="col-md-3 control-label">Opacity</label>' + 
                '<div class="col-md-9">' + 
                    '<input type="number" class="form-control" id="' + this.id + '-opacity" ' + 
                       'placeholder="Layer opacity (0->1)" ' + 
                       'min="0" max="1" step="0.1" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Layer opacity (0.0 = transparent, 1.0 = opaque)" value="1.0">' + 
                    '</input>' + 
                '</div>' + 
            '</div>' +             
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' +
                    'title="Layer is a base (backdrop) layer">' + 
                    '<label>' +
                        '<input id="' + this.id + '-is_base" type="checkbox">' +                                                        
                         '</input> This is a base (backdrop) layer' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +    
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Layer renders as a single large tile, useful for place-names or rasters where tile edge effects are noticeable">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_singletile" type="checkbox">' + 
                         '</input> Render a single large tile' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +   
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="This layer should display interactive pop-ups on the map">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_interactive" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Layer displays interactive map pop-ups' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +        
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Use this layer to determine the starting extent of the map">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_extent" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Determine map extent from layer data' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +     
            '<div class="form-group form-group-md col-md-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Filter this layer via the \'filter\' URL parameter">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_filterable" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Filter this layer via URL parameters' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +     
            magic.modules.Common.buttonFeedbackSet(this.id, "Save data", "sm", "Save", true) +                 
        '</div>'
    );
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").off("change").on("change", jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Attributes checkbox */
    jQuery("#" + this.id + "-is_interactive").off("change").on("change", jQuery.proxy(function(evt, populator) {
        var checked = jQuery(evt.currentTarget).prop("checked");
        if (this.subForms.attributeEditor && this.subForms.attributeEditor.isActive()) {
            this.subForms.attributeEditor.deactivate();
        }
        if (checked) {            
            this.subForms.attributeEditor = new magic.classes.creator.EmbeddedAttributeEditorPopup({
                target: evt.currentTarget.id,
                wms_source: this.wmsSelectors.getValue("wms_source"),
                feature_name: this.wmsSelectors.getValue("feature_name"),
                onSave: jQuery.proxy(this.saveAttributes, this)
            });
            this.subForms.attributeEditor.activate(this.editedAttributes);
        }
    }, this));
    
    /* Save button */
    jQuery("#" + this.id + "-go").off("click").on("click", jQuery.proxy(function() {
        var valid = this.validate();
        if (valid) {
            magic.modules.Common.buttonClickFeedback(this.id, true, "Saved ok");
            if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                this.controlCallbacks["onSave"](this.formToPayload());
                this.delayedDeactivate(2000); 
            }
        } else {
            magic.modules.Common.buttonClickFeedback(this.id, false, "Failed to save - please correct marked errors");
        }     
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").off("click").on("click", jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.formToPayload = function() {
    return(jQuery.extend(true, {},
        magic.modules.Common.formToJson(this.formSchema, this.id), 
        {attribute_map: this.editedAttributes}, 
        this.wmsSelectors.formToPayload()
    ));
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    /* Initialise the linked WMS menus */
    this.wmsSelectors.init({
        wms_source: populator.wms_source || "",
        feature_name: populator.feature_name || "",
        style_name: populator.style_name || ""
    });
    magic.modules.Common.jsonToForm(this.formSchema, populator, this.id);
    if (populator.is_interactive === true) {
        /* Show attribute editor form */
        this.editedAttributes = populator["attribute_map"];
        jQuery("#" + this.id + "-is_interactive").trigger("change");
    }    
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.validate = function() {
    var ok = true;
    var editFs = jQuery("#" + this.id + "-edit-view-fs");
    jQuery.each(editFs.find("input[required='required']"), function(idx, ri) {
        var riEl = jQuery(ri);
        var fg = riEl.closest("div.form-group");
        var vState = riEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error");
        } else {
            fg.addClass("has-error");
            ok = false;
        }
    });
    return(ok);
};    

/**
 * onSave callback for the attribute editor sub-form
 * @param {Object} attrMap
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.saveAttributes = function(attrMap) {
    this.editedAttributes = attrMap;
};
