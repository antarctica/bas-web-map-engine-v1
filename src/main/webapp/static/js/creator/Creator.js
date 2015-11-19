magic.common.Creator = function () {

    return({
        /* The JSON definition of the map */
        map_context: null,
        /* Dictionary of layers and layer groups by identifier */
        layer_definition_dictionary: null,
        /* Core fields for new blank map */
        blank_map_core: {
            "id": "",
            "name": "New blank map",
            "description": "Longer description of the purpose of the map goes here",
            "version": "1.0",
            "logo": "bas.png",
            "favicon": "bas.ico",
            "repository": null,
            "creation_date": null,
            "modified_date": null,
            "owner_name": null,
            "owner_email": "owner@example.com",
            "metadata_url": null
        },
        /* Per-region blank map initialisation data */
        blank_map_data: {
            "antarctic": {
                "projection": "EPSG:3031",
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 13,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 16, 28, 14, 5.6, 2.8, 1.4, 0.56],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["cga"],
                "primary_wms": "https://maps.bas.ac.uk/antarctic/wms",
                "primary_wfs": "https://maps.bas.ac.uk/antarctic/wfs",
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "feature_name": "add:antarctic_hillshade_and_bathymetry",
                                "is_base": true,
                                "is_visible": true,
                                "is_dem": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "feature_name": "add:antarctic_coastline",
                                "is_visible": true
                            },
                            {
                                "id": "",
                                "name": "Sub-Antarctic coastline",
                                "feature_name": "add:sub_antarctic_coastline",
                                "is_visible": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Grids",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Graticule",
                                "feature_name": "add:antarctic_graticule",
                                "is_visible": true,
                                "is_singletile": true
                            }
                        ]
                    }
                ]
            },
            "arctic": {
                "projection": "EPSG:3995",
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 6,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["arctic"],
                "primary_wms": "https://maps.bas.ac.uk/arctic/wms",
                "primary_wfs": "https://maps.bas.ac.uk/arctic/wfs",
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "feature_name": "arctic:arctic_hillshade_and_bathymetry",
                                "is_base": true,
                                "is_visible": true,
                                "is_dem": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "feature_name": "arctic:arctic_coastline",
                                "is_visible": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Grids",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Graticule",
                                "feature_name": "arctic:arctic_graticule",
                                "is_visible": true,
                                "is_singletile": true
                            }
                        ]
                    }
                ]
            },
            "southgeorgia": {
                "projection": "EPSG:3762",
                "center": [-1000.0, 61900.0],
                "zoom": 4,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 14,
                "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.2, 0.56, 0.28, 0.14],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["sg"],
                "primary_wms": "https://maps.bas.ac.uk/southgeorgia/wms",
                "primary_wfs": "https://maps.bas.ac.uk/southgeorgia/wfs",
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "feature_name": "sggis:sg_hillshade_and_bathymetry",
                                "is_base": true,
                                "is_visible": true,
                                "is_dem": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "feature_name": "sggis:sg_coastline",
                                "is_visible": true
                            }
                        ]
                    }
                ]
            }
        },
        /* Template for a new layer */
        blank_map_new_layer: {            
            "id": "",
            "name": "New layer"
        },
        /* Template for a new group */
        blank_map_new_group: {
            "id": "",
            "name": "New layer group",
            "layers": [                
            ]
        },
        /**
         * Assign all the form element handlers
         */
        init: function () {
            /* Creator method radio button change handler */
            $("input[type=radio][name='creator-method']").change($.proxy(function (evt) {
                var rb = $(evt.currentTarget);
                $.each(["new", "edit", "clone"], $.proxy(function (idx, elt) {
                    if (elt == rb.val()) {
                        /* Checked one */
                        var select = rb.parent().next("select");
                        select.prop("disabled", false);
                        if (elt == "edit" || elt == "clone") {
                            this.loadMapOptions(select, elt)
                        }
                    } else {
                        /* Has been unchecked */
                        $("#creator-method-" + elt).parent().next("select").prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            $("select[name='creator-method-new-region']").change($.proxy(function (evt) {
                var rg = $(evt.currentTarget).val();
                var context = $.extend(true, {}, this.blank_map_core, {"data": this.blank_map_data[rg]});
                this.loadMapContext(context);
            }, this));
            $("select[name='creator-method-clone-mapid']").change($.proxy(function (evt) {
                $.getJSON(magic.config.paths.baseurl + "/maps/id/" + $(evt.currentTarget).val(), function (data) {
                    this.loadMapContext(data);
                });
            }, this));
            $("select[name='creator-method-edit-mapid']").change($.proxy(function (evt) {
                $.getJSON(magic.config.paths.baseurl + "/maps/id/" + $(evt.currentTarget).val(), function (data) {
                    this.loadMapContext(data);
                });
            }, this));
        },
        /**
         * Initialise the map context from the given object
         * @param {object} data
         */
        loadMapContext: function (data) {
            this.map_context = data;
            this.layer_definition_dictionary = {};
            /* Populate the straight inputs */
            var inputs = $("#map-creator-form").serializeArray();
            $.each(inputs, function (idx, elt) {
                var name = elt.name.replace("creator-map-", "");
                if (data[name]) {
                    $("#" + elt.name).val(data[name]);
                }
            });
            if (data.data && $.isArray(data.data.layers)) {
                /* Translate the layer data into a sortable list */
                var layerTree = $("#creator-map-layertree");
                layerTree.empty();
                this.processLayers(data.data.layers, layerTree);                
                /* http://camohub.github.io/jquery-sortable-lists/ */
                layerTree.sortableLists({
                    placeholderCss: {"background-color": "#fcf8e3", "border": "2px dashed #fce04e"},
                    hintCss: {"background-color": "#dff0d8", "border": "2px dashed #5cb85c"},
                    isAllowed: $.proxy(function (elt, hint, target) {
                        /* Allowed drag iff target is a group or the top level */
                        var allowed = false;
                        var dropZone = hint.parents("li").first();
                        if (dropZone) {                            
                            if (dropZone.length > 0 && dropZone[0].id) {
                                /* Only allowed to be dropped within a group */
                                allowed = this.layer_definition_dictionary[dropZone[0].id].layers
                            } else if (dropZone.length == 0) {
                                /* Dropped at the top level */
                                allowed = true;
                            }
                        }
                        return(allowed);
                    }, this),
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
                /* Assign the layer edit button handlers */
                $(".layer-name-button").click(function(evt) {
                    console.log("Click");
                });
                /* Add new layer button handler */
                var btnNewLayer = $("#creator-map-new-layer");
                if (btnNewLayer) {
                    btnNewLayer.prop("disabled", false);
                    btnNewLayer.click($.proxy(function(evt) {
                        var id = magic.modules.Common.uuid();
                        this.layer_definition_dictionary[id] = $.extend({}, this.blank_map_new_layer);
                        layerTree.append(this.layerLiHtml(id, this.layer_definition_dictionary[id]["name"]));
                    }, this));
                }
                /* Add new layer group button handler */
                var btnNewGroup = $("#creator-map-new-group");
                if (btnNewGroup) {
                    btnNewGroup.prop("disabled", false);
                    btnNewGroup.click($.proxy(function(evt) {
                        var id = magic.modules.Common.uuid();
                        this.layer_definition_dictionary[id] = $.extend({}, this.blank_map_new_group);
                        layerTree.append(this.groupLiHtml(id, this.layer_definition_dictionary[id]["name"]));
                    }, this));
                }               
            }
        },
        /**
         * Load the given drop-down with the the list of maps the current user can perform the action on
         * @param {object} select
         * @param {string} action         
         */
        loadMapOptions: function (select, action) {
            select.find("option").remove();
            $.getJSON(magic.config.paths.baseurl + "/maps/dropdown/" + action, function (data) {
                $.each(data, function (key, val) {
                    select.append($("<option>", {value: key}).text(val));
                });
            });
        },
        /**
         * Recursive routine to create list infrastructure for layer tree and to assign random ids
         * @param {array} layers
         * @param {element} parent
         */
        processLayers: function(layers, parent) {
            for (var i = 0; i < layers.length; i++) {
                layers[i].id = magic.modules.Common.uuid();
                this.layer_definition_dictionary[layers[i].id] = layers[i];
                if (layers[i].layers) {
                    /* A layer group */
                    var groupEl = this.groupLiHtml(layers[i].id, layers[i].name);
                    parent.append(groupEl);
                    this.processLayers(layers[i].layers, groupEl.children("ul"));
                } else {
                    /* A leaf node */   
                    var layerEl = this.layerLiHtml(layers[i].id, layers[i].name);
                    parent.append(layerEl);                    
                }
            }
        },
        /**
         * Handler for updating the progress bar
         * @param {object} tab
         * @param {object} navigation
         * @param {int} index
         */
        updateProgressBar: function (tab, navigation, index) {
            var total = navigation.find("li").length;
            var current = index + 1;
            var percent = (current / total) * 100;
            $("#rootwizard").find(".progress-bar").css({width: percent + "%"});
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