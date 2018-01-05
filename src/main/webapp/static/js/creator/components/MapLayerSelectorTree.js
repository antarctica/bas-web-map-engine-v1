/* Map Creator map layer tree selector class */

magic.classes.creator.MapLayerSelectorTree = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "layer-selector-tree";
   
};

/**
 * Populate the map layer tree according the given data/region
 * @param {Object} context
 * @param (String} region
 */
magic.classes.creator.MapLayerSelectorTree.prototype.loadContext = function(context, region) {
    //TODO
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.getContext = function() {
    //TODO
    return({});    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.validate = function() {               
    var ok = true;
    //TODO   
    return(ok);
};