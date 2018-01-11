/* Dictionary of layer definitions */

magic.classes.creator.LayerDictionary = function() {
    
    this.dictionary = {};
                
};

magic.classes.creator.LayerDictionary.prototype.get = function(id) {
    return(this.dictionary[id] || {});
};

magic.classes.creator.LayerDictionary.prototype.put = function(o) {
    if (!o.id) {
        o.id = magic.modules.Common.uuid();
    }
    this.dictionary[o.id] = o;
    return(o.id);
};

magic.classes.creator.LayerDictionary.prototype.del = function(id) {
    delete this.dictionary[id];
};
