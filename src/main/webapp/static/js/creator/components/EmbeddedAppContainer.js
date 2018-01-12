/* Embedded Map Creator main class */

magic.classes.creator.EmbeddedAppContainer = function() {
    
    /* Initialise the various form dialogs */
    this.dialogs = {        
        "metadataForm": new magic.classes.creator.MapMetadataForm({
            formSchema: [
                {"field": "id", "default": ""},
                {"field": "name","default": "new_map"},
                {"field": "title", "default": ""},
                {"field": "description", "default": ""},            
                {"field": "owner_email", "default": ""},                
                {"field": "allowed_usage", "default": "public"},
                {"field": "allowed_edit", "default": "login"}
            ]
        }),
        "mapLayerSelector": new magic.classes.creator.MapLayerSelector({}),
        "mapParameterSelector": new magic.classes.creator.MapParameterSelector({})
    };
    
    /* Master region selector (may load a map context here if a search string exists) */
    this.regionSelector = new magic.classes.creator.MapRegionSelector({
        "contextLoader": jQuery.proxy(this.loadContext, this),
        "mapTitleService": magic.config.paths.baseurl + "/embedded_maps/dropdown",
        "mapDataService": magic.config.paths.baseurl + "/embedded_maps/name"
    });
    
    /* Tooltips */                    
    jQuery('[data-toggle="tooltip"]').tooltip({trigger: "hover"});
    /* For dynamic tooltips - http://stackoverflow.com/questions/9958825/how-do-i-bind-twitter-bootstrap-tooltips-to-dynamically-created-elements */
    jQuery("body").tooltip({selector: '[data-toggle="tooltip"]', trigger: "hover"});
                      
};

/**
 * Callback to load a map context 
 * @param {Object} mapContext
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes, required if mapContext not set
 */
magic.classes.creator.EmbeddedAppContainer.prototype.loadContext = function(mapContext, region) { 
    
    if (!mapContext) {
        /* Assumed this is a new map, so create default parameter data */
        if (region) {
            /* Assemble default map context */
            mapContext = {};
            jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
                mapContext = jQuery.extend(mapContext, dialog.defaultData(region));
            }, this));
        } else {
            bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No map context or region data supplied - aborting</div>');
            return;
        }
    }
    
    /* Record global projection */
    magic.runtime.projection = mapContext.projection;
    
    /* Load the context */
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        dialog.loadContext(mapContext);
    }, this));
    
    /* Save map handler */
    var saveBtn = jQuery("#map-save-context");
    saveBtn.closest("div.row").removeClass("hidden");
    saveBtn.off("click").on("click", jQuery.proxy(this.saveContext, this));
};

/**
 * Assemble a final map context for saving to database
 */
magic.classes.creator.EmbeddedAppContainer.prototype.saveContext = function() {
    var valid = true;
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        valid = valid && dialog.validate();
    }, this));
    if (valid) {
        /* Forms were valid */
        var context = {};
        jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
            jQuery.extend(context, dialog.getContext());
        }, this));
        /* Now validate the assembled map context against the JSON schema in /static/js/json/embedded_web_map_schema.json
         * https://github.com/geraintluff/tv4 is the validator used */            
        jQuery.getJSON(magic.config.paths.baseurl + "/static/js/json/embedded_web_map_schema.json", jQuery.proxy(function(schema) {        
            var validated = tv4.validate(context, schema);               
            if (!validated) {
                 /* Failed to validate the data against the schema - complain */
                var validationErrors = JSON.stringify(tv4.error, null, 4);
                bootbox.alert(
                    '<div class="alert alert-danger" style="margin-top:10px">' + 
                        '<p>Failed to validate your map data against the web map schema</p>' + 
                        '<p>Detailed explanation of the failure below:</p>' + 
                        '<p>' + validationErrors + '</p>' + 
                    '</div>'
                );
            } else {
                /* Schema validation was ok */
                var existingId = context.id;
                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/embedded_maps/" + (existingId != "" ? "update/" + existingId : "save"),                        
                    method: "POST",
                    processData: false,
                    data: JSON.stringify(context),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(function(response) {
                    /* Load up example finished map into test bed in a new tab */
                    magic.runtime.serviceUrl = magic.config.paths.baseurl + "/embedded_maps/name/" + context.name;
                    window.open(magic.config.paths.baseurl + "/static/html/test_embed.html");                    
                })
                .fail(function(xhr) {
                    var detail = JSON.parse(xhr.responseText)["detail"];
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to save your map - details below:</p>' + 
                            '<p>' + detail + '</p>' + 
                        '</div>'
                    );
                });
            }
        }, this))
        .fail(function(xhr) {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to retrieve JSON schema for embedded map - details below:</p>' + 
                    '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                '</div>'
            );
        });  
    } else {
        /* Validation errors */
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Please correct the marked fields before resubmitting</p>' + 
            '</div>'
        );
    }
};