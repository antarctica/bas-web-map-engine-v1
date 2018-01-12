/* KML source editor */

magic.classes.creator.KMLSourceEditor = function(options) {
    
    /* Identifier */
    this.prefix = options.prefix;
    
    /* Pre-populator object */
    this.sourceContext = options.sourceContext;
    
    /* Map region working in */
    this.region = options.region;
                
};

magic.classes.creator.KMLSourceEditor.prototype.markup = function() {
    return("");
};

