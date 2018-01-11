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
    
    /* Template for a new group */
    this.BLANK_MAP_NEW_GROUP = {
        "id": null,
        "name": "New layer group",
        "layers": []
    };
    
    /* Template for a new layer */
    this.BLANK_MAP_NEW_LAYER = {            
        "id": null,
        "name": "New layer",
        "source": {
            "wms_source": ""
        }
    };    
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "map-layers";
    
    /* Layer tree container */
    this.layerTreeUl = jQuery("#" + this.prefix + "-layertree");
    
    /* Dictionary of layer data, indexed by layer id */
    this.layerDictionary = new magic.classes.creator.LayerDictionary();
    
    /* Whether we are editing a layer or a group */
    this.currentlyEditing = null;
    
    /* Layer group editor */
    this.layerGroupEditor = new magic.classes.creator.LayerGroupEditor({
        prefix: this.prefix + "-group",
        onSave: jQuery.proxy(this.writeGroupData, this),
        onCancel: jQuery.proxy(this.cancelEdit, this)
    });
    
    /* Layer group editor */
    this.layerEditor = new magic.classes.creator.LayerEditor({
        prefix: this.prefix + "-layer",
        onSave: jQuery.proxy(this.writeLayerData, this),
        onCancel: jQuery.proxy(this.cancelEdit, this)
    });
   
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
        this.layerTreeUl.empty();
        this.processLayers(layers, this.layerTreeUl, 0);        
    }
};

/**
 * Guaranteed to be called when the markup is complete and has been shown
 */
magic.classes.creator.MapLayerSelectorTree.prototype.showContext = function() {
    
    /* Enable drag-n-drop reordering of the layer list */
    this.initSortableList(this.layerTreeUl);
    
    /* New group handler */
    jQuery("#" + this.prefix + "-new-group").off("click").on("click", jQuery.proxy(function(evt) {        
        var id = this.layerDictionary.put(jQuery.extend({}, this.BLANK_MAP_NEW_GROUP));
        var newLi = this.groupMarkup(id, this.layerDictionary.get(id)["name"]);
        this.layerTreeUl.append(newLi);
        newLi.find("button.layer-group-edit").off("click").on("click", jQuery.proxy(this.editHandler, this));
        newLi.find("button.layer-group-delete").off("click").on("click", jQuery.proxy(this.deleteHandler, this));
        this.showEditor(jQuery(evt.currentTarget), true);
    }, this));
    
    /* New layer handler */
    jQuery("#" + this.prefix + "-new-layer").off("click").on("click", jQuery.proxy(function(evt) {
        var id = this.layerDictionary.put(jQuery.extend({}, this.BLANK_MAP_NEW_LAYER));
        var newLi = this.layerMarkup(id, this.layerDictionary.get(id)["name"]);
        this.layerTreeUl.append(newLi);
        newLi.find("button.layer-edit").off("click").on("click", jQuery.proxy(this.editHandler, this));
        newLi.find("button.layer-delete").off("click").on("click", jQuery.proxy(this.deleteHandler, this));
        this.showEditor(jQuery(evt.currentTarget), true);
    }, this));
    
    /* Disable delete buttons for all layer groups which have children (only deletable when empty) */
    jQuery("button.layer-group-delete").each(function(idx, elt) {
        var hasSubLayers = jQuery(elt).closest("li").children("ul").find("li").length > 0;
        jQuery(elt).prop("disabled", hasSubLayers);
    });
    
    /* Delete layer/group buttons */
    jQuery("button.layer-group-delete").off("click").on("click", jQuery.proxy(this.deleteHandler, this));
    
    /* Edit layer/group buttons */
    jQuery("button.layer-group-edit").off("click").on("click", jQuery.proxy(this.editHandler, this));    
    
};

/**
 * Event handler for an edit button click
 * @param {jQuery.Event} evt
 */
magic.classes.creator.MapLayerSelectorTree.prototype.editHandler = function(evt) {
    var editBtn = jQuery(evt.currentTarget);     
    var updatePanel = jQuery("#" + this.prefix + "-update-panel");
    updatePanel.parent().removeClass("hidden");
    updatePanel.show();
    var promptChanged = this.currentlyEditing != null && this.currentlyEditing.isActive() && this.currentlyEditing.isDirty();
    if (promptChanged) {
        bootbox.confirm(
            '<div class="alert alert-danger" style="margin-top:10px">You have unsaved changes - proceed?</div>', 
            jQuery.proxy(function(result) {
                if (result) {
                    this.showEditor(editBtn, false);
                }  
                bootbox.hideAll();
            }, this)); 
    } else {
        this.showEditor(editBtn, false);
    }        
};

/**
 * Event handler for a delete button click
 * @param {jQuery.Event} evt
 */
magic.classes.creator.MapLayerSelectorTree.prototype.deleteHandler = function(evt) {
    var delBtn = jQuery(evt.currentTarget);
    var itemId = delBtn.closest("li").attr("id");
    var itemName = delBtn.parent().children("button").first().text();
    bootbox.confirm(
        '<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + itemName + '</div>', 
        function(result) {
            if (result) {
                /* Do the deletion (assuming any group is empty) */
                jQuery("#" + itemId).remove();
                this.layerDictionary.del(itemId);
                jQuery("#" + this.prefix + "-update-panel").fadeOut("slow");
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }                            
        }); 
};

/**
 * Callback to show actual editor content
 * @param {jQuery.Element} btn
 * @param {boolean} creating
 */
magic.classes.creator.MapLayerSelectorTree.prototype.showEditor = function(btn, creating) {
    var isGroup = btn.hasClass("layer-group-edit");
    if (isGroup) {
        jQuery("#" + this.prefix + "-group-div").removeClass("hidden");
        jQuery("#" + this.prefix + "-layer-div").addClass("hidden");
        this.layerGroupEditor.loadContext(creating ? this.BLANK_MAP_NEW_GROUP : this.layerDictionary.get(btn.closest("li").attr("id")));
        this.currentlyEditing = this.layerGroupEditor;
    } else {
        jQuery("#" + this.prefix + "-layer-div").removeClass("hidden");
        jQuery("#" + this.prefix + "-group-div").addClass("hidden");
        this.layerEditor.loadContext(creating ? this.BLANK_MAP_NEW_LAYER : this.layerDictionary.get(btn.closest("li").attr("id")));
        this.currentlyEditing = this.layerEditor;
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
    return(true);
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
        ignoreClass: "ignore-drag-item"
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
    this.setHintStyle(hint, true);
    var dropZone = hint.parents("li").first();
    if (dropZone) {                            
        if (dropZone.length > 0 && dropZone[0].id) {
            /* Only allowed to be dropped within a group */
            allowed = this.layerDictionary.get(dropZone[0].id).layers;
        } else if (dropZone.length == 0 && !elt.hasClass("list-group-item-info")) {
            /* Dropped at the top level, and not a leaf */
            allowed = true;
        }
    }
    if (!allowed) {
        this.setHintStyle(hint, false);        
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
            '<div class="class="btn-toolbar ignore-drag-item" role="toolbar">' +  
                '<div class="btn-group ignore-drag-item" role="group" style="display:flex">' + 
                    '<button style="flex:1" type="button" class="btn btn-info ignore-drag-item">' + name + '</button>' + 
                    '<button style="width:40px" type="button" class="btn btn-warning layer-group-edit ignore-drag-item" ' + 
                        'data-container="body" data-toggle="tooltip" data-placement="top" title="Edit layer group data">' + 
                        '<i class="fa fa-pencil ignore-drag-item"></i>' + 
                    '</button>' + 
                    '<button style="width:40px" type="button" class="btn btn-danger layer-group-delete ignore-drag-item" ' + 
                        'data-container="body" data-toggle="tooltip" data-placement="top" title="Delete layer group">' + 
                        '<i class="fa fa-times ignore-drag-item"></i>' + 
                    '</button>' + 
                '</div>' + 
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
            '<div class="class="btn-toolbar ignore-drag-item" role="toolbar">' + 
                '<div class="btn-group ignore-drag-item" role="group" style="display:flex">' + 
                    '<button style="flex:1" type="button" class="btn btn-info ignore-drag-item">' + name + '</button>' + 
                    '<button style="width:40px" type="button" class="btn btn-warning layer-edit ignore-drag-item" ' + 
                        'data-container="body" data-toggle="tooltip" data-placement="top" title="Edit layer data">' + 
                        '<i class="fa fa-pencil ignore-drag-item"></i>' + 
                    '</button>' + 
                    '<button style="width:40px" type="button" class="btn btn-danger layer-delete ignore-drag-item" ' + 
                        'data-container="body" data-toggle="tooltip" data-placement="top" title="Delete layer">' + 
                        '<i class="fa fa-times ignore-drag-item"></i>' + 
                    '</button>' + 
                '</div>' +                 
            '</div>' +     
        '</li>'
    );
    return(li);
};

/**
 * Callback for save action on a layer group
 * @param {Object} data
 */
magic.classes.creator.MapLayerSelectorTree.prototype.writeGroupData = function(data) {
    this.layerDictionary.put(data);
    jQuery("#" + this.prefix + "-update-panel").fadeOut("slow");
};

/**
 * Callback for save action on a layer
 * @param {Object} data
 */
magic.classes.creator.MapLayerSelectorTree.prototype.writeLayerData = function(data) {
    this.layerDictionary.put(data);
    jQuery("#" + this.prefix + "-update-panel").fadeOut("slow");
};

/**
 * Callback for cancel action on a layer or layer group
 */
magic.classes.creator.MapLayerSelectorTree.prototype.cancelEdit = function() {
    magic.modules.Common.resetFormIndicators();
    jQuery("[id$='-update-panel']").fadeOut("slow");
};

/**
 * Set hint style according to allowed nature of drop
 * @param {Object} hint
 * @param {boolean} allowed
 */
magic.classes.creator.MapLayerSelectorTree.prototype.setHintStyle = function(hint, allowed) {
    if (allowed) {
        hint.css("background-color", "#dff0d8").css("border", "2px dashed #5cb85c");
    } else {
        hint.css("background-color", "#f2dede").css("border", "2px dashed #d9534f");
    }
};