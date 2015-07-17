/* Layer tree */

magic.classes.LayerTree = function(target, treedata, sourceData) {
    
    this.target = target;
    this.treedata = treedata;
    this.sourcedata = sourceData;
    
    this.baseLayers = [];
    this.overlayLayers = [];
    this.initNodes(this.treedata);
    
    this.coastlineNodes = [];
    $("#" + this.target).treeview({
        data: treedata,
        showCheckbox: true,
        onAfterTreeRender: $.proxy(function() {            
            /* Add in the collapse button for the layer tree */
            $("li[data-nodeid=0]").append('<span data-toggle="tooltip" data-placement="bottom" title="Collapse layer tree" class="layer-tree-collapse fa fa-angle-double-left"></span>');
            $("span.layer-tree-collapse").on("click", $.proxy(function(evt) {
                evt.stopPropagation();
                $("#" + this.target).hide({
                    complete: magic.runtime.appcontainer.fitMapToViewport
                });
            }, this));            
            /* Layer dropdown skeletons */           
            $("li.node-layer-tree span.node-icon:not(.icon-layers)").parent().each($.proxy(function(idx, elt) {
                var nodeId = $(elt).attr("data-nodeid");
                if (nodeId) {                    
                    $(elt).addClass("dropdown");
                    $(elt).append(
                        '<a class="layer-tool" id="layer-opts-' + nodeId + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + 
                            '<span class="fa fa-bars"></span><b class="caret"></b>' + 
                        '</a>' + 
                        '<ul id="layer-opts-dm-' + nodeId + '" aria-labelled-by="layer-opts-' + nodeId + '" class="dropdown-menu dropdown-menu-right">' +                             
                        '</ul>'
                    );
                    $("#layer-opts-" + nodeId).off("click").on("click", $.proxy(function(evt) {  
                        evt.stopPropagation();
                        var nd = $("#" + this.target).treeview("getNode", nodeId);
                        new magic.classes.LayerTreeOptionsMenu({node: nd});
                        $(evt.target).parent().dropdown("toggle");                        
                    }, this));
                }
            }, this));
            /* The get layer info buttons */
            $("li.node-layer-tree span.fa-info-circle").on("click", function(evt) {
                evt.stopPropagation();
                var layerName = $(evt.target).parent().prop("innerText");
                if (layerName) {
                    var layer = magic.runtime.appcontainer.getLayerByName(layerName);
                    magic.runtime.attribution.show(layer);
                }
            });
        }, this)
    });
        
    $("#" + this.target)
        .on("nodeChecked", $.proxy(function(evt, node) {
            var lt = $("#" + this.target);
            if (node.layer) {
                node.layer.setVisible(true);
                var isRaster = this.isRasterLayer(node.layer);
                if (node.props.radio) {
                    /* Turn off all other base layers */
                    var exIsRaster = false;
                    var siblings = lt.treeview("getSiblings", node);
                    $.each(siblings, $.proxy(function(si, sn) {
                        if (sn != node) {
                            var bl = sn.layer;
                            if (bl.getVisible()) {
                                exIsRaster = this.isRasterLayer(bl);
                                bl.setVisible(false);
                            }
                            lt.treeview("uncheckNode", sn, {silent: true})
                        }
                    }, this));                    
                    if (isRaster != exIsRaster) {
                        /* Transition to/from a raster layer from/to a vector one => set coastline visibility accordingly */
                        var coastVis = !isRaster;
                        if (this.coastlineNodes.length == 0) {
                            /* Search for coastline nodes */
                            var coasts = lt.treeview("search", ["coastline", {ignoreCase: true, exactMatch: false, revealResults: false}]);
                            $.each(coasts, $.proxy(function(ci, cn) {
                                if (cn.icon != "icon-layers") {
                                    /* Data layer */
                                    this.coastlineNodes.push(cn)                                ;
                                }
                            }, this));
                            /* Remove gratuitous red highlighting */
                            lt.treeview("clearSearch");
                        }
                        $.each(this.coastlineNodes, $.proxy(function(ci, cn) {                           
                            cn.layer.setVisible(coastVis);                               
                            lt.treeview((coastVis ? "" : "un") + "checkNode", cn, {silent: true});                                
                        }, this));
                        
                    }
                    /* Trigger baselayerchanged event */
                    $.event.trigger({
                        type: "baselayerchanged",
                        layer: node.layer
                    });
                } 
            } else if (node.nodes && !node.radio) {
                /* Turn on all the child layers beneath this container */
                this.layerGroupStatusProcessor(node.nodes, true);
            }
    }, this))
        .on("nodeUnchecked", $.proxy(function(evt, node) {
            var lt = $("#" + this.target);    
            if (node.layer) {
                node.layer.setVisible(false);
            } else if (node.nodes) {
                /* Turn off all the child layers beneath this container */
                this.layerGroupStatusProcessor(node.nodes, false);
            }
    }, this));
    
    /* Layer tree expansion button */
    $("button.layer-tree-expand").on("click", $.proxy(function(evt) {
        evt.stopPropagation();
        $("#" + this.target).show({
            complete: magic.runtime.appcontainer.fitMapToViewport
        });
    }, this));        
    
};

magic.classes.LayerTree.prototype.getLayers = function() {
    return(this.baseLayers.concat(this.overlayLayers));
};

magic.classes.LayerTree.prototype.getBaseLayers = function() {
    return(this.baseLayers);
};

magic.classes.LayerTree.prototype.getOverlayLayers = function() {
    return(this.overlayLayers);
};

/**
 * Return true if supplied layer is a raster
 * @returns {boolean}
 */
magic.classes.LayerTree.prototype.isRasterLayer = function(layer) {
    var raster = false;
    if (layer) {
        var md = layer.get("metadata");
        if (md) {
            var kw = md.keywords;
            raster = $.isArray(kw) && $.inArray("raster", kw) != -1;
        }
    }
    return(raster);
};

/**
 * Insert per-node properties and styling into layer tree structure, as well as creating OL layers where needed
 * @param {array} nodes
 */
magic.classes.LayerTree.prototype.initNodes = function(nodes) {
    $.each(nodes, $.proxy(function (i, nd) {
        nd.selectable = false;
        if ($.isArray(nd.nodes)) {
            /* Style a group */
            nd.icon = "icon-layers";            
            nd.color = "#404040";
            nd.backColor = "#e0e0e0";
            nd.text = '<span style="font-weight:bold">' + nd.text + '</span>';
            this.initNodes(nd.nodes);
        } else {
            /* Style a data node */
            nd.icon = "fa fa-info-circle";
            nd.color = "#404040";
            nd.backColor = "#ffffff";
            var name = nd.text; /* Save name as we may insert ellipsis into name text for presentation purposes */
            nd.text = magic.modules.Common.ellipsis(nd.text, 25);
            if (nd.props) {
                /* Create a data layer */
                var layer = null,
                    kw = nd.props.keywords,
                    checkState = nd.state ? nd.state.checked === true : false;              
                if ($.isArray(kw) && $.inArray("point", kw) != -1) {
                    /* Render point layers with a single tile for labelling free of tile boundary effects */
                    layer = new ol.layer.Image({
                        name: name,
                        visible: checkState,
                        opacity: 1.0,
                        metadata: $.extend({}, nd.props, {
                            checkstate: checkState,
                            attrs: null,
                            filterable: true,
                            current_filter: null
                        }),
                        source: new ol.source.ImageWMS(({
                            /* TODO: revisit for WebGL - may need crossOrigin = true here */
                            url: this.sourcedata.wms,
                            params: {"LAYERS": nd.props.name}
                        }))
                    });      
                } else {
                    /* Non-point layer, or layer not keyworded with point tag */
                    var wmsVersion = (nd.props.cascaded && nd.props.cascaded > 0) ? "1.1.1" : "1.3.0";
                    var wmsSource = wmsSource = new ol.source.TileWMS({
                        url: this.sourcedata.wms,
                        params: {
                            "LAYERS": nd.props.name, 
                            "CRS": magic.runtime.projection.getCode(),
                            "SRS": magic.runtime.projection.getCode(),
                            "VERSION": wmsVersion,
                            "TILED": true, 
                            "WORKSPACE": this.sourcedata.workspace
                        },
                        tileGrid: new ol.tilegrid.TileGrid({
                            resolutions: magic.runtime.resolutions,
                            origin: magic.runtime.projection.getExtent().slice(0, 2)
                        }),
                        projection: magic.runtime.projection
                    });                     
                    layer = new ol.layer.Tile({
                        name: name,
                        visible: checkState,
                        opacity: nd.props.radio ? 1.0 : 0.8,
                        metadata: $.extend({}, nd.props, {
                            checkstate: checkState,
                            attrs: null,
                            filterable: true,
                            current_filter: null
                        }),
                        source: wmsSource
                    });        
                }            
                if (nd.props.radio) {
                    /* Base layer */
                    this.baseLayers.push(layer);
                } else {
                    /* Overlay layer */
                    this.overlayLayers.push(layer);
                }
                nd.layer = layer;
            }
        }
    }, this));
};

/**
 * Checking/unchecking a layer group controls all child layer visibility
 * @param {array} nodes
 * @param {boolean} state
 */
magic.classes.LayerTree.prototype.layerGroupStatusProcessor = function(nodes, state) {
    var lt = $("#" + this.target);
    $.each(nodes, $.proxy(function (i, nd) {
        lt.treeview((state ? "" : "un") + "checkNode", nd.nodeId, {silent: true});
        if ($.isArray(nd.nodes)) {
            this.layerGroupStatusProcessor(nd.nodes, state);
        } else {
            if (nd.layer) {
                nd.layer.setVisible(state);
            }
        }
    }, this));
};

magic.classes.LayerTree.prototype.getTarget = function() {
    return(this.target);
};