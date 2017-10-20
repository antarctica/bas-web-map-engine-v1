/* Layer tree */

magic.classes.LayerTree = function (target) {

    this.target = target || "layer-tree";
   
    this.treedata = magic.runtime.mapdata.layers || [];
    
    /* User saved map payload of form:
     * {
     *     center: [<x>, <y>],
     *     zoom: <level>,
     *     layers: {
     *         <nodeid>: {
     *             visibility: <t|f>,
     *             opacity: <opacity>
     *         }
     *     },
     *     groups: {
     *         <nodeid>: <t|f>
     *     }
     * }
     */
    this.userdata = magic.runtime.userdata;

    /* Dictionary mapping from a node UUID to an OL layer */
    this.nodeLayerTranslation = {};

    /* Dictionary of layers by source type, for stacking purposes on map */
    this.layersBySource = {
        "base": [],
        "wms": [],
        "geojson": [],
        "gpx": [],
        "kml": []
    };
    
    /* Performance - avoid a DOM-wide search whenever tree refreshed to show visibilities */
    this.layerGroupDivs = [];
    
    /* Time-dependent layer movie player instances, indexed by node id */
    this.moviePlayers = {};
    
    /* Groups which require an autoload (keyed by uuid) */
    this.autoloadGroups = {};
    
    /* Z-index stacking (used to insert autoload WMS groups in the right place) */
    this.zIndexWmsStack = 0;
    
    var targetElement = jQuery("#" + this.target);
    /* Layer search form */
    targetElement.append(
        '<div class="layersearch-panel panel panel-info hidden" style="margin-bottom:0px">' + 
            '<div class="panel-heading" style="padding-bottom:0px">' + 
                '<div class="layersearch-form form-group form-group-sm">' + 
                    '<div class="input-group">' + 
                        '<input id="' + this.id + '-layersearch-ta" class="form-control typeahead border-lh-round" type="text" placeholder="Name of layer" ' + 
                        'required="required" autofocus="true"></input>' + 
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-layersearch-go" class="btn btn-default btn-sm" type="button" ' + 
                                'data-toggle="tooltip" data-placement="right" title="Locate data layer in tree">' + 
                                '<span class="glyphicon glyphicon-search"></span>' + 
                            '</button>' +
                        '</span>' +
                        '<span><button type="button" style="padding-bottom:10px" class="close">&times;</button></span>' + 
                    '</div>'+
                '</div>' + 
            '</div>' + 
        '</div>'
    );
    
    this.initTree(this.treedata, targetElement, 0);
    
    /* Layer tree is visible => assign all the necessary handlers  */
    var expanderLocation = jQuery("#" + this.target).find("div.panel-heading").eq(1);
    if (expanderLocation) {
        expanderLocation.append(                
            '<span data-toggle="tooltip" data-placement="bottom" title="Collapse layer tree" ' + 
                'class="layer-tree-collapse fa fa-angle-double-left hidden-xs"></span>' + 
            '<span data-toggle="tooltip" data-placement="bottom" title="Search for a data layer" ' +
                'class="layer-tree-search fa fa-search"></span>'
        );
    }

    /* Collapse layer tree handler */
    jQuery("span.layer-tree-collapse").on("click", jQuery.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(true);
    }, this));

    /* Expand layer tree handler */
    jQuery("button.layer-tree-expand").on("click", jQuery.proxy(function (evt) {
        evt.stopPropagation();
        this.setCollapsed(false);
    }, this));
    
    this.collapsed = false;
    
    if (jQuery.isEmptyObject(this.autoloadGroups)) {
        this.initLayerSearchTypeahead();
        this.assignLayerSearchFormHandlers();
        this.layerGroupDivs = jQuery("#" + this.target).find("div.layer-group");
        this.assignLayerGroupHandlers(null);
        this.assignLayerHandlers(null);  
        this.assignOneOnlyLayerGroupHandlers();
        this.refreshTreeIndicators();
    }
        
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
        jQuery("#" + this.target).hide({
            complete: magic.runtime.appcontainer.fitMapToViewport
        });
    } else {
        jQuery("#" + this.target).show({
            complete: magic.runtime.appcontainer.fitMapToViewport
        });
    }
    this.collapsed = collapsed;
};

/**
 * Add handlers for operations on layer groups, optionally only under the specified element
 * @param {jQuery.object} belowElt
 */
magic.classes.LayerTree.prototype.assignLayerGroupHandlers = function(belowElt) {
    
    /* Assign layer group visibility handlers */
    var groupVis = null;
    if (belowElt) {
        groupVis = belowElt.find("input.layer-vis-group-selector");
    } else {
        groupVis = jQuery("input.layer-vis-group-selector");
    }        
    groupVis.change(jQuery.proxy(this.groupVisibilityHandler, this)); 

    /* Change tooltip for collapsible panels */
    var groupPanel = null;
    if (belowElt) {
        groupPanel = belowElt.find("div[id^='layer-group-panel-']");
    } else {
        groupPanel = jQuery("div[id^='layer-group-panel-']");
    }    
    groupPanel
    .on("shown.bs.collapse", jQuery.proxy(function (evt) {       
        jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Collapse this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this))
    .on("hidden.bs.collapse", jQuery.proxy(function (evt) {        
        jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Expand this group").tooltip("fixTitle");
        evt.stopPropagation();
    }, this));        
};

/**
 * Add handlers for operations on layers, optionally only under the specified element
 * @param {jQuery.object} belowElt
 */
magic.classes.LayerTree.prototype.assignLayerHandlers = function(belowElt) {
    
    /* Assign layer visibility handlers */
    var layerVis = null;
    if (belowElt) {
        layerVis = belowElt.find("input.layer-vis-selector");
    } else {
        layerVis = jQuery("input.layer-vis-selector");
    }                
    layerVis.change(jQuery.proxy(this.layerVisibilityHandler, this));
    
    /* The get layer info buttons */
    var layerInfo = null;
    if (belowElt) {
        layerInfo = belowElt.find("a[id^='layer-info-']");
    } else {
        layerInfo = jQuery("a[id^='layer-info-']");
    }    
    layerInfo.on("click", jQuery.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        magic.runtime.attribution.show(this.nodeLayerTranslation[nodeid]);
    }, this));

    /* Layer dropdown handlers */
    var layerDropdown = null;
    if (belowElt) {
        layerDropdown = belowElt.find("a.layer-tool");
    } else {
        layerDropdown = jQuery("a.layer-tool");
    }    
    layerDropdown.click(jQuery.proxy(function (evt) {
        var id = evt.currentTarget.id;
        var nodeid = this.getNodeId(id);
        new magic.classes.LayerTreeOptionsMenu({
            nodeid: nodeid,
            layer: this.nodeLayerTranslation[nodeid]
        });
    }, this));          

    /* Initialise checked indicator badges in layer groups */
    var layerBadgeCount = null;
    if (belowElt) {
        layerBadgeCount = belowElt.find("input[id^='layer-cb-']:checked");
    } else {
        layerBadgeCount = jQuery("input[id^='layer-cb-']:checked");
    }    
    layerBadgeCount.each(jQuery.proxy(function(idx, elt) {
        this.setLayerVisibility(jQuery(elt));
    }, this));
};

/**
 * Radio button layer groups - assign handlers for the "turn all layers off" button  
 */
magic.classes.LayerTree.prototype.assignOneOnlyLayerGroupHandlers = function() {        
    jQuery("a[id^='group-rb-off-']").each(jQuery.proxy(function(idx, elt) {
        var allOff = jQuery(elt);
        allOff.click(jQuery.proxy(function(evt) {
            var groupsDone = {};
            allOff.closest("div.layer-group").find("input[type='radio']").each(jQuery.proxy(function(idx2, rbElt) {
                if (!groupsDone[rbElt.name]) {
                    jQuery("input[name='" + rbElt.name + "']").prop("checked", false);                    
                    groupsDone[rbElt.name] = true;
                }
                this.setLayerVisibility(jQuery(rbElt), true);
            }, this));
        }, this));                
    }, this));  
};

/**
 * Add handlers for "search for data layer" form
 */
magic.classes.LayerTree.prototype.assignLayerSearchFormHandlers = function() {
        
    /* Expand search form */
    jQuery("span.layer-tree-search").on("click", function (evt) {
        evt.stopPropagation();
        var pnl = jQuery(".layersearch-panel");
        pnl.removeClass("hidden").addClass("show");
        /* To work round the time lag with showing the typeahead in the previously hidden form
         * see: https://github.com/twitter/typeahead.js/issues/712 */          
        setTimeout(function() {
            pnl.find("input").focus();
        }, 100);            
    });

    /* Collapse search form */
    jQuery(".layersearch-form").find(".close").on("click", function (evt) {
        evt.stopPropagation();
        jQuery(".layersearch-panel").removeClass("show").addClass("hidden");
    });      
};

/**
 * Insert per-node properties and styling into layer tree structure, as well as creating OL layers where needed
 * @param {array} nodes
 * @param {jQuery,Object} element
 * @param {int} depth
 */
magic.classes.LayerTree.prototype.initTree = function (nodes, element, depth) {
    jQuery.each(nodes, jQuery.proxy(function (i, nd) {
        if (jQuery.isArray(nd.layers)) {
            /* Style a group */
            var groupExpanded = this.userGroupExpanded(nd.id, nd.expanded);      
            var ellipsisName = magic.modules.Common.ellipsis(nd.name, 25);            
            var title = (ellipsisName != nd.name ? nd.name + " - " : "") + (groupExpanded ? "Collapse" : "Expand") + " this group";            
            var hbg = depth == 0 ? "panel-primary" : (depth == 1 ? "panel-info" : "");
            var topMargin = i == 0 ? "margin-top:5px" : "";
            var oneOnly = (nd.base === true || nd.one_only === true);
            element.append(
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.id + '">' : "") +
                    '<div class="panel ' + hbg + ' center-block layer-group" style="' + topMargin + '">' +
                        '<div class="panel-heading" id="layer-group-heading-' + nd.id + '">' +
                            '<span class="icon-layers"></span>' +
                            (nd.base ? '<span style="margin:5px"></span>' : 
                             nd.one_only ? '<a id="group-rb-off-' + nd.id + '" href="Javascript:void(0)" role="button" ' + 
                             'data-toggle="tooltip" data-placement="right" title="Turn all radio button controlled layers off">' + 
                             '<span style="margin:5px; color:' + (depth == 0 ? 'white' : '#202020') + '" class="fa fa-eye-slash">&nbsp;</span></a>' :
                             '<input class="layer-vis-group-selector" id="group-cb-' + nd.id + '" type="checkbox" />') +
                            (oneOnly ? '' : '<span class="badge checked-indicator-badge hidden"><span class="fa fa-eye">&nbsp;</span>0</span>') + 
                            '<span class="panel-title layer-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' +
                                '<a class="layer-group-tool" role="button" data-toggle="collapse" href="#layer-group-panel-' + nd.id + '">' +
                                    '<span style="font-weight:bold">' + ellipsisName + '</span>' +
                                '</a>' +
                            '</span>' +
                        '</div>' +
                        '<div id="layer-group-panel-' + nd.id + '" class="panel-collapse collapse' + (groupExpanded ? " in" : "") + '">' +
                            '<div class="panel-body" style="padding:0px">' +
                                '<ul class="list-group layer-list-group ' + (oneOnly ? 'one-only' : '') + '" id="layer-group-' + nd.id + '">' +
                                '</ul>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '</li>' : "")
                    );
            this.initTree(nd.layers, jQuery("#layer-group-" + nd.id), depth + 1);
            if (nd.autoload === true) {
                /* Layers to be autoloaded from local server later */
                this.autoloadGroups[nd.id] = {
                    filter: nd.autoload_filter,
                    popups: nd.autoload_popups === true,
                    insert: this.zIndexWmsStack
                };
                this.zIndexWmsStack++;  /* Make an insert point for the auto layers */
            }
        } else {
            /* Style a data node */
            this.addDataNode(nd, element);            
        }
    }, this));
};

/**
 * Create layer corresponding to a data node
 * @param {object} nd
 * @param {jQuery.Object} element
 */
magic.classes.LayerTree.prototype.addDataNode = function(nd, element) {
    var cb;
    var isWms = "wms_source" in nd.source;
    var isSingleTile = isWms ? nd.source.is_singletile === true : false;
    var isBase = isWms ? nd.source.is_base === true : false;
    var isInteractive = nd.is_interactive === true || (nd.source.geojson_source && nd.source.feature_name);
    var isTimeDependent = nd.source.is_time_dependent;
    var refreshRate = nd.refresh_rate || 0;
    var name = nd.name, /* Save name as we may insert ellipsis into name text for presentation purposes */
            ellipsisName = magic.modules.Common.ellipsis(nd.name, 30),
            infoTitle = "Get layer legend/metadata",
            nameSpan = ellipsisName;
    if (name != ellipsisName) {
        /* Tooltip to give the full version of any shortened name */
        nameSpan = '<span data-toggle="tooltip" data-placement="top" title="' + name + '">' + ellipsisName + '</span>';
    }
    /* Determine visibility */
    var isVisible = this.userLayerAttribute(nd.id, "visibility", nd.is_visible);   
    if (magic.runtime.search && magic.runtime.search.visible && magic.runtime.search.visible[name]) {
        isVisible = magic.runtime.search.visible[name];
    }
    /* Determine opacity */
    var layerOpacity = this.userLayerAttribute(nd.id, "opacity", nd.opacity);   
    if (isBase) {
        cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.id + '" type="radio" ' + (isVisible ? "checked" : "") + '/>';
    } else if (element.hasClass("one-only")) {
        var eltId = element.attr("id");
        cb = '<input class="layer-vis-selector" name="layer-rb-' + eltId + '" id="layer-rb-' + nd.id + '" type="radio" ' + (isVisible ? "checked" : "") + '/>';
    } else {
        cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.id + '" type="checkbox" ' + (isVisible ? "checked" : "") + '/>';
    }           
    element.append(
            '<li class="list-group-item layer-list-group-item" id="layer-item-' + nd.id + '">' +
                '<table style="table-layout:fixed; width:100%">' + 
                    '<tr>' + 
                        '<td style="width:5%">' + 
                            '<a id="layer-info-' + nd.id + '" style="cursor:pointer" data-toggle="tooltip" data-placement="right" data-html="true" ' +
                                'title="' + (isInteractive ? infoTitle + "<br />Click on map features for info" : infoTitle) + '">' +
                                '<span class="fa fa-info-circle' + (isInteractive ? ' clickable' : ' non-clickable') + '"></span>' +                                
                            '</a>' +
                        '</td>' +
                        '<td style="width:5%">' +
                            '<div id="vis-wrapper-' + nd.id + '" style="cursor:pointer" tabindex="0" class="layer-vis-wrapper"' + 
                            (isTimeDependent ? ' data-trigger="manual" data-toggle="popover" data-placement="bottom"' : '') + '>' + 
                            cb + 
                            '</div>' + 
                        '</td>' +
                        '<td style="width:80%; padding-left:10px; text-overflow: ellipsis">' +  
                            '<a href="Javascript:void(0)">' + 
                                '<span id="layer-filter-badge-' + nd.id + '" class="badge filter-badge hidden" ' + 
                                'data-toggle="tooltip" data-placement="right" title="">filter</span>' +
                            '</a>' + 
                            nameSpan +
                        '</td>' +   
                        '<td style="width:10%">' +
                            '<a class="layer-tool" id="layer-opts-' + nd.id + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                                '<span class="fa fa-bars"></span><b class="caret"></b>' +
                            '</a>' +
                            '<ul id="layer-opts-dm-' + nd.id + '" aria-labelled-by="layer-opts-' + nd.id + '" class="dropdown-menu dropdown-menu-right">' +
                            '</ul>' +
                        '</td>' +
                    '</tr>' + 
                '</table>' + 
            '</li>'
            );            
    /* Create a data layer */
    var layer = null;
    var proj = magic.runtime.viewdata.projection;            
    /* Get min/max resolution */  
    var minRes = undefined, maxRes = undefined;
    if (!(nd.source.wms_source && nd.source.wms_source == "osm")) {
        if (magic.runtime.viewdata.resolutions) {
            minRes = magic.runtime.viewdata.resolutions[magic.runtime.viewdata.resolutions.length-1];
            maxRes = magic.runtime.viewdata.resolutions[0]+1;   /* Note: OL applies this one exclusively, whereas minRes is inclusive - duh! */  
            if (jQuery.isNumeric(nd.minScale)) {
                minRes = magic.modules.GeoUtils.getResolutionFromScale(nd.min_scale);
            }
            if (jQuery.isNumeric(nd.maxScale)) {
                maxRes = magic.modules.GeoUtils.getResolutionFromScale(nd.max_scale);
            }
        }
    }
    if (isWms) {
        if (nd.source.wms_source == "osm") {
            /* OpenStreetMap layer */
            layer = magic.modules.Endpoints.getMidLatitudeCoastLayer();
            layer.set("metadata", nd);
        } else if (isSingleTile) {
            /* Render point layers with a single tile for labelling free of tile boundary effects */
            var wmsSource = new ol.source.ImageWMS(({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": nd.source.style_name ? (nd.source.style_name == "default" ? "" : nd.source.style_name) : ""
                },
                projection: proj
            }));
            layer = new ol.layer.Image({
                name: name,
                visible: isVisible,
                opacity: layerOpacity || 1.0,
                metadata: nd,
                source: wmsSource,
                minResolution: minRes,
                maxResolution: maxRes
            });                    
        } else {
            /* Non-point layer */
            var wmsVersion = "1.3.0";
            var wmsSource = new ol.source.TileWMS({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": nd.source.style_name ? (nd.source.style_name == "default" ? "" : nd.source.style_name) : "",
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
                visible: isVisible,
                opacity: layerOpacity || 1.0,
                minResolution: minRes,
                maxResolution: maxRes,
                metadata: nd,
                source: wmsSource
            });
        }
        if (isBase) {
            layer.setZIndex(0);
            this.layersBySource["base"].push(layer);
        } else {
            layer.setZIndex(this.zIndexWmsStack);
            this.zIndexWmsStack++;
            this.layersBySource["wms"].push(layer); 
        }           
    } else if (nd.source.geojson_source) {
        /* GeosJSON layer */
        var vectorSource;
        var labelRotation = nd.source.feature_name ? 0.0 : -magic.runtime.viewdata.rotation;
        var format = new ol.format.GeoJSON();
        var url = nd.source.geojson_source;
        if (nd.source.feature_name) {                           
            /* WFS */
            url = magic.modules.Endpoints.getOgcEndpoint(url, "wfs") + "?service=wfs&request=getfeature&outputFormat=application/json&" + 
                "typename=" + nd.source.feature_name + "&" + 
                "srsname=" + (nd.source.srs || "EPSG:4326");
            vectorSource = new ol.source.Vector({
                format: format,
                loader: function(extent) {
                    if (!jQuery.isArray(extent) || !(isFinite(extent[0]) && isFinite(extent[1]) && isFinite(extent[2]) && isFinite(extent[3]))) {
                        extent = magic.runtime.view.getProjection().getExtent();
                    }
                    var wfs = url + "&bbox=" + extent.join(",");
                    jQuery.ajax({
                        url: wfs,
                        method: "GET"                   
                    })
                    .done(function(data) {
                        vectorSource.addFeatures(format.readFeatures(data));
                    })
                    .fail(function(xhr) {
                        var msg;
                        if (xhr.status == 401) {
                            msg = "Not authorised to access layer " + nd.source.feature_name;
                        } else {
                            msg = JSON.parse(xhr.responseText)["detail"];
                        }
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                '<p>' + msg + '</p>' + 
                            '</div>'
                        );
                    });
                }
            });  
        } else {
            /* Another GeoJSON source */
            url = magic.modules.Common.proxyUrl(url);
            vectorSource = new ol.source.Vector({
                format: format,
                url: url
            });  
        }        
        layer = new ol.layer.Vector({
            name: nd.name,
            visible: isVisible,
            source: vectorSource,
            style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation),
            metadata: nd,
            minResolution: minRes,
            maxResolution: maxRes
        });        
        layer.setZIndex(200);
        this.layersBySource["geojson"].push(layer);
    } else if (nd.source.gpx_source) {
        /* GPX layer */
        var labelRotation = -magic.runtime.viewdata.rotation;
        layer = new ol.layer.Image({
            name: nd.name,
            visible: isVisible,
            metadata: nd,    
            source: new ol.source.ImageVector({
                source: new ol.source.Vector({
                    format: new ol.format.GPX({readExtensions: function(f, enode){                       
                        try {
                            var json = xmlToJSON.parseString(enode.outerHTML.trim());
                            if ("extensions" in json && jQuery.isArray(json.extensions) && json.extensions.length == 1) {
                                var eo = json.extensions[0];
                                for (var eok in eo) {
                                    if (eok.indexOf("_") != 0) {
                                        if (jQuery.isArray(eo[eok]) && eo[eok].length == 1) {
                                            var value = eo[eok][0]["_text"];
                                            f.set(eok, value, true);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                        }
                        return(f);
                    }}),
                    url: magic.modules.Common.proxyUrl(nd.source.gpx_source)
                }),
                style: this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation)
            }),
            minResolution: minRes,
            maxResolution: maxRes
        });
        layer.setZIndex(400);
        this.layersBySource["gpx"].push(layer);
    } else if (nd.source.kml_source) {
        /* KML source */
        var labelRotation = -magic.runtime.viewdata.rotation;
        var kmlStyle = this.getVectorStyle(nd.source.style_definition, this.getLabelField(nd.attribute_map), labelRotation);
        layer = new ol.layer.Image({
            name: nd.name,
            visible: isVisible,
            metadata: nd,
            source: new ol.source.ImageVector({
                source: new ol.source.Vector({
                    format: new ol.format.KML({
                        extractStyles: false,
                        showPointNames: false
                    }),
                    url: magic.modules.Common.proxyUrl(nd.source.kml_source)
                }),
                style: kmlStyle
            }),
            minResolution: minRes,
            maxResolution: maxRes
        });
        layer.setZIndex(400);
        this.layersBySource["kml"].push(layer);
    }
    nd.layer = layer;
    this.nodeLayerTranslation[nd.id] = layer;
    if (refreshRate > 0) {
        setInterval(jQuery.proxy(this.refreshLayer, this), 1000*60*refreshRate, layer);
    }
};

/**
 * Fetch the data for all autoload layers
 * @param {ol.Map} map
 */
magic.classes.LayerTree.prototype.initAutoLoadGroups = function(map) {
    var defaultNodeAttrs = {
        legend_graphic: null,
        refresh_rate: 0,
        min_scale: 1,
        max_scale: 50000000,
        opacity: 1.0,
        is_visible: false,
        is_interactive: false,
        is_filterable: false        
    };
    var defaultSourceAttrs = {
        style_name: null,
        is_base: false,
        is_singletile: false,
        is_dem: false,
        is_time_dependent: false
    };
    var defaultAttributeAttrs = {
        displayed: true,
        nillable: true,
        filterable: false,
        alias: "",
        ordinal: null,
        unique_values: false
    };
    var maxAttrs = 10;
    jQuery.each(this.autoloadGroups, jQuery.proxy(function(grpid, grpo) {
        var element = jQuery("#layer-group-" + grpid);
        if (element.length > 0) {
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/gs/layers/filter/" + encodeURIComponent(grpo.filter), 
                method: "GET",
                dataType: "json",
                contentType: "application/json"
            }).done(jQuery.proxy(function(data) {
                if (jQuery.isArray(data)) {
                    /* Alphabetical order of name */
                    data.sort(function(a, b) {
                        return(a.name.localeCompare(b.name));
                    });
                    for (var i = 0; i < data.length; i++) {
                        var nd = jQuery.extend({}, {
                            id: magic.modules.Common.uuid(),
                            name: data[i].name,
                            geom_type: data[i].geom_type,
                            attribute_map: data[i].attribute_map
                        }, defaultNodeAttrs);
                        nd.source = jQuery.extend({}, {
                            wms_source: magic.modules.Endpoints.getOgcEndpoint(data[i].wms_source, "wms"), 
                            feature_name: data[i].feature_name
                        }, defaultSourceAttrs);
                        nd.is_interactive = grpo.popups === true;
                        if (jQuery.isArray(nd.attribute_map)) {
                            for (var j = 0; j < nd.attribute_map.length; j++) {
                                /* Allow only 'maxAttrs' attributes to be displayed - http://redmine.nerc-bas.ac.uk/issues/4540 */
                                nd.attribute_map[j] = jQuery.extend({}, nd.attribute_map[j], defaultAttributeAttrs, {displayed: j < maxAttrs});
                            }                            
                        } else {
                            nd.is_interactive = false;
                        }
                        /* Should now have a node from which to create a WMS layer */
                        this.addDataNode(nd, element);
                        nd.layer.setZIndex(grpo.insert);
                        if (map) {                            
                            map.addLayer(nd.layer);
                        }
                    }
                    this.initLayerSearchTypeahead();
                    this.assignLayerSearchFormHandlers();
                    this.layerGroupDivs = jQuery("#" + this.target).find("div.layer-group");
                    this.assignLayerGroupHandlers(null);
                    this.assignLayerHandlers(null);  
                    this.assignOneOnlyLayerGroupHandlers();
                    this.refreshTreeIndicators();              
                }                   
            }, this)).fail(jQuery.proxy(function(xhr) {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                    '</div>'
                );
            }, this));                                
        }
    }, this));
};

/**
 * Initialise typeahead handlers and config for layer search 
 */
magic.classes.LayerTree.prototype.initLayerSearchTypeahead = function() {
    var nlData = [];
    jQuery.each(this.nodeLayerTranslation, function(nodeId, layer) {
        nlData.push({"id": nodeId, "layer": layer.get("name")});
    });
    nlData.sort(function(a, b) {
        return(a.layer.localeCompare(b.layer));
    });
    jQuery("#" + this.id + "-layersearch-ta").typeahead(
        {minLength: 2, highlight: true}, 
        {
            limit: 100,
            async: true,
            source: this.layerMatcher(nlData),
            templates: {
                notFound: '<p class="suggestion">No results</p>',
                header: '<div class="suggestion-group-header">Data layers</div>',
                suggestion: function(value) {                    
                    return('<p class="suggestion">' + value + '</p>');
                }
            }
        }
    )
    .on("typeahead:autocompleted", jQuery.proxy(this.layerSearchSuggestionSelectHandler, this))
    .on("typeahead:selected", jQuery.proxy(this.layerSearchSuggestionSelectHandler, this));
};

/**
 * Handler for an autocompleted selection of layer name
 * @param {jQuery.Event} evt
 * @param {Object} sugg
 */
magic.classes.LayerTree.prototype.layerSearchSuggestionSelectHandler = function(evt, sugg) {
    /* sugg will contain the name of the layer, from which we can deduce the node id */
    var theLayer = null;
    magic.runtime.map.getLayers().forEach(function (layer) {
        if (layer.get("name") == sugg) {
            theLayer = layer;
        }
    });
    if (theLayer != null && theLayer.get("metadata")) {
        /* Got the layer - get the node id */
        var nodeId = theLayer.get("metadata").id;
        var layerControl = jQuery("#layer-item-" + nodeId);
        var context = {nopened: 0, ntotal: 0};         
        var enclosingUnopenedGroups = jQuery.grep(layerControl.parents("[id^='layer-group-panel']"), function(elt, idx) {
            var pnl = jQuery(elt);
            if (!pnl.hasClass("in")) {
                /* This group is not open, so open it */
                pnl.on("shown.bs.collapse", jQuery.proxy(function(e) {
                    this.nopened++;
                    if (this.nopened == this.ntotal) {
                        magic.modules.Common.scrollViewportToElement(layerControl[0]);
                        layerControl.css("background-color", "#ff0000");
                        setTimeout(function() {
                            layerControl.css("background-color", "#ffffff");
                        }, 1000);
                    }
                }, context));
                return(true);
            }
        });
        context.ntotal = enclosingUnopenedGroups.length;
        if (context.ntotal == 0) {
            /* Nothing to open - just scroll to element */
            magic.modules.Common.scrollViewportToElement(layerControl[0]);
            layerControl.css("background-color", "#ff0000");
            setTimeout(function() {
                layerControl.css("background-color", "#ffffff");
            }, 1000);
        } else {
            /* Open layer groups that need it */
            jQuery.each(enclosingUnopenedGroups, function(idx, elt) {
                jQuery(elt).collapse("toggle");            
            });  
        }
    }
};

/**
 * setInterval handler to refresh a layer
 * @param {ol.Layer} layer
 */
magic.classes.LayerTree.prototype.refreshLayer = function(layer) {
    if (typeof layer.getSource().updateParams === "function") {
        /* Add time parameter to force refresh of WMS layer */
        var params = layer.getSource().getParams();
        params.t = new Date().getMilliseconds();
        layer.getSource().updateParams(params);
    } else if (layer.getSource() instanceof ol.source.Vector) {
        /* WFS/GeoJSON layer */
        this.reloadVectorSource(layer.getSource());
    } else if (jQuery.isFunction(layer.getSource().getSource) && layer.getSource().getSource() instanceof ol.source.Vector) {
        /* GPX/KML layers */
        this.reloadVectorSource(layer.getSource().getSource());
    }
};

/**
 * Reload the data from a vector source (layer refresh)
 * See: https://github.com/openlayers/ol3/issues/2683
 * @param {ol.source.Vector} source
 */
magic.classes.LayerTree.prototype.reloadVectorSource = function(source) {
    jQuery.ajax(source.getUrl(), function(response) {
        var format = source.getFormat();
        source.clear(true);
        source.addFeatures(format.readFeatures(response));
    });
};

/**
 * Figures out which (if any) field in the attribute map is designed to be the feature label
 * @param {Array} attrMap
 * @returns {undefined}
 */
magic.classes.LayerTree.prototype.getLabelField = function(attrMap) {
    var labelField = null;
    if (jQuery.isArray(attrMap)) {
        jQuery.each(attrMap, function(idx, attr) {
            if (attr.label === true) {
                labelField = attr.name;
                return(false);
            }
        });
    }
    return(labelField);
};

/**
 * Set layer visibility
 * @param {jQuery.Object} chk
 * @param {boolean} forceOff
 */
magic.classes.LayerTree.prototype.setLayerVisibility = function(chk, forceOff) {   
    var id = chk.prop("id");
    var nodeid = this.getNodeId(id);
    var layer = this.nodeLayerTranslation[nodeid];
    if (id.indexOf("base-layer-rb") == 0) {
        /* Base layer visibility change */
        jQuery.each(this.layersBySource["base"], jQuery.proxy(function (bli, bl) {                
            bl.setVisible(bl.get("metadata")["id"] == nodeid);
        }, this));            
        /* Trigger baselayerchanged event */
        jQuery.event.trigger({
            type: "baselayerchanged",
            layer: layer
        });
    } else if (id.indexOf("layer-rb") == 0) {
        /* Layer visibility change in a one-only display group - http://redmine.nerc-bas.ac.uk/issues/4538 */
        var rbName = chk.prop("name");
        jQuery("input[name='" + rbName + "']").each(jQuery.proxy(function(idx, elt) {
            var bl = this.nodeLayerTranslation[this.getNodeId(jQuery(elt).prop("id"))];
            if (forceOff === true) {
                bl.setVisible(false);
            } else {
                bl.setVisible(bl.get("metadata")["id"] == nodeid);
            }
        }, this));                      
    } else {
        /* Overlay layer visibility change */        
        layer.setVisible(chk.prop("checked"));
        var md = layer.get("metadata");
        if (md && md.source && md.source.is_time_dependent) {
            /* Display time-series movie player for layer */
            if (!this.moviePlayers[md.id]) {
                /* Find enclosing div */
                var lgp = jQuery("#vis-wrapper-" + md.id).closest("div[id^='layer-group-panel-']");
                this.moviePlayers[md.id] = new magic.classes.MosaicTimeSeriesPlayer({
                    "nodeid": md.id, 
                    "target": "vis-wrapper-" + md.id, 
                    "container": lgp ? "#" + lgp.prop("id") : "body",
                    "layer": layer
                });
            }
            if (chk.prop("checked")) {
                this.moviePlayers[md.id].activate(jQuery.proxy(function() {
                    if (navigator.appVersion.toLowerCase().indexOf("chrome") >= 0) {
                        /* Appalling hack to work round nasty Chrome refresh bug when showing popover - elements in layer tree randomly disappear - 2017-06-21 */
                        console.log("Chrome refresh workaround for movie player show - test periodically if this is still needed!");
                        /* Force a refresh via tiny resize and back */
                        jQuery("#" + this.target).css("width", "351px");
                    }
                }, this));                
            } else {
                this.moviePlayers[md.id].deactivate(jQuery.proxy(function() {
                    if (navigator.appVersion.toLowerCase().indexOf("chrome") >= 0) {
                        /* Appalling hack to work round nasty Chrome refresh bug when hiding popover - elements in layer tree randomly disappear - 2017-06-21 */
                        console.log("Chrome refresh workaround for movie player hide - test periodically if this is still needed!");
                        /* Force a refresh via tiny resize and back */
                        jQuery("#" + this.target).css("width", "350px");
                    }
                }, this));
            }            
        }
    }    
};

/**
 * Handle layer visibility
 * @param {jQuery.Event} evt
 */
magic.classes.LayerTree.prototype.layerVisibilityHandler = function(evt) {
    this.setLayerVisibility(jQuery(evt.currentTarget));    
    this.refreshTreeIndicators(jQuery(evt.currentTarget).parents("div.layer-group"));
};

/**
 * Handler for group visibility checkbox
 * @param {jQuery.Event} evt
 */
magic.classes.LayerTree.prototype.groupVisibilityHandler = function(evt) { 
    var chk = jQuery(evt.currentTarget);
    var checked = chk.prop("checked");
    jQuery.each(chk.closest("div.panel").find("input[type='checkbox']"), jQuery.proxy(function(idx, cb) {
        var jqCb = jQuery(cb);
        if (jqCb.hasClass("layer-vis-selector")) {
            /* Layer visibility */
            jqCb.off("change").prop("checked", checked).change(jQuery.proxy(this.layerVisibilityHandler, this));
            this.setLayerVisibility(jqCb);
        } else {
            /* Group visibility */
            jqCb.off("change").prop("checked", checked).change(jQuery.proxy(this.groupVisibilityHandler, this));
        }
    }, this)); 
    this.refreshTreeIndicators(chk.parents("div.layer-group"));
};

/**
 * Recurse down the tree setting indicator badges, filtering the work by the supplied parental branch
 * @param {Array} branchHierarchy
 */
magic.classes.LayerTree.prototype.refreshTreeIndicators = function(branchHierarchy) {    
    this.layerGroupDivs.each(jQuery.proxy(function(idx, elt) {
        if (!jQuery.isArray(branchHierarchy) || (jQuery.isArray(branchHierarchy) && jQuery.inArray(elt, branchHierarchy) != -1)) {
            var jqp = jQuery(elt);
            var cbs = jqp.find("input[id^='layer-cb-']");
            var cbx = cbs.filter(":checked");
            if (cbx.length == cbs.length) {
                /* Additionally check the group checkbox for this panel */
                var gcb = jqp.first().find("input[id^='group-cb-']");
                if (gcb.length > 0) {
                    gcb.off("change").prop("checked", true).change(jQuery.proxy(this.groupVisibilityHandler, this));
                }
            } else {
                /* Additionally uncheck the group checkbox for this panel */
                var gcb = jqp.first().find("input[id^='group-cb-']");
                if (gcb.length > 0) {
                    gcb.off("change").prop("checked", false).change(jQuery.proxy(this.groupVisibilityHandler, this));
                }
            }    
            var badge = jqp.first().find("span.checked-indicator-badge");
            if (badge.length > 0) {
                badge.html('<span class="fa fa-eye">&nbsp;</span>' + cbx.length + ' / ' + cbs.length);
                if (cbx.length == 0) {
                    badge.removeClass("show").addClass("hidden");
                } else {
                    badge.removeClass("hidden").addClass("show");
                }
            }
        }
    }, this));
};

/**
 * Translate style definition object to OL style
 * @param {object} styleDef
 * @param {string} labelField
 * @param {float} labelRotation (in radians)
 * @returns {Array[ol.style]}
 */
magic.classes.LayerTree.prototype.getVectorStyle = function(styleDef, labelField, labelRotation) {
    return(function(feature, resolution) {
        var returnedStyles = [];
        /* Determine feature type */
        var geomType = magic.modules.Common.getGeometryType(feature.getGeometry());
        var defaultFill =  {color: "rgba(255, 0, 0, 0.6)"};
        var defaultStroke = {color: "rgba(255, 0, 0, 1.0)", width: 1};   
        var fill = null, stroke = null, graphic = null, text = null;
        if (styleDef) {
            if (!jQuery.isEmptyObject(styleDef.predefined) && styleDef.predefined.key) {
                /* Canned vector style */
                return(jQuery.proxy(magic.modules.VectorStyles[styleDef.predefined.key](), feature)());
            } else {
                /* Unpack symbology */
                if (styleDef.fill) {
                    fill = new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec(styleDef.fill.color, styleDef.fill.opacity)
                    });
                } else {
                    fill = jQuery.extend({}, defaultFill);
                }
                if (styleDef.stroke) {
                    var lineStyle = styleDef.stroke.style == "dashed" ? [3, 3] : (styleDef.stroke.style == "dotted" ? [1, 1] : undefined);
                    stroke = new ol.style.Stroke({
                        color: magic.modules.Common.rgbToDec(styleDef.stroke.color, styleDef.stroke.opacity),
                        lineDash: lineStyle,
                        width: styleDef.stroke.width || 1
                    });
                } else {
                    stroke = jQuery.extend({}, defaultStroke);
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
                text = undefined;
                if (labelField) {
                    /* Transparent text, made opaque on mouseover */
                    var textColor = magic.modules.Common.rgbToDec(styleDef.stroke.color, 0.0)
                    text = new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 10,
                        text: feature.get(labelField) + "",
                        textAlign: "left",
                        fill: new ol.style.Fill({
                            color: textColor
                        }),
                        rotation: labelRotation,
                        stroke: new ol.style.Stroke({
                            color: "rgba(255, 255, 255, 0.0)",
                            width: 1
                        })
                    });                
                }         
            }
        } else {
            /* Default style */
            fill = jQuery.extend({}, defaultFill);
            stroke = jQuery.extend({}, defaultStroke);
            graphic =  new ol.style.Circle({
                radius: 5, 
                fill: fill,
                stroke: stroke
            });
            text = undefined;            
        }
        switch (geomType) {
            case "polygon":
                returnedStyles.push(new ol.style.Style({
                    fill: fill,
                    stroke: stroke,
                    text: text
                }));
                break;
            case "line":
                returnedStyles.push(new ol.style.Style({
                    stroke: stroke,
                    text: text
                }));
                break;
            case "collection":
                var geoms = feature.getGeometry().getGeometries();
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.Common.getGeometryType(geoms[i]);
                    if (gtype == "point") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            image: graphic,                    
                            text: text
                        }));
                    /* Originally for AAD demonstrator - they export tracks which are monotonically increasing in size and look a real mess rendered */
                    } /*else if (gtype == "line") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            stroke: stroke,
                            text: text
                        }));
                    } else if (gtype == "polygon") {
                        returnedStyles.push(new ol.style.Style({
                            geometry: geoms[i],
                            fill: fill,
                            stroke: stroke,
                            text: text
                        }));
                    }*/
                }
                break;
            default: 
                returnedStyles.push(new ol.style.Style({
                    image: graphic,                    
                    text: text
                }));
                break;                   
        }
        return(returnedStyles);
    });
};

/**
 * Do a longhand find of an ol layer by feature name
 * @param {String} fname
 * @returns {ol.Layer}
 */
magic.classes.LayerTree.prototype.getLayerByFeatureName = function(fname) {
    var targetLayer = null;
    jQuery.each(this.nodeLayerTranslation, jQuery.proxy(function(uuid, layer) {
        var md = layer.get("metadata");
        if (md && md.source && md.source.feature_name ) {
            targetLayer = layer;
            return(false);
        }
        return(true);
    }, this));
    return(targetLayer);
};

/**
 * Typeahead handler for layer search
 * @param {Array} data
 * @return {Function}
 */
magic.classes.LayerTree.prototype.layerMatcher = function(data) {
    return(function(query, callback) {
        var matches = [];
        var re = new RegExp(query, "i");
        $.each(data, function(itemno, item) {
            if (re.test(item.layer)) {
                matches.push(item.layer);
            }
        });
        callback(matches);
    });
};

/**
 * Get layer attribute from the user data payload
 * @param {String} layerId
 * @param {String} attrName
 * @param {Number|Boolean} defVal
 * @return {string}
 */
magic.classes.LayerTree.prototype.userLayerAttribute = function(layerId, attrName, defVal) {
    var attrVal = null;
    if (this.userdata != null && "layers" in this.userdata && layerId in this.userdata.layers) {        
        attrVal = this.userdata.layers[layerId][attrName];
    } else {
        attrVal = defVal;
    }
    return(attrVal);
};

/**
 * Get layer group expanded state from user data payload
 * @param {String} groupId
 * @param {boolean} defVal
 * @return {boolean}
 */
magic.classes.LayerTree.prototype.userGroupExpanded = function(groupId, defVal) {
    var attrVal = false;
    if (this.userdata != null && "groups" in this.userdata && groupId in this.userdata.groups) {        
        attrVal = this.userdata.groups[groupId];
    } else {
        attrVal = defVal;
    }
    return(attrVal);
};
