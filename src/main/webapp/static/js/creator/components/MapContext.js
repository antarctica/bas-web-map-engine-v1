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
