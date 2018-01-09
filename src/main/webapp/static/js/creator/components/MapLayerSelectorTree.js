/* Map Creator map layer tree selector class */

magic.classes.creator.MapLayerSelectorTree = function(options) {
    
    /* Group opener configuration, to allow dynamic insertion of elements without re-init of the tree */
    this.OPENER_CSS = {
        "display": "inline-block",
        "width": "18px",
        "height": "18px",
        "float": "left",
        "margin-left": "-35px",
        "margin-right": "5px",
        "background-position": "center center",
        "background-repeat": "no-repeat"
    };

    this.OPEN_MARKUP = '<i class="fa fa-plus" style="font-size:20px"></i>';
    this.CLOSE_MARKUP = '<i class="fa fa-minus" style="font-size:20px"></i>';
    
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
        var layerTreeUl = jQuery("#" + this.prefix + "-layertree");
        layerTreeUl.empty();
        this.processLayers(layers, layerTreeUl, 0);
        this.initSortableList(layerTreeUl);
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
 * Initialise the sortable lists plugin for the layer tree
 * @param {element} layerTree
 */
magic.classes.creator.MapLayerSelectorTree.prototype.initSortableList = function(layerTree) {
    /* http://camohub.github.io/jquery-sortable-lists/ */
    layerTree.sortableLists({
        placeholderCss: {"background-color": "#fcf8e3", "border": "2px dashed #fce04e"},
        hintCss: {"background-color": "#dff0d8", "border": "2px dashed #5cb85c"},
        isAllowed: jQuery.proxy(this.allowedDragHandler, this),
        listSelector: "ul",
        listsClass: "list-group",                    
        insertZone: 50,
        opener: {
            active: true,
            as: "html",  
            close: this.CLOSE_MARKUP,
            open: this.OPEN_MARKUP,
            openerCss: this.OPENER_CSS
        },
        ignoreClass: "layer-name-button"
    });
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
            var groupEl = this.groupMarkup(id, layers[i].name);
            parent.append(groupEl);
            this.processLayers(layers[i].layers, groupEl.children("ul"), level+1);
        } else {
            /* A leaf node */   
            parent.append(this.layerMarkup(id, layers[i].name));                    
        }
    }
};

/**
 * Drag sortable element handler - implements logic to decide whether a given drag is allowed
 * @param {Element} elt
 * @param {Object} hint
 * @param {Element} target
 * @returns {Boolean}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.allowedDragHandler = function (elt, hint, target) {
    /* Allowed drag iff target is a group or the top level */
    var allowed = false;
    var dropZone = hint.parents("li").first();
    if (dropZone) {                            
        if (dropZone.length > 0 && dropZone[0].id) {
            /* Only allowed to be dropped within a group */
            allowed = this.layerDictionary.get(dropZone[0].id).layers;
        } else if (dropZone.length == 0) {
            /* Dropped at the top level */
            allowed = true;
        }
    }
    return(allowed);
};

/**
 * Element from markup for a new layer group
 * @param {String} id
 * @param {String} name
 * @return {Element}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.groupMarkup = function(id, name) {   
    var li = jQuery(
        '<li class="list-group-item list-group-item-heading sortableListsClosed" id="' + id + '">' + 
            '<span class="sortableListsOpener"></span>' +
            '<div>' +                       
                '<button type="button" class="btn btn-info btn-sm layer-name-button" data-toggle="tooltip" data-placement="top" title="Click to update layer group data">' + 
                    name + 
                '</button>' + 
            '</div>' + 
            '<ul class="list-group" style="display:none"></ul>' + 
        '</li>'
    );
    /* Unfortunately the sortable lists plugin doesn't allow dynamic addition of items to the tree, just d-n-d re-ordering of existing ones
     * Hence we have copied some of the event handlers here to allow open/close of dynamically added layer groups */
    li.children("span")
        .css(this.OPENER_CSS)
        .off("mousedown").on("mousedown", jQuery.proxy(function(evt) {                    
            if (li.hasClass("sortableListsClosed")) {
                jQuery(evt.currentTarget).html(this.CLOSE_MARKUP);
                li.removeClass("sortableListsClosed").addClass("sortableListsOpen");
                li.children("ul, ol").css("display", "block");
                li.children("div").children(".sortableListsOpener").first().html(this.CLOSE_MARKUP);
            }
            else { 
                jQuery(evt.currentTarget).html(this.OPEN_MARKUP);
                li.removeClass("sortableListsOpen").addClass("sortableListsClosed");
                li.children("ul, ol").css("display", "none");
                li.children("div").children(".sortableListsOpener").first().html(this.OPEN_MARKUP);
            }
            return(false);
    }, this));
    return(li);
};

/**
 * HTML fragment for layer list item
 * @param {String} id
 * @param {String} name
 * @returns {Element}
 */
magic.classes.creator.MapLayerSelectorTree.prototype.layerMarkup = function(id, name) {
    var li = jQuery(
        '<li class="list-group-item list-group-item-info" id="' + id + '">' + 
            '<div>' + 
                '<button type="button" class="btn btn-info btn-sm layer-name-button" data-toggle="tooltip" data-placement="top" title="Click to update layer data">' + 
                    name + 
                '</button>' + 
            '</div>' +     
        '</li>'
    );
    return(li);
};