/* Map context object */

magic.classes.creator.MapContext = function() {
    
    /* The complete map context object */
    this.context = {};
           
    /* Id of existing map if relevant */
    this.id = "";
        
};

magic.classes.creator.MapContext.prototype.load = function(action, name, callback) {
    if (action == "new") {
        /* New blank map context */
        this.context = jQuery.extend(true, {}, magic.modules.creator.Data.BLANK_MAP_CORE, {"data": magic.modules.creator.Data.BLANK_MAP_DATA(name)});
        this.id = "";
        callback(this.context);
    } else {
        /* Clone or edit implies a fetch of map with id */
        jQuery.getJSON(magic.config.paths.baseurl + "/maps/name/" + name, jQuery.proxy(function (response) {
            this.context = jQuery.extend({}, response);
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

/**
 * Map scale denominator to OL resolution
 * @param {float} scale
 * @returns {float}
 */
magic.classes.creator.MapContext.prototype.scaleToResolution = function(scale) {
    var res = null;
    var proj = this.getProjection();
    if (proj) {
        var projOl = ol.proj.get(proj);
        var units = projOl.getUnits();
        var dpi = 25.4 / 0.28;
        var mpu = ol.proj.METERS_PER_UNIT[units];
        res = scale / (mpu * 39.37 * dpi); /* NB magic numbers */       
    }
    return(res);
};
