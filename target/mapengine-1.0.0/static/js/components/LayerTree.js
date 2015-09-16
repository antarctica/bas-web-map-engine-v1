/* Layer tree */

magic.classes.LayerTree = function(target, treedata, sourceData) {
    
    this.target = target;
    this.treedata = treedata;
    this.sourcedata = sourceData;
    
    this.baseLayers = [];
    this.overlayLayers = [];
    this.nodeLayerTranslation = {};
    
    this.collapsed = false;
    
    this.initTree(this.treedata, $("#" + this.target), 0);
    
    var expanderLocation = $("#" + this.target).find("div.panel-heading:first");
    if (expanderLocation) {
        expanderLocation.append('<span data-toggle="tooltip" data-placement="bottom" title="Collapse layer tree" class="layer-tree-collapse fa fa-angle-double-left hidden-xs"></span>');
    }
    
    /* Collapse layer tree handler */
    $("span.layer-tree-collapse").on("click", $.proxy(function(evt) {
        evt.stopPropagation(); 
        this.setCollapsed(true);        
    }, this));
    
    /* Expand layer tree handler */
    $("button.layer-tree-expand").on("click", $.proxy(function(evt) {
        evt.stopPropagation();
        this.setCollapsed(false);
    }, this));        
    
    /* Assign layer visibility handlers */
    $("input.layer-vis-selector").change($.proxy(function(evt) {
        var id = evt.currentTarget.id;    
        var nodeid = this.getNodeId(id);
        var layer = this.nodeLayerTranslation[nodeid];
        if (id.indexOf("base-layer-rb") != -1) {
            /* Base layer visibility change */           
            var isRaster = this.isRasterLayer(layer), exIsRaster = false;
            $.each(this.baseLayers, $.proxy(function(bli, bl) {
                if (bl.getVisible() && this.isRasterLayer(bl)) {
                    exIsRaster = true;
                }
                bl.setVisible(bl.get("metadata")["nodeid"] == nodeid);
            }, this));
            if (isRaster != exIsRaster) {
                /* Toggle coastline layers if a raster backdrop is turned on or off */
                var coastVis = !isRaster;
                $.each(this.overlayLayers, $.proxy(function(oli, olyr) {
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
    $("input.layer-vis-group-selector").change($.proxy(function(evt) {
        var checked = evt.currentTarget.checked;
        $(evt.currentTarget).parent().next().find("li").each($.proxy(function(idx, elt) {
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
    $("span[id^='layer-info-']").on("click", $.proxy(function(evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);       
        magic.runtime.attribution.show(this.nodeLayerTranslation[nodeid]);
    }, this));            
    
    /* Layer dropdown handlers */           
    $("a.layer-tool").click($.proxy(function(evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        new magic.classes.LayerTreeOptionsMenu({
            nodeid: nodeid,
            layer: this.nodeLayerTranslation[nodeid]
        });
    }, this));
    
    /* Change tooltip for collapsible panels */
    $("div[id^='layer-group-panel-']").on("shown.bs.collapse", $.proxy(function(evt) {
        var tgt = $(evt.currentTarget);
        var tt = (tgt.hasClass("in") ? "Collapse" : "Expand") + " this group";
        tgt.parent().first().find("span.panel-title").attr("data-original-title", tt).tooltip("fixTitle");
        evt.stopPropagation();
    }, this));
    
    /* Change tooltip for collapsible panels */
    $("div[id^='layer-group-panel-']").on("hidden.bs.collapse", $.proxy(function(evt) {
        var tgt = $(evt.currentTarget);
        var tt = (tgt.hasClass("in") ? "Collapse" : "Expand") + " this group";
        tgt.parent().first().find("span.panel-title").attr("data-original-title", tt).tooltip("fixTitle");
        evt.stopPropagation();
    }, this));
        
};

magic.classes.LayerTree.prototype.getTarget = function() {
    return(this.target);
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

magic.classes.LayerTree.prototype.getCollapsed = function() {
    return(this.collapsed);
};

magic.classes.LayerTree.prototype.setCollapsed = function(collapsed) {
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
 * @param {jQuery,Object} element
 * @param {int} depth
 */
magic.classes.LayerTree.prototype.initTree = function(nodes, element, depth) {
    var stylePaletteEntry = 0;
    $.each(nodes, $.proxy(function (i, nd) {
        var indent = 8*depth;
        if ($.isArray(nd.nodes)) {
            /* Style a group */
            var expClass = " in", title = "Collapse this group", allCb = "";
            if (!nd.state || nd.state.expanded === false) {
                expClass = "";
                title = "Expand this group";
            }
            if (nd.radio) {                
                allCb = '<span style="margin:5px"></span>'; /* Spacer */
            } else {
                allCb = '<input class="layer-vis-group-selector" id="group-cb-' + nd.nodeid + '" type="checkbox" />';
            }
            element.append(
                ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.nodeid + '">' : "") + 
                '<div class="panel panel-default layer-group-panel">' + 
                    '<div class="panel-heading layer-group-heading-' + depth + '" id="layer-group-heading-' + nd.nodeid + '">' + 
                        '<span style="display:inline-block;width:' + indent + 'px"></span>' +
                        '<span class="icon-layers"></span>' +
                         allCb +
                        '<span class="panel-title layer-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' + 
                            '<a class="layer-group-tool" role="button" data-toggle="collapse" href="#layer-group-panel-' + nd.nodeid + '">' + 
                                '<span style="font-weight:bold">' + nd.text + '</span>' + 
                            '</a>' + 
                        '</span>' + 
                    '</div>' + 
                    '<div id="layer-group-panel-' + nd.nodeid + '" class="panel-collapse collapse' + expClass + '">' + 
                        '<div class="panel-body" style="padding:0px">' + 
                            '<ul class="list-group layer-list-group" id="layer-group-' + nd.nodeid + '">' + 
                            '</ul>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
                ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '</li>' : "")
            );             
            this.initTree(nd.nodes, $("#layer-group-" + nd.nodeid), depth+1);
        } else {
            /* Style a data node */
            var cb;
            var checkState = false, clickState = false, singleTileState = false, timeSeries = false;
            if (nd.state) {
                checkState = nd.state.checked === true;
                clickState = nd.state.clickable === true;
                singleTileState = nd.state.singletile === true;
                timeSeries = nd.state.timeseries === true;
            }           
            if (nd.props.radio) {
                cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.nodeid + '" type="radio" ' + (checkState ? "checked" : "") + '/>';
            } else {
                cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.nodeid + '" type="checkbox" ' + (checkState ? "checked" : "") + '/>';
            }
            var name = nd.text, /* Save name as we may insert ellipsis into name text for presentation purposes */
                ellipsisName = magic.modules.Common.ellipsis(nd.text, 25),
                infoTitle = "Get layer legend/metadata",
                nameSpan = ellipsisName;
            if (name != ellipsisName) {
                /* Tooltip to give the full version of any shortened name */
                nameSpan = '<span data-toggle="tooltip" data-placement="top" title="' + name + '">' + ellipsisName + '</span>';
            }
            element.append(
                '<li class="list-group-item layer-list-group-item" id="layer-item-' + nd.nodeid + '">' +                    
                    '<span style="float:left">' +
                        '<span style="display:inline-block;width:' + indent + 'px"></span>' +
                        '<span id="layer-info-' + nd.nodeid + '" ' + 
                            'class="fa fa-info-circle' + (clickState ? ' clickable' : ' non-clickable') + '" ' + 
                            'data-toggle="tooltip" data-placement="right" data-html="true" ' + 
                            'title="' + (clickState ? infoTitle + "<br />Click on map features for info" : infoTitle) + '" ' + 
                            'style="cursor:pointer">' + 
                        '</span>' + 
                        cb + 
                        '<span id="layer-filter-badge-' + nd.nodeid + '" class="badge filter-badge hidden" data-toggle="tooltip" data-placement="right" title="">filter</span>' + 
                        nameSpan + 
                    '</span>' + 
                    '<span style="float:right">' + 
                        '<a class="layer-tool" id="layer-opts-' + nd.nodeid + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + 
                            '<span class="fa fa-bars"></span><b class="caret"></b>' + 
                        '</a>' + 
                        '<ul id="layer-opts-dm-' + nd.nodeid + '" aria-labelled-by="layer-opts-' + nd.nodeid + '" class="dropdown-menu dropdown-menu-right">' +                             
                        '</ul>' + 
                    '</span>' +
                '</li>'
            );
            /* Layer filtering */            
            if (nd.props) {
                /* Create a data layer */
                var layer = null;
                if (!$.isNumeric(nd.nodeid) && magic.runtime.repository) {
                    /* Vector GPX or KML layer */
                    var format = null;
                    if (nd.props.type == "geo_kml") {
                        format = new ol.format.KML();
                    } else if (nd.props.type == "geo_gpx") {
                        format = new ol.format.GPX();
                    }
                    var url = magic.runtime.repository.replace("/show/", "/get/") + "?entryid=" + nd.nodeid;
                    var source = new ol.source.Vector({
                        format: format,
                        url: magic.config.paths.baseurl + "/xmlproxy?url=" + encodeURIComponent(url)
                    });
                    layer = new ol.layer.Vector({
                        name: nd.props.name,
                        source: source,
                        updateWhileAnimating: true,
                        updateWhileInteracting: true,
                        visible: false,
                        style: magic.modules.Common.fetchStyle(nd.props.geometry.type, stylePaletteEntry++),
                        metadata: $.extend({}, nd.props, {
                            nodeid: nd.nodeid, 
                            checkstate: false,
                            clickable: true,
                            timeseries: false,
                            filterable: false,
                            filter: null,
                            attrs: null
                        })
                    });
                } else if (singleTileState) {
                    /* Render point layers with a single tile for labelling free of tile boundary effects */
                    layer = new ol.layer.Image({
                        name: name,
                        visible: checkState,
                        opacity: 1.0,
                        metadata: $.extend({}, nd.props, {
                            nodeid: nd.nodeid, 
                            checkstate: checkState,
                            clickable: clickState,
                            timeseries: timeSeries,
                            filterable: clickState,
                            filter: null,
                            attrs: null
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
                    var opacity = 0.8;
                    if (nd.props.radio || ($.isArray(nd.props.keywords) && $.inArray("raster", nd.props.keywords) != -1)) {
                        /* Rasters will be opaque */
                        opacity = 1.0
                    }                    
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
                        opacity: opacity,
                        metadata: $.extend({}, nd.props, {
                            nodeid: nd.nodeid, 
                            checkstate: checkState,
                            clickable: clickState,
                            timeseries: timeSeries,
                            filterable: clickState,
                            filter: null,
                            attrs: null
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
                this.nodeLayerTranslation[nd.nodeid] = layer;
            }
        }
    }, this));    
};

/**
 * Translate an element id to a node id
 * @returns {string}
 */
magic.classes.LayerTree.prototype.getNodeId = function(eltId) {
    var nodeid = null;
    if (eltId.length > 36) {
        /* A Ramadda-style node id - fixed length of 36 characters */
        nodeid = eltId.substr(eltId.length - 36);
    } else {
        /* Node id is number after last '-' */
        nodeid = eltId.substring(eltId.lastIndexOf("-")+1);
    }
    return(nodeid);
};