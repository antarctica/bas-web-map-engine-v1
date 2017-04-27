/* Embedded map context object */

magic.classes.embedded_creator.MapContext = function() {
    
    /* The complete map context object */
    this.context = {};
           
    /* Id of existing map if relevant */
    this.id = "";
        
};

/**
 * Load a map context
 * @param {string} action (new|edit|clone)
 * @param {string} name
 * @param {Function} callback
 */
magic.classes.embedded_creator.MapContext.prototype.load = function(action, name, callback) {
    if (action == "new") {
        /* New blank map context */
        this.context = jQuery.extend(true, {}, magic.modules.embedded_creator.Data.BLANK_MAP_CORE, magic.modules.embedded_creator.Data.BLANK_MAP_DATA(name));       
        this.id = "";
        callback(this.context);
    } else if (name) {
        /* Clone or edit implies a fetch of map with id */
        var fetchUrl = magic.config.paths.baseurl + "/embedded_maps/name/" + name;
        jQuery.getJSON(fetchUrl, jQuery.proxy(function (response) {
            this.context = jQuery.extend({}, response);
            if (action == "clone") {
                this.context.name += "_copy";
            }
            this.context.layers = JSON.parse(response.layers.value);
            this.id = action == "edit" ? this.context.id : "";
            callback(this.context);
        }, this));
    }    
};

magic.classes.embedded_creator.MapContext.prototype.getContext = function() {
    return(this.context);
};

magic.classes.embedded_creator.MapContext.prototype.getMapId = function() {
    return(this.id);
};

magic.classes.embedded_creator.MapContext.prototype.getMapName = function() {
    return(this.context.name);
};

magic.classes.embedded_creator.MapContext.prototype.getLayers = function() {   
    return(this.context.layers);
};

magic.classes.embedded_creator.MapContext.prototype.setLayers = function(layers) {
    this.context.layers = layers;
};

magic.classes.embedded_creator.MapContext.prototype.getProjection = function() {
    return(this.context.projection);    
};