/* WMS Endpoint Manager panel */

magic.classes.endpoint_manager.EndpointManagerPanel = function () {
    
    this.prefix = "endpoint-manager";
       
    this.searchForm = jQuery("#endpoint-searchform");
    this.searchSelect = jQuery("#endpoint-search");
    
    this.updateForm = jQuery("#" + this.prefix + "-update-form");
    
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
    jQuery("[id^='" + this.prefix + "']").filter(":input").on("change keyup", jQuery.proxy(function() {
        this.buttons["update"].prop("disabled", false);
        this.formDirty = true;
    }, this)); 
    
    this.buttons["create"].on("click", this.createHandler);
    this.buttons["update"].on("click", this.updateHandler);
    this.buttons["delete"].on("click", this.deleteHandler);
    this.buttons["cancel"].on("click", this.cancelHandler);
    
    this.loadEndpoints(jQuery.proxy(this.resetForm, this));
    
};

magic.classes.endpoint_manager.prototype.deleteHandler = function(evt) {
    bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Really delete this endpoint?</div>', jQuery.proxy(function (result) {
        if (result) {
            /* Do the thumbnail removal */
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/endpoints/delete/",
                method: "DELETE",
                beforeSend: function (xhr) {
                    var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                    var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                    xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                }
            })
            .done(jQuery.proxy(function() {
                this.resetForm();
            }, this))
            .fail(this.showAlert);
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }
    }, this));
};

/**
 * Load the endpoints into the search list
 * @param {Function} callback
 */
magic.classes.endpoint_manager.prototype.loadEndpoints = function(callback) {
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
    .fail(this.showAlert);
};

/**
 * Reset the form and zero settings
 */
magic.classes.endpoint_manager.prototype.resetForm = function() {
    this.selectedEndpointId = null;
    this.searchForm.get(0).reset();
    magic.modules.Common.resetFormIndicators();
    this.setButtonStatuses();
};

/**
 * Set the button disabled statuses
 * @param {Object} settings
 */
magic.classes.endpoint_manager.prototype.setButtonStatuses = function(settings) {
    if (!settings || jQuery.isEmptyObject(settings)) {
        settings = {
            "create": true,
            "update": false, 
            "delete": false,
            "cancel": true
        };
    }
    jQuery.each(this.buttons, jQuery.proxy(function(btnKey, btn) {
        this.buttons[btnKey].prop("disabled", settings[btnKey] === true);
    }, this));
};

/**
 * Show an alert for an Ajax fail
 * @param {XmlHttpRequest} xhr
 */
magic.classes.endpoint_manager.prototype.showAlert = function(xhr) {
    var detail = xhr.responseText;
    try {
        detail = JSON.parse(xhr.responseText)["detail"];                    
    } catch(e) {                    
    }
    bootbox.alert(
        '<div class="alert alert-warning" style="margin-bottom:0">' + 
            '<p>An error occurred while performing this operation - details below:</p>' + 
            '<p>' + detail + '</p>' + 
        '</div>'
    );
};