/* Embedded Map Creator main class */

magic.classes.embedded_creator.AppContainer = function(endpoints) {
    
    /* Data endpoints for this application */
    this.endpoints = endpoints;            
    
    /* Initialise the various dialogs */
    this.dialogs = {
        "regionSelector": new magic.classes.embedded_creator.MapRegionSelector({
            "contextLoader": jQuery.proxy(this.loadContext, this)
        }),
        "metadataForm": new magic.classes.embedded_creator.MapMetadataForm(),
        "mapLayerSelector": new magic.classes.embedded_creator.MapLayerSelector(),
        "mapParameterSelector": new magic.classes.embedded_creator.MapParameterSelector()
    };
        
};

/**
 * Callback to load a map context 
 * @param {type} mapContext
 * @return {undefined}
 */
magic.classes.embedded_creator.AppContainer.prototype.loadContext = function(mapContext) {
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        dialog.loadContext(mapContext);
    }, this));
};