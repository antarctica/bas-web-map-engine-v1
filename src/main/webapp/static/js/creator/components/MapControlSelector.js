/* Map Creator control selector class */

magic.classes.creator.MapControlSelector = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "control-selector";
   
};

/**
 * Populate the map layer tree according the given data/region
 * @param {Object} context
 * @param (String} region
 */
magic.classes.creator.MapControlSelector.prototype.loadContext = function(context, region) {
    //TODO
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapControlSelector.prototype.getContext = function() {
    //TODO
    return({});    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapControlSelector.prototype.validate = function() {               
    var ok = true;
    //TODO   
    return(ok);
};