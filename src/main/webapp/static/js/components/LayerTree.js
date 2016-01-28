/* Layer tree */

magic.classes.LayerTree = function (target) {

    this.target = target || "layer-tree";

    this.treedata = magic.runtime.mapdata.layers || [];

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
            $.each(this.layersBySource["base"], $.proxy(function (bli, bl) {                
                bl.setVisible(bl.get("metadata")["id"] == nodeid);
            }, this));            
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
    $("div[id^='layer-group-panel-']")
    .on("shown.bs.collapse", $.proxy(function (evt) {       
        $(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Collapse this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this))
    .on("hidden.bs.collapse", $.proxy(function (evt) {        
        $(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Expand this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this));

};

magic.classes.LayerTree.prototype.getTarget = function () {
    return(this.target);
};

magic.classes.LayerTree.prototype.getLayers = function () {
    return(
        this.layersBySource["base"].concat(
            this.layersBySource["wms"],
            this.layersBySource["geojson"],            
            this.layersBySource["gpx"],
            this.layersBySource["kml"]                                        
    ));        
};

magic.classes.LayerTree.prototype.getBaseLayers = function () {
    return(this.layersBySource["base"]);        
};

magic.classes.LayerTree.prototype.getWmsOverlayLayers = function () {
    return(this.layersBySource["wms"]);        
};

magic.classes.LayerTree.prototype.getNodeId = function (targetId) {
    return(targetId.substring(targetId.length-36));
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
        if ($.isArray(nd.layers)) {
            /* Style a group */
            var title = (nd.expanded ? "Collapse" : "Expand") + " this group";
            var hbg = depth == 0 ? "panel-primary" : (depth == 1 ? "panel-info" : "");
            var topMargin = i == 0 ? "margin-top:5px" : "";
            element.append(
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.id + '">' : "") +
                    '<div class="panel ' + hbg + ' center-block" style="width:96%;margin-bottom:5px;' + topMargin + '">' +
                        '<div class="panel-heading" id="layer-group-heading-' + nd.id + '">' +
                            '<span class="icon-layers"></span>' +
                            (nd.base ? '<span style="margin:5px"></span>' : '<input class="layer-vis-group-selector" id="group-cb-' + nd.id + '" type="checkbox" />') +
                            '<span class="panel-title layer-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' +
                                '<a class="layer-group-tool" role="button" data-toggle="collapse" href="#layer-group-panel-' + nd.id + '">' +
                                    '<span style="font-weight:bold">' + nd.name + '</span>' +
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
            this.initTree(nd.layers, $("#layer-group-" + nd.id), depth + 1);
        } else {
            /* Style a data node */
            var cb;
            var isWms = "wms_source" in nd.source;
            var isSingleTile = isWms ? nd.source.is_singletile === true : false;
            var isBase = isWms ? nd.source.is_base === true : false;
            var isInteractive = nd.is_interactive === true;
            if (isBase) {
                cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.id + '" type="radio" ' + (nd.is_visible ? "checked" : "") + '/>';
            } else {
                cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.id + '" type="checkbox" ' + (nd.is_visible ? "checked" : "") + '/>';
            }
            var name = nd.name, /* Save name as we may insert ellipsis into name text for presentation purposes */
                    ellipsisName = magic.modules.Common.ellipsis(nd.name, 30),
                    infoTitle = "Get layer legend/metadata",
                    nameSpan = ellipsisName;
            if (name != ellipsisName) {
                /* Tooltip to give the full version of any shortened name */
                nameSpan = '<span data-toggle="tooltip" data-placement="top" title="' + name + '">' + ellipsisName + '</span>';
            }
            element.append(
                    '<li class="list-group-item layer-list-group-item" id="layer-item-' + nd.id + '">' +
                        '<span style="float:left">' +
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
            var proj = magic.runtime.viewdata.projection;
            /* Get min/max resolution */            
            var minRes = magic.runtime.viewdata.resolutions[magic.runtime.viewdata.resolutions.length-1];
            var maxRes = magic.runtime.viewdata.resolutions[0]+1;   /* Note: OL applies this one exclusively, whereas minRes is inclusive - duh! */  
            if ($.isNumeric(nd.minScale)) {
                minRes = magic.modules.GeoUtils.getResolutionFromScale(nd.min_scale);
            }
            if ($.isNumeric(nd.maxScale)) {
                maxRes = magic.modules.GeoUtils.getResolutionFromScale(nd.max_scale);
            }
            console.log(minRes + ", " + maxRes);
            if (isWms) {
                if (nd.source.wms_source == "osm") {
                    /* OpenStreetMap layer */
                    layer = magic.modules.Common.midLatitudeCoastLayer();
                } else if (isSingleTile) {
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
                        source: wmsSource,
                        minResolution: minRes,
                        maxResolution: maxRes
                    });
                } else {
                    /* Non-point layer */
                    var wmsVersion = "1.3.0";
                    var wmsSource = new ol.source.TileWMS({
                        url: nd.source.wms_source,
                        params: {
                            "LAYERS": nd.source.feature_name,
                            "TRANSPARENT": true,
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
                        minResolution: minRes,
                        maxResolution: maxRes,
                        metadata: nd,
                        source: wmsSource
                    });
                }
                this.layersBySource[isBase ? "base" : "wms"].push(layer);
            } else if (nd.source.geojson_source) {
                /* GeosJSON layer */
                if (nd.source.feature_name) {
                    /* WFS */
                    var format = new ol.format.GeoJSON();
                    var vectorSource = new ol.source.Vector({
                        format: format,
                        loader: function(extent, resolution, projection) {
                            var url = nd.source.geojson_source + "?service=wfs&request=getfeature&outputFormat=application/json&" + 
                                "typename=" + nd.source.feature_name + "&" + 
                                "srsname=" + projection.getCode() + "&";
                            if (magic.runtime.filters[nd.name]) {
                                url += "cql_filter=" + magic.runtime.filters[nd.name] + " AND BBOX(geom," + extent.join(",") + ")";
                            } else {
                                url += "bbox=" + extent.join(",");
                            }     
                            if (magic.modules.Common.proxy_endpoints[url] === true) {
                                url = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url);
                            }
                            $.ajax({
                                url: url,
                                method: "GET"
                            }).done(function(response) {
                                vectorSource.addFeatures(format.readFeatures(response));
                            });
                        },                        
                        projection: magic.runtime.view.getProjection()
                    });
                    layer = new ol.layer.Vector({
                        name: nd.name,
                        visible: nd.is_visible,
                        source: vectorSource,
                        style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map)) ,
                        metadata: nd,
                        minResolution: minRes,
                        maxResolution: maxRes
                    });
                } else {
                    /* Some other GeoJSON feed */
                    layer = new ol.layer.Image({
                        name: nd.name,
                        visible: nd.is_visible,
                        metadata: nd,
                        source: new ol.source.ImageVector({
                            source: new ol.source.Vector({
                                format: new ol.format.GeoJSON(),                                
                                url: nd.source.geojson_source
                            })
                        }),
                        style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map)),
                        minResolution: minRes,
                        maxResolution: maxRes
                    });
                }
                this.layersBySource["geojson"].push(layer);
            } else if (nd.source.gpx_source) {
                /* GPX layer */
                layer = new ol.layer.Image({
                    name: nd.name,
                    visible: nd.is_visible,
                    metadata: nd,    
                    source: new ol.source.ImageVector({
                        source: new ol.source.Vector({
                            format: new ol.format.GPX(),
                            url: nd.source.gpx_source
                        }),
                        style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map))
                    }),
                    minResolution: minRes,
                    maxResolution: maxRes
                });
                this.layersBySource["gpx"].push(layer);
            } else if (nd.source.kml_source) {
                /* KML source */
                layer = new ol.layer.Image({
                    name: nd.name,
                    visible: nd.is_visible,
                    metadata: nd,
                    source: new ol.source.ImageVector({
                        source: new ol.source.Vector({
                            format: new ol.format.KML({showPointNames: false}),
                            url: nd.source.kml_source
                        }),
                        style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map))
                    }),
                    minResolution: minRes,
                    maxResolution: maxRes
                });
                this.layersBySource["kml"].push(layer);
            }
            nd.layer = layer;
            this.nodeLayerTranslation[nd.id] = layer;
        }
    }, this));
};

/**
 * Figures out which (if any) field in the attribute map is designed to be the feature label
 * @param {Array} attrMap
 * @returns {undefined}
 */
magic.classes.LayerTree.prototype.getLabelField = function(attrMap) {
    var labelField = null;
    if ($.isArray(attrMap)) {
        $.each(attrMap, function(idx, attr) {
            if (attr.label === true) {
                labelField = attr.name;
                return(false);
            }
        });
    }
    return(labelField);
};

/**
 * Translate style definition object to OL style
 * @param {object} styleDef
 * @param {string} labelField
 * @returns {ol.style}
 */
magic.classes.LayerTree.prototype.getVectorStyle = function(styleDef, labelField) {
    return(function(feature, resolution) {
        var style = null;
        var defaultFill =  {color: "rgba(255, 0, 0, 0.6)"};
        var defaultStroke = {color: "rgba(255, 0, 0, 1.0)", width: 1};   
        var fill, stroke, graphic;
        if (styleDef) {
            if (styleDef.fill) {
                fill = new ol.style.Fill({
                    color: magic.modules.Common.rgbToDec(styleDef.fill.color, styleDef.fill.opacity)
                });
            } else {
                fill = $.extend({}, defaultFill);
            }
            if (styleDef.stroke) {
                var lineStyle = styleDef.stroke.style == "dashed" ? [3, 3] : (styleDef.stroke.style == "dotted" ? [1, 1] : undefined);
                stroke = new ol.style.Stroke({
                    color: magic.modules.Common.rgbToDec(styleDef.stroke.color, styleDef.stroke.opacity),
                    lineDash: lineStyle,
                    width: styleDef.stroke.width || 1
                });
            } else {
                stroke = $.extend({}, defaultStroke);
            }
            if (styleDef.graphic) {
                if (styleDef.graphic.marker == "circle") {
                    graphic = new ol.style.Circle({
                        radius: styleDef.graphic.radius || 5,
                        fill: fill,
                        stroke: stroke
                    });
                } else if (styleDef.graphic.marker == "star") {
                    var r1 = styleDef.graphic.radius || 7;
                    var r2 = (r1 < 7 ? 2 : r1-5);
                    graphic = new ol.style.RegularShape({
                        radius1: r1,
                        radius2: r2,
                        points: 5,
                        fill: fill,
                        stroke: stroke
                    });
                } else {
                    var points;
                    switch(styleDef.graphic.marker) {
                        case "triangle": points = 3; break;
                        case "pentagon": points = 5; break;
                        case "hexagon": points = 6; break;
                        default: points = 4; break;                                    
                    }
                    graphic = new ol.style.RegularShape({
                        radius: styleDef.graphic.radius || 5,
                        points: points,
                        fill: fill,
                        stroke: stroke
                    });
                }
            } else {
                graphic = new ol.style.Circle({
                    radius: 5, 
                    fill: fill,
                    stroke: stroke
                });
            }
            var text = null;
            if (labelField) {
                var textColor = stroke.getColor();
                textColor[3] = 1.0; /* Opaque text */
                text = new ol.style.Text({
                    font: "Arial",
                    scale: 1.2,
                    offsetX: 10,
                    text: feature.get(labelField),
                    textAlign: "left",
                    fill: new ol.style.Fill({
                        color: textColor
                    }),
                    stroke: new ol.style.Stroke({
                        color: "#ffffff",
                        width: 1
                    })
                });
                style = new ol.style.Style({
                    image: graphic,                    
                    text: text
                });
            } else {
                style = new ol.style.Style({
                    image: graphic
                });
            }
        } else {
            /* Default style */
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5, 
                    fill: $.extend({}, defaultFill),
                    stroke: $.extend({}, defaultStroke)
                })
            });
        }
        return([style]);
    });
};