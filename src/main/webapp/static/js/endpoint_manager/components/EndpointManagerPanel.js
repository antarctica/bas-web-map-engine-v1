/* WMS Endpoint Manager panel */

magic.classes.endpoint_manager.EndpointManagerPanel = function () {
    
    this.prefix = "endpoint-manager";
       
    this.searchForm = jQuery("#" + this.prefix + "-searchform");
    this.searchSelect = jQuery("#" + this.prefix + "-search");
    
    this.updateForm = jQuery("#" + this.prefix + "-update-form");
    
    /* Update form fields */
    this.updateFormFields = [
        {"field": "id", "default": ""}, 
        {"field": "coast_layers", "default": ""},
        {"field": "graticule_layer", "default": ""}, 
        {"field": "low_bandwidth", "default": false}, 
        {"field": "name", "default": ""},
        {"field": "url", "default": ""},
        {"field": "proxied_url", "default": ""},
        {"field": "rest_endpoint", "default": ""},
        {"field": "url_aliases", "default": "", "plugin": "tagsinput"},
        {"field": "location", "default": ""}, 
        {"field": "srs", "default": "", "plugin": "multiselect"}, 
        {"field": "has_wfs", "default": true}, 
        {"field": "is_user_service", "default": false}
    ];
    
    this.pluginFields = {};
    jQuery.each(
        jQuery.grep(this.updateFormFields, function(elt) {
            return("plugin" in elt);
        }, false), 
        jQuery.proxy(function(idx, fdef) {
            switch(fdef.plugin) {
                case "tagsinput":
                    this.pluginFields[fdef.field] = new magic.classes.TagsInput({id: this.prefix + "-" + fdef.field});
                    break;
                case "multiselect":
                    this.pluginFields[fdef.field] = new magic.classes.MultiSelectInput({id: this.prefix + "-" + fdef.field});
                    break;
                default:
                    break;
            }
        }, this)
    );
    
    this.buttons = {
        "create": jQuery("#" + this.prefix + "-btn-create"),
        "update": jQuery("#" + this.prefix + "-btn-update"),
        "delete": jQuery("#" + this.prefix + "-btn-delete"),
        "cancel": jQuery("#" + this.prefix + "-btn-cancel")
    };
    
    /* ID of the currently selected endpoint */
    this.selectedEndpointId = null;
    
    /* If user has made any changes to the form (for confirmation) */
    this.formDirty = false;
    
    /* Determine when there has been a form change */
    this.updateForm.find(":input:not(:button)").on("change keyup", jQuery.proxy(function() {
        this.buttons["update"].prop("disabled", false);
        this.formDirty = true;
    }, this)); 
    
    /* Search selection handler */
    this.searchSelect.on("change", jQuery.proxy(function(evt) {
        if (this.formDirty) {
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">You have unsaved changes - proceed?</div>', jQuery.proxy(function (result) {
                this.getEndpointData(this.searchSelect.val());
            }, this));
        } else {
            this.getEndpointData(this.searchSelect.val());
        }
    }, this));
    
    this.buttons["create"].on("click", jQuery.proxy(this.createHandler, this));
    this.buttons["update"].on("click", jQuery.proxy(this.updateHandler, this));
    this.buttons["delete"].on("click", jQuery.proxy(this.deleteHandler, this));
    this.buttons["cancel"].on("click", jQuery.proxy(this.cancelHandler, this));
    
    this.loadEndpoints(jQuery.proxy(this.resetForm, this));
    
};

/**
 * Get data for endpoint by id
 * @param {int} id
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.getEndpointData = function(id) {
    jQuery.getJSON(magic.config.paths.baseurl + "/endpoints/get/" + id, jQuery.proxy(function(data) {
        this.payloadToForm(data);
        this.setButtonStatuses({
            "create": true,
            "update": false,
            "delete": true,
            "cancel": true
        });
        this.selectedEndpointId = data.id;
    }, this))
    .fail(jQuery.proxy(function(xhr) {
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Failed to load endpoint with id ' + id + ':</p>' + 
                '<p>' + this.alertResponse(xhr) + '</p>' + 
            '</div>'
        );
    }, this));
};

/**
 * Handle create
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.createHandler = function() {
    this.resetForm();
};

/**
 * Handle create/update of endpoint data
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.updateHandler = function() {
    var saveUrl = magic.config.paths.baseurl + "/endpoints/" + (this.selectedEndpointId == null ? "save" : "update/" + this.selectedEndpointId);
    console.log(JSON.stringify(this.formToPayload()));
//    jQuery.ajax({
//        url: saveUrl, 
//        data: JSON.stringify(this.formToPayload()), 
//        method: "POST",
//        dataType: "json",
//        contentType: "application/json",
//        headers: {
//            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
//        },
//        success: jQuery.proxy(function(data) {
//            //TODO           
//        }, this),
//        fail: jQuery.proxy(function(xhr) {
//            this.buttonClickFeedback("delete", true, this.alertResponse(xhr));  
//        }, this)
//    });
};

/**
 * Handle cancel
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.cancelHandler = function() {
    this.resetForm();
};

/**
 * Handle deletion of an endpoint
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.deleteHandler = function() {
    if (this.selectedEndpointId != null) {
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Really delete this endpoint?</div>', jQuery.proxy(function (result) {
            if (result) {
                /* Do the thumbnail removal */
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/endpoints/delete/" + this.selectedEndpointId,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                        var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(jQuery.proxy(function() {
                    this.buttonClickFeedback("delete", true, "Successfully deleted endpoint");
                    this.loadEndpoints(jQuery.proxy(this.resetForm, this));
                }, this))
                .fail(jQuery.proxy(function(xhr) {
                    this.buttonClickFeedback("delete", true, this.alertResponse(xhr));
                }, this));
            }
        }, this));
    }
};

/**
 * Load the endpoints into the search list
 * @param {Function} callback
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.loadEndpoints = function(callback) {
    jQuery.getJSON(magic.config.paths.baseurl + "/endpoints/dropdown", jQuery.proxy(function (data) {
        if (jQuery.isArray(data)) {
            magic.modules.Common.populateSelect(this.searchSelect, data, "id", "name", "", true);            
        } else {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Malformed data received while loading endpoints - server may be down?</p>' + 
                '</div>'
            );
        }        
        if (jQuery.isFunction(callback)) {
            callback();
        }
    }, this))
    .fail(jQuery.proxy(function(xhr) {
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Error loading endpoints:</p>' + 
                '<p>' + this.alertResponse(xhr) + '</p>' + 
            '</div>'
        );
    }, this));
};

/**
 * Reset the form and zero settings
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.resetForm = function() {
    this.selectedEndpointId = null;
    this.searchForm.get(0).reset();
    this.updateForm.get(0).reset();
    /* Reset above doesn't zero this one for some reason */
    jQuery("#" + this.prefix + "-location").val("");
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        pf.reset();
    }, this));
    magic.modules.Common.resetFormIndicators();
    this.setButtonStatuses();
    this.formDirty = false;
};

/**
 * JSON payload to form
 * @param {Object} payload
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.payloadToForm = function(payload) {
    magic.modules.Common.jsonToForm(jQuery.grep(this.updateFormFields, function(elt) {
        return("plugin" in elt);
    }, true), payload, this.prefix);
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        pf.setValue(payload[key]);
    }, this));
};

/**
 * Form to JSON payload
 * @return {Object}
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.formToPayload = function() {
    var payload = magic.modules.Common.formToJson(jQuery.grep(this.updateFormFields, function(elt) {
        return("plugin" in elt);
    }, true), this.prefix);
    /* Set plugin values */
    jQuery.each(this.pluginFields, jQuery.proxy(function(key, pf) {
        payload[key] = pf.getValue();
    }, this));
    /* Low bandwidth option */
    payload["low_bandwidth"] = payload["location"] != "cambridge";
    return(payload);
};


/**
 * Set the button disabled statuses
 * @param {Object} settings
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.setButtonStatuses = function(settings) {
    if (!settings || jQuery.isEmptyObject(settings)) {
        settings = {
            "create": true,
            "update": false, 
            "delete": false,
            "cancel": true
        };
    }
    jQuery.each(this.buttons, jQuery.proxy(function(btnKey, btn) {
        this.buttons[btnKey].prop("disabled", settings[btnKey] !== true);
    }, this));
};

/**
 * Assemble an alert message for an Ajax fail
 * @param {XmlHttpRequest} xhr
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.alertResponse = function(xhr) {
    var detail = xhr.responseText;
    try {
        detail = JSON.parse(xhr.responseText)["detail"];                    
    } catch(e) {                    
    }
    return(detail);
};

/**
 * Give feedback about success or otherwise of a CRUD operation
 * @param {String} key
 * @param {boolean} success
 * @param {String} msg
 */
magic.classes.endpoint_manager.EndpointManagerPanel.prototype.buttonClickFeedback = function(key, success, msg) {
    var effect;
    this.buttons[key].hide();
    /* See https://api.jquery.com/promise/ for queuing up animations like this */
    var fbBtn = jQuery("#" + this.buttons[key].attr("id") + (success ? "-ok" : "-fail"));
    fbBtn.attr("data-original-title", msg).tooltip("fixTitle");
    effect = function(){return(fbBtn.fadeIn(300).delay(1200).fadeOut(300))};                                                          
    jQuery.when(effect()).done(function() {
        this.buttons[key].show();                            
    });                        
};