/* Map Creator tab1 logic */

magic.modules.creator.Tab2 = function () {

    return({
        
        /* Sub-tab for layer update */
        layer_updater: null,

        /* Sub-tab for layer group update */
        group_updater: null,

        init: function() {
            this.layer_updater = new magic.classes.creator.LayerUpdater("t2-layer");
            this.group_updater = new magic.classes.creator.LayerGroupUpdater("t2-group");
            $("#t2-update-panel").hide();
        },
        /**
         * Populate tab form from data
         * @param {object} context
         */
        loadContext: function(context) {
            if (context.data && $.isArray(context.data.layers)) {
                /* Translate the layer data into a sortable list */
                $("#t2-update-panel").hide();    
                var layerTree = $("ul.layertree");
                layerTree.empty();
                this.processLayers(context.data.layers, layerTree);                
                this.initSortableList(layerTree);    
                /* Assign the layer edit button handlers */
                $(".layer-name-button").click($.proxy(this.layerTreeButtonHandler, this));
                /* Add new layer button handler */
                var btnNewLayer = $("#t2-new-layer");
                if (btnNewLayer) {
                    btnNewLayer.prop("disabled", false);
                    btnNewLayer.click($.proxy(function(evt) {
                        var id = magic.modules.creator.Common.layer_dictionary.put($.extend({}, magic.modules.creator.Data.BLANK_MAP_NEW_LAYER));
                        var newLi = this.layerLiHtml(id, magic.modules.creator.Common.layer_dictionary.get(id)["name"]);
                        layerTree.append(newLi);
                        newLi.find("button").click($.proxy(this.layerTreeButtonHandler, this));
                    }, this));
                }
                /* Add new layer group button handler */
                var btnNewGroup = $("#t2-new-group");
                if (btnNewGroup) {
                    btnNewGroup.prop("disabled", false);
                    btnNewGroup.click($.proxy(function(evt) {
                        var id = magic.modules.creator.Common.layer_dictionary.put($.extend({}, magic.modules.creator.Data.BLANK_MAP_NEW_GROUP));
                        var newLi = this.groupLiHtml(id, magic.modules.creator.Common.layer_dictionary.get(id)["name"]);
                        layerTree.append(newLi);
                        newLi.find("button").click($.proxy(this.layerTreeButtonHandler, this));
                    }, this));
                }                               
            }
        },
        /**
         * Click handler for buttons in layer tree
         * @param {jQuery.Event} evt
         */
        layerTreeButtonHandler: function(evt) {
            var btn = $(evt.currentTarget);
            var id = btn.parents("li").first().prop("id");
            var dictEntry = magic.modules.creator.Common.layer_dictionary.get(id);
            var isGroup = dictEntry && dictEntry.layers;
            $("#t2-update-panel").show();            
            if (isGroup) {
                /* Group form snippet */
                $("#t2-update-panel-title").html("Layer group : " + dictEntry.name);
                $("#t2-group-div").show();
                $("#t2-layer-div").hide();
                this.group_updater.loadContext(dictEntry);                
            } else {
                /* Layer form snippet */
                $("#t2-update-panel-title").html("Data layer : " + dictEntry.name);
                $("#t2-group-div").hide();
                $("#t2-layer-div").show();
                this.layer_updater.loadContext(dictEntry);                
            }
        },
        /**
         * Initialise the sortable lists plugin for the layer tree
         * @param {element} layerTree
         */
        initSortableList: function(layerTree) {
            /* http://camohub.github.io/jquery-sortable-lists/ */
            layerTree.sortableLists({
                placeholderCss: {"background-color": "#fcf8e3", "border": "2px dashed #fce04e"},
                hintCss: {"background-color": "#dff0d8", "border": "2px dashed #5cb85c"},
                isAllowed:this.allowedDragHandler,
                listSelector: "ul",
                listsClass: "list-group",                    
                insertZone: 50,
                opener: {
                    active: true,
                    close: "/static/images/sortable_lists/close.png",
                    open: "/static/images/sortable_lists/open.png",                        
                    openerCss: {
                        "display": "inline-block",
                        "width": "18px",
                        "height": "18px",
                        "float": "left",
                        "margin-left": "-35px",
                        "margin-right": "5px",
                        "background-position": "center center",
                        "background-repeat": "no-repeat"
                    }
                },
                ignoreClass: "layer-name-button"
            });
        },
        /**
         * Drag sortable element handler - implements logic to decide whether a given drag is allowed
         * @param {element} elt
         * @param {object} hint
         * @param {element} target
         * @returns {Boolean}
         */
        allowedDragHandler: function (elt, hint, target) {
            /* Allowed drag iff target is a group or the top level */
            var allowed = false;
            var dropZone = hint.parents("li").first();
            if (dropZone) {                            
                if (dropZone.length > 0 && dropZone[0].id) {
                    /* Only allowed to be dropped within a group */
                    allowed = magic.modules.creator.Common.layer_dictionary.get(dropZone[0].id).layers
                } else if (dropZone.length == 0) {
                    /* Dropped at the top level */
                    allowed = true;
                }
            }
            return(allowed);
        },
        /**
         * Recursive routine to create list infrastructure for layer tree and to assign random ids
         * @param {array} layers
         * @param {element} parent
         */
        processLayers: function(layers, parent) {
            for (var i = 0; i < layers.length; i++) {
                var id = magic.modules.creator.Common.layer_dictionary.put(layers[i]);
                if (layers[i].layers) {
                    /* A layer group */
                    var groupEl = this.groupLiHtml(id, layers[i].name);
                    parent.append(groupEl);
                    this.processLayers(layers[i].layers, groupEl.children("ul"));
                } else {
                    /* A leaf node */   
                    var layerEl = this.layerLiHtml(id, layers[i].name);
                    parent.append(layerEl);                    
                }
            }
        },
        /**
         * HTML fragment for layer group list item
         * @param {string} id
         * @param {string} name
         * @returns {element}
         */
        groupLiHtml: function(id, name) {
            var li = $(
                '<li class="list-group-item list-group-item-heading" id="' + id + '">' + 
                    '<div>' + 
                        '<button type="button" class="btn btn-info btn-sm layer-name-button" data-toggle="tooltip" data-placement="right" title="Click to update layer group data">' + 
                            name + 
                        '</button>' + 
                    '</div>' + 
                    '<ul class="list-group"></ul>' + 
                '</li>'
            );           
            return(li);
        },
        /**
         * HTML fragment for layer list item
         * @param {string} id
         * @param {string} name
         * @returns {element}
         */
        layerLiHtml: function(id, name) {
            var li = $(
                '<li class="list-group-item list-group-item-info" id="' + id + '">' + 
                    '<div>' + 
                        '<button type="button" class="btn btn-info btn-sm layer-name-button" data-toggle="tooltip" data-placement="right" title="Click to update layer data">' + 
                            name + 
                        '</button>' + 
                    '</div>' +     
                '</li>'
            );
            return(li);
        }

    });

}();