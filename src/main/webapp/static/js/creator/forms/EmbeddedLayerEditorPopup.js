/* Layer editor for embedded maps, implemented as a Bootstrap popover */

magic.classes.creator.EmbeddedLayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-layer-editor",
        caption: "Edit layer data",
        popoverClass: "em-layer-editor-popover",
        popoverContentClass: "em-layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
   
    /* Map region => projection */
    this.mapRegion = options.mapRegion;
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "name", "wms_source", "feature_name", "style_name", "opacity", "is_base", "is_singletile", "is_interactive", "attribute_map"];
    
    /* Linked WMS feature select menus */
    this.wmsSelectors = new magic.classes.creator.WmsFeatureLinkedMenus({
        id: this.id,
        mapRegion: this.mapRegion
    });
    
    /* Attribute map editor */
    this.subForms.attributes = null;
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-name").focus();
        
        this.assignCloseButtonHandler();        
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
        this.wmsSelectors.init({
            wms_source: this.prePopulator.wms_source || "",
            feature_name: this.prePopulator.feature_name || "",
            style_name: this.prePopulator.style_name || ""
        });
    }, this));
       
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedLayerEditorPopup;

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-attribute_map"></input>' + 
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-3 control-label" for="' + this.id + '-name">Name</label>' + 
                '<div class="col-sm-9">' + 
                    '<input type="text" id="' + this.id + '-name" class="form-control" ' + 
                        'placeholder="Layer name" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="left" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            this.wmsSelectors.markup() + 
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' +
                    'title="Layer is a base (backdrop) layer">' + 
                    '<label>' +
                        '<input id="' + this.id + '-is_base" type="checkbox">' +                                                        
                         '</input> This is a base (backdrop) layer' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +    
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="Layer renders as a single large tile, useful for place-names or rasters where tile edge effects are noticeable">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_singletile" type="checkbox">' + 
                         '</input> Render a single large tile' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +   
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left" data-toggle="tooltip" data-placement="left" ' + 
                    'title="This layer should display interactive pop-ups on the map">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_interactive" type="checkbox" data-toggle="popover" data-placement="bottom" data-trigger="manual">' +
                         '</input> Layer displays interactive map pop-ups' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +               
            '<div class="form-group form-group-sm col-sm-12">' +
                magic.modules.Common.buttonFeedbackSet(this.id, "Save data", "sm", "Save") +                         
                '<button id="' + this.id + '-cancel" class="btn btn-sm btn-danger" type="button" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                    '<span class="fa fa-times-circle"></span> Cancel' + 
                '</button>' +                        
            '</div>' +  
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
    jQuery("#" + this.id + "-is_interactive").off("change").on("change", jQuery.proxy(function(evt) {
        var checked = jQuery(evt.currentTarget).prop("checked");
        if (this.subForms.attributes && this.subForms.attributes.isActive()) {
            this.subForms.attributes.deactivate();
        }
        if (checked) {            
            this.subForms.attributes = new magic.classes.creator.EmbeddedAttributeEditorPopup({
                target: evt.currentTarget.id,
                wms_source: this.wmsSelectors.getValue("wms_source"),
                feature_name: this.wmsSelectors.getValue("feature_name"),
                onSave: jQuery.proxy(this.saveAttributes, this)
            });
            var am = jQuery("#" + this.id + "-attribute-map").val() || "{}";            
            this.subForms.attributes.activate(JSON.parse(am));
        }
    }, this));
    
    /* Save button */
    jQuery("#" + this.id + "-go").off("click").on("click", jQuery.proxy(function() {
        if (this.validate()) {
            if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                this.controlCallbacks["onSave"](this.formToPayload());
                this.delayedDeactivate(2000); 
            }
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
    var payload = {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        payload[ip] = jQuery("#" + this.id + "-" + ip).val();
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-" + ip).val(populator[ip] || "");
    }, this));    
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
