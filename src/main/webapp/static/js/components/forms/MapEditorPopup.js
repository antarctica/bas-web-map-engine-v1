/* User map edit/upload, implemented as a Bootstrap popover */

magic.classes.MapEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "map-editor-popup-tool",
        caption: "Edit map data",
        popoverClass: "map-editor-popover",
        popoverContentClass: "map-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "basemap", "name", "allowed_usage", "data"];
       
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-map-name").focus();
        
        this.savedState = {};
        this.assignCloseButtonHandler();
       
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
        this.restoreState();
    }, this));
       
};

magic.classes.MapEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.MapEditorPopup.prototype.constructor = magic.classes.MapEditorPopup;

magic.classes.MapEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm">' +
            '<input type="hidden" id="' + this.id + '-map-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-map-data"></input>' +
            '<div class="form-group form-group-sm col-sm-12">' +                     
                '<label class="col-sm-3" for="' + this.id + '-name">Name</label>' + 
                '<div class="col-sm-9">' + 
                    '<input type="text" name="' + this.id + '-map-name" id="' + this.id + '-name" class="form-control" ' + 
                        'placeholder="Map name" maxlength="100" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Map name (required)" ' + 
                        'required="required">' +
                    '</input>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-3" for="' + this.id + '-allowed_usage">Share</label>' + 
                '<div class="col-sm-9">' + 
                    '<select name="' + this.id + '-map-allowed_usage" id="' + this.id + '-allowed_usage" class="form-control" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Sharing permissions">' +
                        '<option value="owner" default>no</option>' + 
                        '<option value="public">with everyone</option>' +
                        '<option value="login">with logged-in users only</option>' +
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<label class="col-sm-3 control-label">Modified</label>' + 
                '<div class="col-sm-9">' + 
                    '<p id="' + this.id + '-map-last-mod" class="form-control-static"></p>' + 
                '</div>' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                magic.modules.Common.buttonFeedbackSet(this.id, "Save map state", "sm") +                         
                '<button id="' + this.id + '-cancel" class="btn btn-sm btn-danger" type="button" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                    '<span class="fa fa-times-circle"></span> Cancel' + 
                '</button>' +                        
            '</div>' +  
        '</div>'
    );
};

magic.classes.MapEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
   
    /* Save button */
    jQuery("#" + this.id + "go").click(jQuery.proxy(function() { 
        if (this.validate()) {
            var formdata = this.formToPayload();
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/usermaps/" + (formdata.id ? "update/" + formdata.id : "save"), 
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
                this.delayedDeactivate(2000);
                this.init();
            }, this))
            .fail(function (xhr) {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to save user map - details below:</p>' + 
                        '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                    '</div>'
                );
            });    
        } else {
            bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Please correct the marked errors in your input and try again</div>');
        }               
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

magic.classes.MapEditorPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.MapEditorPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.MapEditorPopup.prototype.formToPayload = function() {
    var payload = {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {        
        payload[ip] = jQuery("#" + this.id + "-map-" + ip).val();
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.MapEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-map-" + ip).val(populator[ip] || "");
    }, this));    
    /* Last modified */
    var lastMod = jQuery("#" + this.id + "-map-last-mod");
    if (populator.modified_date) {
        lastMod.closest("div.form-group").removeClass("hidden");
        lastMod.text(magic.modules.Common.dateFormat(populator.modified_date, "dmy"));
    } else {
        lastMod.closest("div.form-group").addClass("hidden");
    }   
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.MapEditorPopup.prototype.validate = function() {
    var ok = true;
    var nameInput = jQuery("#" + this.id + "-name");
    if (nameInput[0].checkValidity() === false) {
        nameInput.closest("div.form-group").addClass("has-error");
        ok = false;
    } else {
        nameInput.closest("div.form-group").removeClass("has-error");
    }
    return(ok);
};                  
