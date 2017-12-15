/* Layer editor for embedded maps, implemented as a Bootstrap popover */

magic.classes.creator.EmbeddedLayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-layer-editor",
        caption: "Edit layer data",
        popoverClass: "em-layer-editor-popover",
        popoverContentClass: "em-layer-editor-popover-content"
    }, options);
    
    magic.classes.creator.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "name", "wms_source", "feature_name", "opacity", "is_base", "is_singletile", "is_interactive"];
    
    this.subForms.attributes = null;
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-layer-caption").focus();
        
        this.assignCloseButtonHandler();        
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
    }, this));
       
};

magic.classes.creator.EmbeddedLayerEditorPopup.prototype = Object.create(magic.classes.creator.PopupForm.prototype);
magic.classes.creator.EmbeddedLayerEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedLayerEditorPopup;

magic.classes.creator.EmbeddedLayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-attribute_map"></input>' + 
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-4 control-label" for="' + this.id + '-name">Name</label>' + 
                '<div class="col-sm-8">' + 
                    '<input type="text" id="' + this.id + '-name" class="form-control" ' + 
                        'placeholder="Layer caption" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Layer name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_base" type="checkbox" checked ' +
                            'data-toggle="tooltip" data-placement="bottom" ' + 
                            'title="Layer is a base (backdrop) layer">' + 
                         '</input> This is a base (backdrop) layer' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +    
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_singletile" type="checkbox" checked ' +
                            'data-toggle="tooltip" data-placement="bottom" ' + 
                            'title="Layer should be rendered as a single tile (useful for place-names/rasters where tile edge effects would be noticeable">' + 
                         '</input> Render a single large tile' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +   
            '<div class="form-group form-group-sm col-sm-12">' +
                '<div class="checkbox" style="float:left">' +
                    '<label>' +
                        '<input id="' + this.id + '-is_interactive" type="checkbox" checked ' +
                            'data-toggle="tooltip" data-placement="bottom" ' + 
                            'title="This layer should display interactive pop-ups on the map">' + 
                         '</input> Layer displays interactive map pop-ups' +
                    '</label>' +
                '</div>' +                                            
            '</div>' +   
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<label class="col-sm-4 control-label">Modified</label>' + 
                '<div class="col-sm-8">' + 
                    '<p id="' + this.id + '-last-mod" class="form-control-static"></p>' + 
                '</div>' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                magic.modules.Common.buttonFeedbackSet(this.id, "Publish layer", "sm", "Publish") +                         
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
    jQuery("#" + this.id + "-edit-view-fs :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Attributes checkbox */
    jQuery("#" + this.id + "-is_interactive").change(jQuery.proxy(function(evt) {
        var checked = jQuery(evt.currentTarget).prop("checked");
        
    }, this));
    
    /* Save button */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function() {
        var formdata = this.formToPayload();
        /* Do an update of user layer data */
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/userlayers/update/" + formdata["id"], 
            data: JSON.stringify(formdata), 
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            headers: {
                "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
            }
        })
        .done(jQuery.proxy(function(response) {
            this.cleanForm();
            magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail); 
            if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
                this.controlCallbacks["onSave"]();
            }
            this.delayedDeactivate(2000);                                  
        }, this.lep))
        .fail(function (xhr) {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to save layer data - details below:</p>' + 
                    '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                '</div>'
            );
        });    
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
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
        payload[ip] = jQuery("#" + this.id + "-layer-" + ip).val();
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
        jQuery("#" + this.id + "-layer-" + ip).val(populator[ip] || "");
    }, this));
    var styledef = populator["styledef"] || {"mode": "default"};
    if (typeof styledef === "string") {
        styledef = JSON.parse(styledef);
    }
    /* Last modified */
    var lastMod = jQuery("#" + this.id + "-layer-last-mod");
    if (populator.modified_date) {
        lastMod.closest("div.form-group").removeClass("hidden");
        lastMod.text(magic.modules.Common.dateFormat(populator.modified_date, "dmy"));
    } else {
        lastMod.closest("div.form-group").addClass("hidden");
    }
    /* Set styling mode */
    jQuery("#" + this.id + "-layer-style-mode").val(styledef["mode"]);
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
