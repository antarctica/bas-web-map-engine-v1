/* Embedded Map Creator main class */

magic.classes.creator.EmbeddedAppContainer = function() {
    
    /* Initialise the various form dialogs */
    this.dialogs = {        
        "metadataForm": new magic.classes.creator.MapMetadataForm({}),
        "mapLayerSelector": new magic.classes.creator.MapLayerSelector({}),
        "mapParameterSelector": new magic.classes.creator.MapParameterSelector({})
    };
    
    /* Master region selector (may load a map context here if a search string exists) */
    this.regionSelector = new magic.classes.creator.MapRegionSelector({
        "contextLoader": jQuery.proxy(this.loadContext, this),
        "mapTitleService": magic.config.paths.baseurl + "/embedded_maps/dropdown",
        "mapDataService": magic.config.paths.baseurl + "/maps/name"
    });
        
};

/**
 * Callback to load a map context 
 * @param {Object} mapContext
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 */
magic.classes.creator.EmbeddedAppContainer.prototype.loadContext = function(mapContext, region) {
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        dialog.loadContext(mapContext, region);
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
            console.log(context);
            var validated = tv4.validate(context, schema);               
            console.log("Validated : " + validated);       
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
            }
        }, this))
        .fail(function(xhr, status, err) {
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