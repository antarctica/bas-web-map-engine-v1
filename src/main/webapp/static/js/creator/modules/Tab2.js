/* Map Creator tab2 logic */

magic.modules.creator.Tab2 = function () {

    return({
        
        /* Group opener configuration, to allow dynamic insertion of elements without re-init of the tree */
        opener_css: {
            "display": "inline-block",
            "width": "18px",
            "height": "18px",
            "float": "left",
            "margin-left": "-35px",
            "margin-right": "5px",
            "background-position": "center center",
            "background-repeat": "no-repeat"
        },
        
        openHtml: '<i class="fa fa-plus" style="font-size:20px"></i>',
        closeHtml: '<i class="fa fa-minus" style="font-size:20px"></i>',        
        
        /* Sub-tab for layer update */
        layer_updater: null,

        /* Sub-tab for layer group update */
        group_updater: null,

        init: function() {
            this.layer_updater = new magic.classes.creator.LayerUpdater("t2-layer");
            this.group_updater = new magic.classes.creator.LayerGroupUpdater("t2-group");
            jQuery("#t2-update-panel").hide();
        },
        /**
         * Populate tab form from data
         * @param {object} context
         */
        loadContext: function(context) {
            if (context.data && jQuery.isArray(context.data.layers)) {
                /* Translate the layer data into a sortable list */
                jQuery("#t2-update-panel").hide();    
                var layerTree = jQuery("ul.layertree");
                layerTree.empty();               
                this.processLayers(context.data.layers, layerTree);                
                this.initSortableList(layerTree);                 
                /* Assign the layer edit button handlers */
                jQuery(".layer-name-button").click(jQuery.proxy(this.layerTreeButtonHandler, this));
                /* Add new layer button handler */
                var btnNewLayer = jQuery("#t2-new-layer");
                if (btnNewLayer) {
                    btnNewLayer.prop("disabled", false);
                    btnNewLayer.click(jQuery.proxy(function(evt) {
                        var id = magic.modules.creator.Common.layer_dictionary.put(jQuery.extend({}, magic.modules.creator.Data.BLANK_MAP_NEW_LAYER));
                        var newLi = this.layerLiHtml(id, magic.modules.creator.Common.layer_dictionary.get(id)["name"]);
                        layerTree.append(newLi);
                        newLi.find("button").click(jQuery.proxy(this.layerTreeButtonHandler, this));
                    }, this));
                }
                /* Add new layer group button handler */
                var btnNewGroup = jQuery("#t2-new-group");
                if (btnNewGroup) {
                    btnNewGroup.prop("disabled", false);
                    btnNewGroup.click(jQuery.proxy(function(evt) {
                        var id = magic.modules.creator.Common.layer_dictionary.put(jQuery.extend({}, magic.modules.creator.Data.BLANK_MAP_NEW_GROUP));
                        var newLi = this.groupLiHtml(id, magic.modules.creator.Common.layer_dictionary.get(id)["name"]);
                        layerTree.append(newLi);
                        newLi.find("button").click(jQuery.proxy(this.layerTreeButtonHandler, this));
                    }, this));
                }                               
            }
        },
        saveContext: function(context) {
            var groupActive = jQuery("#t2-group-div").hasClass("group-form-active");
            var layerActive = jQuery("#t2-layer-div").hasClass("layer-form-active");
            if (layerActive) {
                this.layer_updater.saveContext();
            } else if (groupActive) {
                this.group_updater.saveContext();
            }
        },
        validate: function() {
            return(true);
        },
        /**
         * Click handler for buttons in layer tree
         * @param {jQuery.Event} evt
         */
        layerTreeButtonHandler: function(evt) {
            var btn = jQuery(evt.currentTarget);
            var id = btn.parents("li").first().prop("id");
            var dictEntry = magic.modules.creator.Common.layer_dictionary.get(id);
            var isGroup = dictEntry && dictEntry.layers;
            jQuery("#t2-update-panel").show();            
            if (isGroup) {
                /* Group form snippet */
                jQuery("#t2-update-panel-title").html("Layer group : " + dictEntry.name);
                jQuery("#t2-group-div").show().addClass("group-form-active");
                jQuery("#t2-layer-div").hide().removeClass("layer-form-active");
                this.group_updater.loadContext(dictEntry);                
            } else {
                /* Layer form snippet */
                jQuery("#t2-update-panel-title").html("Data layer : " + dictEntry.name);
                jQuery("#t2-group-div").hide().removeClass("group-form-active");
                jQuery("#t2-layer-div").show().addClass("layer-form-active");
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
                isAllowed: this.allowedDragHandler,
                listSelector: "ul",
                listsClass: "list-group",                    
                insertZone: 50,
                opener: {
                    active: true,
                    as: "html",  
                    close: this.closeHtml,
                    open: this.openHtml,
                    openerCss: this.opener_css
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
                if (jQuery.isArray(layers[i].layers) && layers[i].layers.length > 0) {
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
                .css(jQuery.extend({"background-image": "url('" + this.open_img + "')"}, this.opener_css))
                .on("mousedown", jQuery.proxy(function(evt) {                    
					if (li.hasClass("sortableListsClosed")) {
                        jQuery(evt.currentTarget).html(this.closeHtml);
                        li.removeClass("sortableListsClosed").addClass("sortableListsOpen");
                        li.children("ul, ol").css("display", "block");
                        li.children("div").children(".sortableListsOpener").first().html(this.closeHtml);
                    }
					else { 
                        jQuery(evt.currentTarget).html(this.openHtml);
                        li.removeClass("sortableListsOpen").addClass("sortableListsClosed");
                        li.children("ul, ol").css("display", "none");
                        li.children("div").children(".sortableListsOpener").first().html(this.openHtml);
                    }
					return(false);
            }, this));
            return(li);
        },
        /**
         * HTML fragment for layer list item
         * @param {string} id
         * @param {string} name
         * @returns {element}
         */
        layerLiHtml: function(id, name) {
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
        }

    });

}();