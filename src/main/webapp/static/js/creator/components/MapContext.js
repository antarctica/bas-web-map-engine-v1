/* Map context object */

magic.classes.creator.MapContext = function() {
    
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
magic.classes.creator.MapContext.prototype.load = function(action, name, callback) {
    if (action == "new") {
        /* New blank map context */
        this.context = jQuery.extend(true, {}, magic.modules.creator.Data.BLANK_MAP_CORE, {"data": magic.modules.creator.Data.BLANK_MAP_DATA(name)});
        this.id = "";
        callback(this.context);
    } else if (name) {
        /* Clone or edit implies a fetch of map with id */
        var fetchUrl = magic.config.paths.baseurl + "/maps/name/" + name;
        jQuery.getJSON(fetchUrl, jQuery.proxy(function (response) {
            this.context = jQuery.extend({}, response);
            if (action == "clone") {
                this.context.name += "_copy";
            }
            this.context.data = JSON.parse(response.data.value);
            this.id = action == "edit" ? this.context.id : "";
            callback(this.context);
        }, this));
    }    
};

magic.classes.creator.MapContext.prototype.getContext = function() {
    return(this.context);
};

magic.classes.creator.MapContext.prototype.getMapId = function() {
    return(this.id);
};

magic.classes.creator.MapContext.prototype.getMapName = function() {
    return(this.context.name);
};

magic.classes.creator.MapContext.prototype.getLayers = function() {
    var layers = [];
    if (this.context.data && jQuery.isArray(this.context.data.layers)) {
        layers = this.context.data.layers;
    }
    return(layers);
};

magic.classes.creator.MapContext.prototype.setLayers = function(layers) {
    if (this.context.data) {
        this.context.data.layers = layers;
    }
};


magic.classes.creator.MapContext.prototype.getProjection = function() {
    var proj = null;
    if (this.context.data) {
        proj = this.context.data.projection;
    }
    return(proj);
};
