/* Layer tree */

magic.classes.LayerTree = function (target, embedded) {

    this.target = target || "layer-tree";
    
    this.embedded = embedded === true;

    this.treedata = magic.runtime.mapdata.layers || [];

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
    
    /* Groups which require an autoload (keyed by uuid) */
    this.autoloadGroups = {};
    
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
    this.initLayerSearchTypeahead();

    this.collapsed = false;

    if (!this.embedded) {
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
        
        /* Search layer tree for data layer handler */
        
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

        /* Assign layer visibility handlers */
        jQuery("input.layer-vis-selector").change(jQuery.proxy(this.layerVisibilityHandler, this));        

        /* Assign layer group visibility handlers */
        jQuery("input.layer-vis-group-selector").change(jQuery.proxy(this.groupVisibilityHandler, this));        

        /* The get layer info buttons */
        jQuery("span[id^='layer-info-']").on("click", jQuery.proxy(function (evt) {
            var id = evt.currentTarget.id;
            var nodeid = this.getNodeId(id);
            magic.runtime.attribution.show(this.nodeLayerTranslation[nodeid]);
        }, this));
    
        /* Layer dropdown handlers */
        jQuery("a.layer-tool").click(jQuery.proxy(function (evt) {
            var id = evt.currentTarget.id;
            var nodeid = this.getNodeId(id);
            new magic.classes.LayerTreeOptionsMenu({
                nodeid: nodeid,
                layer: this.nodeLayerTranslation[nodeid]
            });
        }, this));   

        /* Change tooltip for collapsible panels */
        jQuery("div[id^='layer-group-panel-']")
        .on("shown.bs.collapse", jQuery.proxy(function (evt) {       
            jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Collapse this group").tooltip("fixTitle");
            evt.stopPropagation();
        }, this))
        .on("hidden.bs.collapse", jQuery.proxy(function (evt) {        
            jQuery(evt.currentTarget).parent().first().find("span.panel-title").attr("data-original-title", "Expand this group").tooltip("fixTitle");
            evt.stopPropagation();
        }, this));

        /* Initialise checked indicator badges in layer groups */
        jQuery("input[id^='layer-cb-']:checked").each(jQuery.proxy(function(idx, elt) {
            this.setLayerVisibility(jQuery(elt));
        }, this));
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
 * Insert per-node properties and styling into layer tree structure, as well as creating OL layers where needed
 * @param {array} nodes
 * @param {jQuery,Object} element
 * @param {int} depth
 */
magic.classes.LayerTree.prototype.initTree = function (nodes, element, depth) {
    jQuery.each(nodes, jQuery.proxy(function (i, nd) {
        if (jQuery.isArray(nd.layers)) {
            /* Style a group */
            var title = (nd.expanded ? "Collapse" : "Expand") + " this group";
            var hbg = depth == 0 ? "panel-primary" : (depth == 1 ? "panel-info" : "");
            var topMargin = i == 0 ? "margin-top:5px" : "";
            element.append(
                    ((element.length > 0 && element[0].tagName.toLowerCase() == "ul") ? '<li class="list-group-item layer-list-group-group" id="layer-item-' + nd.id + '">' : "") +
                    '<div class="panel ' + hbg + ' center-block layer-group" style="' + topMargin + '">' +
                        '<div class="panel-heading" id="layer-group-heading-' + nd.id + '">' +
                            '<span class="icon-layers"></span>' +
                            (nd.base ? '<span style="margin:5px"></span>' : '<input class="layer-vis-group-selector" id="group-cb-' + nd.id + '" type="checkbox" />') +
                            (nd.base ? '' : '<span class="badge checked-indicator-badge hidden"><span class="fa fa-eye">&nbsp;</span>0</span>') + 
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
            this.initTree(nd.layers, jQuery("#layer-group-" + nd.id), depth + 1);
            if (nd.autoload === true) {
                /* Layers to be autoloaded from local server later */
                this.autoloadGroups[nd.id] = nd.autoload_filter;
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
 */
magic.classes.LayerTree.prototype.addDataNode = function(nd, element) {
    var cb;
    var isWms = "wms_source" in nd.source;
    var isSingleTile = isWms ? nd.source.is_singletile === true : false;
    var isBase = isWms ? nd.source.is_base === true : false;
    var isInteractive = nd.is_interactive === true;
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
    var isVisible = nd.is_visible;
    if (magic.runtime.search && magic.runtime.search.visible && magic.runtime.search.visible[name]) {
        isVisible = magic.runtime.search.visible[name];
    }
    if (isBase) {
        cb = '<input class="layer-vis-selector" name="base-layers-rb" id="base-layer-rb-' + nd.id + '" type="radio" ' + (isVisible ? "checked" : "") + '/>';
    } else {
        cb = '<input class="layer-vis-selector" id="layer-cb-' + nd.id + '" type="checkbox" ' + (isVisible ? "checked" : "") + '/>';
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
                    '<a href="Javascript:void(0)">' + 
                        '<span id="layer-filter-badge-' + nd.id + '" class="badge filter-badge hidden" ' + 
                        'data-toggle="tooltip" data-placement="right" title="">filter</span>' +
                    '</a>' + 
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
                url: nd.source.wms_source,
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": nd.source.style_name ? (nd.source.style_name == "default" ? "" : nd.source.style_name) : ""
                },
                projection: proj
            }));
            layer = new ol.layer.Image({
                name: name,
                visible: isVisible,
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
                opacity: nd.opacity || 1.0,
                minResolution: minRes,
                maxResolution: maxRes,
                metadata: nd,
                source: wmsSource
            });
        }
        layer.setZIndex(isBase ? 0 : 50);
        this.layersBySource[isBase ? "base" : "wms"].push(layer);                                
    } else if (nd.source.geojson_source) {
        /* GeosJSON layer */
        var labelRotation = nd.source.feature_name ? 0.0 : -magic.runtime.viewdata.rotation;
        var format = new ol.format.GeoJSON();
        var url = nd.source.geojson_source;
        if (nd.source.feature_name) {                           
            /* WFS */
            url += "?service=wfs&request=getfeature&outputFormat=application/json&" + 
                "typename=" + nd.source.feature_name + "&" + 
                "srsname=" + (nd.source.srs || "EPSG:4326");                    
        }
        var vectorSource = new ol.source.Vector({
            format: format,
            url: magic.modules.Common.proxyUrl(url)
        });
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
        layer.setZIndex(200);
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
        layer.setZIndex(200);
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
 */
magic.classes.LayerTree.prototype.initAutoLoadGroups = function() {
    $.each(this.autoloadGroups, function(grpid, grpftr) {
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/gs/layers/filter/" + grpftr, 
            method: "GET",
            dataType: "json",
            contentType: "application/json"
        }).done(jQuery.proxy(function(data) {
            if (jQuery.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    var fname = data[i];
                    jQuery.ajax({
                        url: magic.config.paths.baseurl + "/gs/attributes/" + fname, 
                        method: "GET",
                        dataType: "json",
                        contentType: "application/json"
                    }).done(jQuery.proxy(function(attrData) {
                                   
                    }, this));
                }
            }                   
        }, this)).fail(jQuery.proxy(function(xhr) {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                '</div>'
            );
        }, this));
    });
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
 */
magic.classes.LayerTree.prototype.setLayerVisibility = function(chk) {
    var id = chk.prop("id");
    var nodeid = this.getNodeId(id);
    var layer = this.nodeLayerTranslation[nodeid];
    if (id.indexOf("base-layer-rb") != -1) {
        /* Base layer visibility change */
        jQuery.each(this.layersBySource["base"], jQuery.proxy(function (bli, bl) {                
            bl.setVisible(bl.get("metadata")["id"] == nodeid);
        }, this));            
        /* Trigger baselayerchanged event */
        jQuery.event.trigger({
            type: "baselayerchanged",
            layer: layer
        });
    } else {
        /* Overlay layer visibility change */        
        layer.setVisible(chk.prop("checked"));
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
    this.refreshTreeIndicators(jQuery(evt.currentTarget).parents("div.layer-group"));
};

/**
 * Recurse down the tree setting indicator badges, filtering the work by the supplied parental branch
 * @param {Array} branchHierarchy
 */
magic.classes.LayerTree.prototype.refreshTreeIndicators = function(branchHierarchy) {    
    jQuery("#" + this.target).find("div.layer-group").each(jQuery.proxy(function(idx, elt) {
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
 * For the embedded Apex maps primarily - do a longhand find of an ol layer by feature name
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
