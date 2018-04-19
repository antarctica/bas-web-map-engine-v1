/* Layer edit/upload, implemented as a Bootstrap popover */

magic.classes.LayerEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "layer-editor-popup-tool",
        caption: "Edit layer data",
        popoverClass: "layer-editor-popover",
        popoverContentClass: "layer-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    this.inputs = ["id", "caption", "description", "allowed_usage", "styledef"];
    
    this.subForms.styler = null;
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        
        jQuery("#" + this.id + "-layer-caption").focus();
        
        this.savedState = {};
        this.assignCloseButtonHandler();
        
        /* Create the styler popup dialog */
        this.subForms.styler = new magic.classes.StylerPopup({
            target: this.id + "-layer-style-edit",
            onSave: jQuery.proxy(this.writeStyle, this)                    
        });
        
        this.payloadToForm(this.prePopulator);
        this.assignHandlers(this.prePopulator);
        this.restoreState();
        this.initDropzone();
    }, this));
       
};

magic.classes.LayerEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.LayerEditorPopup.prototype.constructor = magic.classes.LayerEditorPopup;

magic.classes.LayerEditorPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm">' +
            '<input type="hidden" id="' + this.id + '-layer-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-layer-styledef"></input>' +
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
                    '<button id="' + this.id + '-layer-style-edit" style="width:20%" data-trigger="manual" data-container="body" data-toggle="popover" data-placement="left" ' + 
                        ' type="button" role="button"class="btn btn-sm btn-primary"><span class="fa fa-pencil"></span></button>' +
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
            magic.modules.Common.buttonFeedbackSet(this.id, "Publish layer", "sm", "Publish", true) +                                                            
        '</div>'
    );
};

magic.classes.LayerEditorPopup.prototype.assignHandlers = function(context) {
    
    var ddStyleMode = jQuery("#" + this.id + "-layer-style-mode");
    var btnStyleEdit = jQuery("#" + this.id + "-layer-style-edit");
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-edit-view-fs :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Change handler for style mode */
    ddStyleMode.change(jQuery.proxy(function(evt) {
        var mode = jQuery(evt.currentTarget).val();
        jQuery("#" + this.id + "-layer-styledef").val("{\"mode\":\"" + mode + "\"}");
        btnStyleEdit.prop("disabled", (mode == "file" || mode == "default"));
    }, this));
    
    /* Style edit button */
    btnStyleEdit.click(jQuery.proxy(function(evt) {
        var styledef = jQuery("#" + this.id + "-layer-styledef").val();
        if (typeof styledef == "string") {
            styledef = JSON.parse(styledef);
        } else if (!styledef) {
            styledef = {"mode": (ddStyleMode.val() || "default")};
        }
        this.subForms.styler.activate(styledef);
    }, this));
    
    /* Cancel button */
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
    
    /* Set the style mode appropriately */
    ddStyleMode.val("default");
    btnStyleEdit.prop("disabled", true);        
    context.styledef = this.subForms.styler.convertLegacyFormats(context.styledef);
    var mode = context.styledef.mode;
    ddStyleMode.val(mode);
    btnStyleEdit.prop("disabled", mode == "predefined" || mode == "default" || mode == "file");
};

/**
 * Callback to write a JSON style into the appropriate hidden input
 * @param {Object} styledef
 */
magic.classes.LayerEditorPopup.prototype.writeStyle = function(styledef) {
    styledef = styledef || {"mode": "default"};
    jQuery("#" + this.id + "-layer-styledef").val(JSON.stringify(styledef));    
};

magic.classes.LayerEditorPopup.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

magic.classes.LayerEditorPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.LayerEditorPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

/**
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.LayerEditorPopup.prototype.formToPayload = function() {
    var payload = {};
    var mode = jQuery("#" + this.id + "-layer-style-mode").val();
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        if (ip == "styledef" && (mode == "default" || mode == "file")) {            
            payload[ip] = "{\"mode\": \"" + mode + "\"}";
        } else {
            payload[ip] = jQuery("#" + this.id + "-layer-" + ip).val();
        }
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.LayerEditorPopup.prototype.payloadToForm = function(populator) {
    populator = populator || {};
    var styledef = this.subForms.styler.convertLegacyFormats(populator["styledef"]);
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        if (ip == "styledef") {
            jQuery("#" + this.id + "-layer-" + ip).val(JSON.stringify(styledef));
        } else {
            jQuery("#" + this.id + "-layer-" + ip).val(populator[ip] || "");
        }
    }, this));        
    /* Last modified */
    var lastMod = jQuery("#" + this.id + "-layer-last-mod");
    if (populator.modified_date) {
        lastMod.closest("div.form-group").removeClass("hidden");
        lastMod.text(magic.modules.Common.dateFormat(populator.modified_date, "dmy"));
    } else {
        lastMod.closest("div.form-group").addClass("hidden");
    }
    /* Set styling mode */
    jQuery("#" + this.id + "-layer-style-mode").val(styledef.mode);
    jQuery("#" + this.id + "-layer-style-edit").prop("disabled", (styledef.mode == "file" || styledef.mode == "default"));
};

/**
 * Validate the edit form
 * @return {Boolean}
 */
magic.classes.LayerEditorPopup.prototype.validate = function() {
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
 * Prevent duplication of dropzone allocation
 */
magic.classes.LayerEditorPopup.prototype.destroyDropzone = function() {
    try {
        Dropzone.forElement("div#publish-files-dz").destroy();
    } catch(e) {}
};

/**
 * Initialise the dropzone for uploading files
 */
magic.classes.LayerEditorPopup.prototype.initDropzone = function() {
    var previewTemplate =             
        '<div class="row col-sm-12">' + 
            '<div class="row col-sm-12">' +
                '<p class="name" data-dz-name style="font-weight:bold"></p>' +                
            '</div>' +
            '<div class="row">' + 
                '<div class="col-sm-4">' +
                    '<p class="size" data-dz-size=""></p>' +
                '</div>' +
                '<div class="col-sm-6 publish-feedback">' +
                    '<div class="progress progress-striped active show" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                        '<div class="progress-bar progress-bar-success" style="width:0%;" data-dz-uploadprogress></div>' +
                    '</div>' +
                    '<div class="publish-feedback-msg hidden">' + 
                    '</div>' + 
                '</div>' +
                '<div class="col-sm-2">' +
                    '<button data-dz-remove class="btn btn-xs btn-danger publish-delete show">' +
                        '<i class="fa fa-trash-o"></i>' +
                        '<span>&nbsp;Delete</span>' +
                    '</button>' +
                    '<button class="btn btn-xs btn-success publish-success hidden">' +
                        '<i class="fa fa-check"></i>' +
                        '<span>&nbsp;Publish ok</span>' +
                    '</button>' +
                    '<button class="btn btn-xs btn-warning publish-error hidden">' +
                        '<i class="fa fa-times"></i>' +
                        '<span>&nbsp;Publish failed</span>' +
                    '</button>' +
                '</div>' +   
            '</div>' + 
            '<div class="row col-sm-12">' + 
                '<strong class="error text-danger" data-dz-errormessage></strong>' + 
            '</div>' + 
        '</div>';
    var lep = this;
    var saveBtn = jQuery("#" + this.id + "-go");
    this.destroyDropzone();    
    new Dropzone("div#publish-files-dz", {
        url: magic.config.paths.baseurl + "/userlayers/save",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 100,  /* Maximum file size, in MB */
        uploadMultiple: false,        
        autoProcessQueue: false,
        maxFiles: 1,
        parallelUploads: 1,
        previewTemplate: previewTemplate,
        headers: {
            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
        },
        init: function () {
            this.on("complete", jQuery.proxy(function(file) {
                var response = JSON.parse(file.xhr.responseText);                
                if (response.status < 400) {
                    /* Successful save */
                    this.lep.cleanForm();
                    magic.modules.Common.buttonClickFeedback(this.lep.id, true, response.detail);
                    if (jQuery.isFunction(this.lep.controlCallbacks["onSave"])) {
                        this.lep.controlCallbacks["onSave"]();
                    }
                    this.lep.delayedDeactivate(2000);
                } else {
                    /* Failed to save */
                    magic.modules.Common.showAlertModal("Failed to save user layer data - details : " + response.detail, "warning");                    
                }
                this.pfdz.removeAllFiles();
            }, {pfdz: this, lep: lep})); 
            this.on("maxfilesexceeded", function(file) {
                this.removeAllFiles();
                this.addFile(file);
            });
            this.on("addedfile", function(file) {
                jQuery("div#publish-files-dz").find("p.name").html(file.name);
            });
            this.on("error", jQuery.proxy(function() {
                window.setTimeout(jQuery.proxy(this.removeAllFiles, this), 3000);
            }, this));
            /* Save button */
            saveBtn.off("click").on("click", jQuery.proxy(function() {            
                /* Indicate any invalid fields */                
                if (this.lep.validate()) {                   
                    var formdata = this.lep.formToPayload();                    
                    if (!jQuery.isArray(this.pfdz.files) || this.pfdz.files.length == 0) {
                        /* No upload file, so assume only the other fields are to change and process form data */
                        if (formdata["id"]) {
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
                                var msg;
                                try {
                                    msg = JSON.parse(xhr.responseText)["detail"];
                                } catch(e) {
                                    msg = xhr.responseText;
                                }
                                magic.modules.Common.showAlertModal("Failed to save user layer data - details : " + msg, "warning");                                 
                            });    
                        } else {
                            magic.modules.Common.showAlertModal("No uploaded file found - please specify the data to upload", "warning");                            
                        }
                    } else {
                        /* Uploaded file present, so process via DropZone */
                        /* Add the other form parameters to the dropzone POST */                    
                        this.pfdz.on("sending", function(file, xhr, data) { 
                            jQuery.each(formdata, function(key, val) {
                                data.append(key, val);
                            });      
                        });
                        this.pfdz.processQueue();
                    }
                } else {
                    magic.modules.Common.showAlertModal("Please correct the marked errors in your input and try again", "error");
                }            
            }, {pfdz: this, lep: lep}));
        },
        accept: function (file, done) {
            switch (file.type) {
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/gpx+xml":
                case "application/vnd.google-earth.kml+xml":
                case "application/zip":
                case "application/x-zip-compressed":
                    break;
                case "":
                    /* Do some more work - GPX (and sometimes KML) files routinely get uploaded without a type */
                    if (file.name.match(/\.gpx$/) != null) {
                        file.type = "application/gpx+xml";
                    } else if (file.name.match(/\.kml$/) != null) {
                        file.type = "application/vnd.google-earth.kml+xml";
                    } else {
                        done(this.options.dictInvalidFileType);
                        return;
                    }
                    break;
                default:
                    done(this.options.dictInvalidFileType);
                    return;
            }
            done();
        },
        dictDefaultMessage: "Upload GPX, KML, CSV or zipped Shapefiles by dragging and dropping them here",
        dictInvalidFileType: "Not a GPX, KML, CSV or zipped Shapefile",
        dictFileTooBig: "File is too large ({{filesize}} bytes) - maximum size is {{maxFileSize}}",
        dictResponseError: "Publication failed - server responded with code {{statusCode}}",
        dictCancelUpload: "Cancel upload",
        dictCancelUploadConfirmation: "Are you sure?"
    });
};
