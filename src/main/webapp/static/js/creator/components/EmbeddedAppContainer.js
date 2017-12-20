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
};

/**
 * Assemble a final map context for saving to database
 */
magic.classes.creator.EmbeddedAppContainer.prototype.saveContext = function() {
    var context = {};
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        jQuery.extend(context, dialog.getContext());
    }, this));
    /* Now validate the assembled map context against the JSON schema in /static/js/json/embedded_web_map_schema.json
     * https://github.com/geraintluff/tv4 is the validator used */            
    jQuery.getJSON(magic.config.paths.baseurl + "/static/js/json/embedded_web_map_schema.json", jQuery.proxy(function(schema) {
        console.log(context);
        console.log("Validated : " + v4.validate(context, schema));            
    }, this))
    .fail(function(xhr, status, err) {
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Failed to retrieve JSON schema for embedded map - details below:</p>' + 
                '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
            '</div>'
        );
    });            
};