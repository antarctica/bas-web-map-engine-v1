/* Map Creator map layer tree selector class */

magic.classes.creator.MapLayerSelectorTree = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "map-layers";
    
    /* Dictionary of layer data, indexed by layer id */
    this.layerDictionary = new magic.classes.creator.LayerDictionary();
   
};

/**
 * Populate the map layer tree according the given data/region
 * @param {Object} context
 * @param (String} region
 */
magic.classes.creator.MapLayerSelectorTree.prototype.loadContext = function(context, region) {
    var layers = [];
    try {
        layers = JSON.parse(context.data.value).layers;
    } catch(e) {}
    if (layers.length > 0) {
        /* Load the layer data */
        this.processLayers(layers, jQuery("#" + this.prefix + "-layertree"), 0);
        /* Assign handlers for expand/collapse layer groups */
    }
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.getContext = function() {
    //TODO
    return({});    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.validate = function() {               
    var ok = true;
    //TODO   
    return(ok);
};

/**
 * Recursive routine to create list infrastructure for layer tree and to assign random ids
 * @param {Array} layers
 * @param {Element} parent
 * @param {int} level
 */
magic.classes.creator.MapLayerSelectorTree.prototype.processLayers = function(layers, parent, level) {    
    for (var i = 0; i < layers.length; i++) {
        var id = this.layerDictionary.put(layers[i]);                
        if (jQuery.isArray(layers[i].layers) && layers[i].layers.length > 0) {
            /* A layer group */
            var groupEl = this.groupElement(id, layers[i].name);
            parent.append(groupEl);
            this.processLayers(layers[i].layers, groupEl.children("ul"), level+1);
        } else {
            /* A leaf node */   
            parent.append(this.layerElement(id, layers[i].name));                    
        }
    }
};

/**
 * Element from markup for a new layer group
 * @param {String} id
 * @param {String} name
 * @return {element}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.groupElement = function(id, name) {
    return(jQuery(
        '<li class="list-group-item list-group-item-heading" id="' + id + '">' + 
            '<div class="btn-group btn-group-justified" role="group">' + 
                '<div class="btn-group layer-group-collapser" style="width:7%">' + 
                    '<button type="button" class="btn btn-info"><i class="fa fa-minus"></i></button>' + 
                '</div>' + 
                '<div class="btn-group" style="width:93%">' + 
                    '<button type="button" class="btn btn-info layer-name-button" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Click to update layer group data">' + 
                        name + 
                    '</button>' +
                '</div>' + 
            '</div>' + 
            '<ul class="list-group"></ul>' + 
        '</li>')
    );
};

magic.classes.creator.MapLayerSelectorTree.prototype.layerElement = function(id, name) {
    return(jQuery(
        '<li class="list-group-item list-group-item-info" id="' + id + '">' + 
            '<div>' + 
                '<button type="button" class="btn btn-info layer-name-button" style="width:100%" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Click to update layer data">' + 
                    name + 
                '</button>' + 
            '</div>' +     
        '</li>')
    );
};