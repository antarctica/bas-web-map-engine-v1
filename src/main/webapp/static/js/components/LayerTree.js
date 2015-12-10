/* Layer tree */

magic.classes.LayerTree = function (target) {

    this.target = target || "layer-tree";

    this.treedata = magic.runtime.map_context.data.layers || [];

    /* Dictionary mapping from a node UUID to an OL layer */
    this.nodeLayerTranslation = {};

    /* Dictionary of layers by source type, for stacking purposes */
    this.layersBySource = {
        "base": [],
        "wms": [],
        "geojson": [],
        "gpx": [],
        "kml": []
    };

    this.initTree(this.treedata, $("#" + this.target), 0);

    this.collapsed = false;

    var expanderLocation = $("#" + this.target).find("div.panel-heading:first");
    if (expanderLocation) {
        expanderLocation.append('<span data-toggle="tooltip" data-placement="bottom" title="Collapse layer tree" class="layer-tree-collapse fa fa-angle-double-left hidden-xs"></span>');
    }

    /* Collapse layer tree handler */
    $("span.layer-tree-collapse").on("click", $.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(true);
    }, this));

    /* Expand layer tree handler */
    $("button.layer-tree-expand").on("click", $.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(false);
    }, this));

    /* Assign layer visibility handlers */
    $("input.layer-vis-selector").change($.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        var layer = this.nodeLayerTranslation[nodeid];
        if (id.indexOf("base-layer-rb") != -1) {
            /* Base layer visibility change */
            var isRaster = this.isRasterLayer(layer), exIsRaster = false;
            $.each(this.baseLayers, $.proxy(function (bli, bl) {
                if (bl.getVisible() && this.isRasterLayer(bl)) {
                    exIsRaster = true;
                }
                bl.setVisible(bl.get("metadata")["nodeid"] == nodeid);
            }, this));
            if (isRaster != exIsRaster) {
                /* Toggle coastline layers if a raster backdrop is turned on or off */
                var coastVis = !isRaster;
                $.each(this.overlayLayers, $.proxy(function (oli, olyr) {
                    if (olyr.get("name").toLowerCase().indexOf("coastline") != -1) {
                        olyr.setVisible(coastVis);
                    }
                }, this));
            }
            /* Trigger baselayerchanged event */
            $.event.trigger({
                type: "baselayerchanged",
                layer: layer
            });
        } else {
            /* Overlay layer visibility change */
            layer.setVisible(evt.currentTarget.checked);
        }
    }, this));

    /* Assign layer group visibility handlers */
    $("input.layer-vis-group-selector").change($.proxy(function (evt) {
        var checked = evt.currentTarget.checked;
        $(evt.currentTarget).parent().next().find("li").each($.proxy(function (idx, elt) {
            var nodeid = this.getNodeId(elt.id);
            var lyr = this.nodeLayerTranslation[nodeid];
            if (lyr) {
                lyr.setVisible(checked);
                $("#layer-cb-" + nodeid).prop("checked", checked);
            } else {
                $("#group-cb-" + nodeid).prop("checked", checked);
            }
        }, this));
    }, this));

    /* The get layer info buttons */
    $("span[id^='layer-info-']").on("click", $.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        magic.runtime.attribution.show(this.nodeLayerTranslation[nodeid]);
    }, this));

    /* Layer dropdown handlers */
    $("a.layer-tool").click($.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        new magic.classes.LayerTreeOptionsMenu({
            nodeid: nodeid,
            layer: this.nodeLayerTranslation[nodeid]
        });
    }, this));

    /* Change tooltip for collapsible panels */
    $("div[id^='layer-group-panel-']").on("shown.bs.collapse", $.proxy(function (evt) {
        var tgt = $(evt.currentTarget);
        var tt = (tgt.hasClass("in") ? "Collapse" : "Expand") + " this group";
        tgt.parent().first().find("span.panel-title").attr("data-original-title", tt).tooltip("fixTitle");
        evt.stopPropagation();
    }, this));

    /* Change tooltip for collapsible panels */
    $("div[id^='layer-group-panel-']").on("hidden.bs.collapse", $.proxy(function (evt) {
        var tgt = $(evt.currentTarget);
        var tt = (tgt.hasClass("in") ? "Collapse" : "Expand") + " this group";
        tgt.parent().first().find("span.panel-title").attr("data-original-title", tt).tooltip("fixTitle");
        evt.stopPropagation();
    }, this));

};

magic.classes.LayerTree.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.LayerTree.prototype.getCollapsed = function () {
    return(this.collapsed);
};

magic.classes.LayerTree.prototype.setCollapsed = function (collapsed) {
    if (collapsed) {
        $("#" + this.target).hide({
            complete: magic.runtime.appcontainer.fitMapToViewport
        });
    } else {
        $("#" + this.target).show({
            complete: magic.runtime.appcontainer.fitMapToViewport
        });
    }
    this.collapsed = collapsed;
};

/**
 * Insert per-node properties and styling into layer tree structure, as well as creating OL layers where needed
 * @param {array} nodes
 * @param {jQuery,Object} element
 * @param {int} depth
 */
magic.classes.LayerTree.prototype.initTree = function (nodes, element, depth) {
    $.each(nodes, $.proxy(function (i, nd) {
        var indent = 12 * depth;
        if ($.isArray(nd.layers)) {
            /* Style a group */
            var title = (nd.expanded ? "Collapse" : "Expand") + " this group";
            var hbg = depth == 0 ? "bg-primary" : (depth == 1 ? "bg-info" : "");
            element.append(
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.id + '">' : "") +
                    '<div class="panel panel-default">' +
                    '<div class="panel-heading ' + hbg + '" id="layer-group-heading-' + nd.id + '">' +
                    '<span style="display:inline-block;width:' + indent + 'px"></span>' +
                    '<span class="icon-layers"></span>' +
                    (nd.base ? '<span style="margin:5px"></span>' : '<input class="layer-vis-group-selector" id="group-cb-' + nd.id + '" type="checkbox" />') +
                    '<span class="panel-title layer-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' +
                    '<a class="layer-group-tool" role="button" data-toggle="collapse" href="#layer-group-panel-' + nd.id + '">' +
                    '<span style="font-weight:bold">' + nd.text + '</span>' +
                    '</a>' +
                    '</span>' +
                    '</div>' +
                    '<div id="layer-group-panel-' + nd.id + '" class="panel-collapse collapse' + (nd.expanded ? " in" : "") + '">' +
                    '<div class="panel-body" style="padding:0px">' +
                    '<ul class="list-group layer-list-group" id="layer-group-' + nd.id + '">' +
                    '</ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '</li>' : "")
                    );
            this.initTree(nd.nodes, $("#layer-group-" + nd.id), depth + 1);
        } else {
            /* Style a data node */
            var cb;
            var isWms = nd.source.wms_source;
            var isSingleTile = isWms ? nd.source.wms_source.is_singletile : false;
            var isBase = isWms ? nd.source.wms_source.is_base : false;
            var isInteractive = nd.is_interactive;
            if (isBase) {
                cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.id + '" type="radio" ' + (nd.is_visible ? "checked" : "") + '/>';
            } else {
                cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.id + '" type="checkbox" ' + (nd.is_visible ? "checked" : "") + '/>';
            }
            var name = nd.name, /* Save name as we may insert ellipsis into name text for presentation purposes */
                    ellipsisName = magic.modules.Common.ellipsis(nd.text, 30),
                    infoTitle = "Get layer legend/metadata",
                    nameSpan = ellipsisName;
            if (name != ellipsisName) {
                /* Tooltip to give the full version of any shortened name */
                nameSpan = '<span data-toggle="tooltip" data-placement="top" title="' + name + '">' + ellipsisName + '</span>';
            }
            element.append(
                    '<li class="list-group-item layer-list-group-item" id="layer-item-' + nd.id + '">' +
                    '<span style="float:left">' +
                    '<span style="display:inline-block;width:' + indent + 'px"></span>' +
                    '<span id="layer-info-' + nd.id + '" ' +
                    'class="fa fa-info-circle' + (isInteractive ? ' clickable' : ' non-clickable') + '" ' +
                    'data-toggle="tooltip" data-placement="right" data-html="true" ' +
                    'title="' + (isInteractive ? infoTitle + "<br />Click on map features for info" : infoTitle) + '" ' +
                    'style="cursor:pointer">' +
                    '</span>' +
                    cb +
                    '<span id="layer-filter-badge-' + nd.id + '" class="badge filter-badge hidden" data-toggle="tooltip" data-placement="right" title="">filter</span>' +
                    nameSpan +
                    '</span>' +
                    '<span style="float:right">' +
                    '<a class="layer-tool" id="layer-opts-' + nd.id + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                    '<span class="fa fa-bars"></span><b class="caret"></b>' +
                    '</a>' +
                    '<ul id="layer-opts-dm-' + nd.id + '" aria-labelled-by="layer-opts-' + nd.id + '" class="dropdown-menu dropdown-menu-right">' +
                    '</ul>' +
                    '</span>' +
                    '</li>'
                    );
            /* Create a data layer */
            var layer = null;
            var proj = magic.runtime.map.getView().getProjection();
            if (isWms) {
                if (isSingleTile) {
                    /* Render point layers with a single tile for labelling free of tile boundary effects */
                    var wmsSource = new ol.source.ImageWMS(({
                        url: nd.source.wms_source,
                        params: {"LAYERS": nd.source.feature_name},
                        projection: proj
                    }));
                    layer = new ol.layer.Image({
                        name: name,
                        visible: nd.is_visible,
                        opacity: nd.opacity || 1.0,
                        metadata: nd,
                        source: wmsSource
                    });
                } else {
                    /* Non-point layer, or layer not keyworded with point tag */
                    var wmsVersion = "1.3.0";
                    var wmsSource = new ol.source.TileWMS({
                        url: nd.source.wms_source,
                        params: {
                            "LAYERS": nd.source.feature_name,
                            "CRS": proj.getCode(),
                            "SRS": proj.getCode(),
                            "VERSION": wmsVersion,
                            "TILED": true
                        },
                        tileGrid: new ol.tilegrid.TileGrid({
                            resolutions: magic.runtime.viewdata.resolutions,
                            origin: proj.getExtent().slice(0, 2)
                        }),
                        projection: proj
                    });
                    layer = new ol.layer.Tile({
                        name: name,
                        visible: nd.is_visible,
                        opacity: nd.opacity || 1.0,
                        metadata: nd,
                        source: wmsSource
                    });
                }
                this.layersBySource[isBase ? "base" : "wms"].push(layer);
            } else if (nd.source.geojson_source) {
                /* GeosJSON layer */
                this.layersBySource["geojson"].push(layer);
            } else if (nd.source.gpx_source) {
                /* GPX layer */
                layer = new ol.layer.Image({
                    source: new ol.source.ImageVector({
                        source: new ol.source.Vector({
                            format: new ol.format.GPX({readExtensions: false}),
                            url: nd.source.gpx_source
                        }),
                        style: this.getVectorStyle(nd.source.style_definition) 
                    })
                });
                this.layersBySource["gpx"].push(layer);
            } else if (nd.source.kml_source) {
                /* KML source */
                this.layersBySource["kml"].push(layer);
            }
            nd.layer = layer;
            this.nodeLayerTranslation[nd.id] = layer;
        }
    }, this));
};

magic.classes.LayerTree.prototype.getVectorStyle = function(styleDef) {
    var defaultStyle =  new ol.style.Style({
        fill: new ol.style.Fill({
            color: "rgba(255, 0, 0, 0.6)"
        }),
        stroke: new ol.style.Stroke({
            color: "rgba(255, 0, 0, 1.0)",
            width: 1
        })
    });
    if (styleDef) {
        if (styleDef.fill) {
            // TODO
        }
        if (styleDef.stroke) {
            
        }
    }
};