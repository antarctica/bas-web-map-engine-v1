/* WMS source editor */

magic.classes.creator.WmsSourceEditor = function(options) {
    
    /* Identifier */
    this.prefix = options.prefix;
    
    /* Pre-populator object */
    this.sourceContext = options.sourceContext;
    
    /* Map region working in */
    this.region = options.region;
                
};

magic.classes.creator.WmsSourceEditor.prototype.markup = function() {
    return("");
};
