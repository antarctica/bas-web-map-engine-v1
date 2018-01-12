/* GPX source editor */

magic.classes.creator.GpxSourceEditor = function(options) {
    
    /* Identifier */
    this.prefix = options.prefix;
    
    /* Pre-populator object */
    this.sourceContext = options.sourceContext;
    
    /* Map region working in */
    this.region = options.region;
                
};

magic.classes.creator.GpxSourceEditor.prototype.markup = function() {
    return("");
};

