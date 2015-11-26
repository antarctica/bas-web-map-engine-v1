/* Map context object */

magic.classes.creator.MapContext = function() {
    
    this.context = {};
        
};

magic.classes.creator.MapContext.prototype.fetchMap = function(action, id, callback) {
    if (action == "new") {
        /* New blank map context */
        this.context = $.extend(true, {}, magic.modules.creator.Data.BLANK_MAP_CORE, {"data": magic.modules.creator.Data.BLANK_MAP_DATA[id]});
        callback(this.context);
    } else {
        /* Clone or edit implies a fetch of map with id */
        $.getJSON(magic.config.paths.baseurl + "/maps/id/" + id, $.proxy(function (data) {
            this.context = data;
            callback(data);
        }, this));
    }    
};

magic.classes.creator.MapContext.prototype.getLayers = function() {
    var layers = [];
    if (this.context.data && $.isArray(this.context.data.layers)) {
        layers = this.context.data.layers;
    }
    return(layers)
};

magic.classes.creator.MapContext.prototype.getProjection = function() {
    var proj = null;
    if (this.context.data) {
        proj = this.context.data.projection;
    }
    return(proj)
};

/**
 * Compute an array of scale denominators from OL resolutions (for human-friendliness!)
 * @param {Array} resArr
 * @returns {Array}
 */
magic.classes.creator.MapContext.prototype.scalesFromResolutions = function(resArr) {
    var scaleArr = [];
    var proj = this.getProjection();
    if (proj) {
        var projOl = ol.proj.get(proj);
        scaleArr = $.map(resArr, function(res, idx) { 
            /* Copied from magic.modules.GeoUtils */
            var units = projOl.getUnits();
            var dpi = 25.4 / 0.28;
            var mpu = ol.proj.METERS_PER_UNIT[units];
            var scale = res * mpu * 39.37 * dpi; /* NB magic numbers */
            return(scale);
        });
    }
    return(scaleArr);
};
