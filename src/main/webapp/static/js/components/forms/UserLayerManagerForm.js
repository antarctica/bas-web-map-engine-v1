/* User uploaded layer manager */

magic.classes.UserLayerManagerForm = function(options) {
    
    /* API options */    
    this.id = options.id || "layer-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;    
   
    /* Styler popup tool */
    this.stylerPopup = null;
    
    /* Layer editor popup tools */
    this.editorPopups = {
        "add": null,
        "edit": null
    };
    
    /* zIndex of the top of the WMS stack in the map, insertion point for new layers */
    this.zIndexWmsStack = -1;    
    
    /* Data from a saved map indicating visibility, transparency etc of user layers */
    this.userPayloadConfig = magic.runtime.map_context.userdata ? (magic.runtime.map_context.userdata.layers || {}) : {};
    
    /* Layer data keyed by id */
    this.userLayerData = {}; 
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    
    /* Current selection tracker */
    this.currentSelection = null;
    
};

magic.classes.UserLayerManagerForm.prototype.init = function() {
   
    /* Get top of WMS stack */
    this.zIndexWmsStack = this.getWmsStackTop(this.map);  
    
    /* Load the available user layers from server */
    this.fetchLayers(jQuery.proxy(function(uldata) {          
        /* Record the layer data, and create any visible layers */
        jQuery.each(uldata, jQuery.proxy(function(idx, ul) {
            var vis = this.userPayloadConfig[ul.id] ? this.userPayloadConfig[ul.id].visibility : false;
            this.provisionLayer(ul, vis);            
        }, this));       
        /* Tabulate the layer markup */
        this.layerMarkup();
        this.assignHandlers();
        this.restoreState();
    }, this));
};

magic.classes.UserLayerManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    /* Dropdown layer selection handler */
    form.find("a[id$='-layer-select']").click(jQuery.proxy(this.selectLayer, this));
   
    /* Layer visibility checkboxes change handler */
    form.find("[id$='-layer-vis']").change(jQuery.proxy(this.selectLayer, this));
    
    /* Legend button handlers */
    form.find("[id$='-layer-legend']").popover({
        container: "body",
        html: true,
        trigger: "manual",
        content: jQuery.proxy(function(evt) {
            if (this.currentSelection && this.userLayerData[this.currentSelection]) {
                var md = this.userLayerData[this.currentSelection];
                var legendUrl = md.service + 
                    "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20&styles=&layer=" + md.layer + 
                    "&legend_options=fontName:Bitstream Vera Sans Mono;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180";
                return('<img src="' + legendUrl + '" alt="legend">');
            }
        }, this)
    });
    form.find("button[id$='-layer-legend']").on("mouseover", function(evt) {
        jQuery(evt.currentTarget).popover("show");
    }).on("mouseout", function(evt) {
        jQuery(evt.currentTarget).popover("hide");
    });
    
    /* Zoom to layer link handlers */
    form.find("[id$='-layer-ztl']").click(jQuery.proxy(function(evt) {        
        if (this.currentSelection) {
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/userlayers/" + this.currentSelection + "/extent", 
                method: "GET",
                dataType: "json",
                contentType: "application/json"
            }).done(jQuery.proxy(function(data) {
                if (!jQuery.isArray(data)) {
                    data = JSON.parse(data);
                }
                var projExtent = magic.modules.GeoUtils.extentFromWgs84Extent(data);
                if (projExtent) {
                    this.map.getView().fit(projExtent, this.map.getSize());
                }
            }, this));
        }
    }, this));
    
    /* WMS URL links */
    form.find("[id$='-layer-wms']").click(jQuery.proxy(function(evt) {             
        bootbox.prompt({
            "title": "WMS URL",
            "value": this.layerWmsUrl(),
            "callback": function(){}
        });
    }, this));
    
    /* Direct data URL link */
    form.find("[id$='-layer-url']").click(jQuery.proxy(function(evt) {             
        bootbox.prompt({
            "title": "Direct data feed URL",
            "value": this.layerDirectUrl(),
            "callback": function(){}
        });
    }, this));        
    
    /* Data download link */
    form.find("[id$='-layer-dld']").click(jQuery.proxy(function(evt) {
        window.open(this.layerDirectUrl());       
    }, this));
    
    /* New user layer button */
    jQuery("#" + this.id + "-user-layer-add").click(jQuery.proxy(function(evt) {
        if (!this.editorPopups.add) {
            this.editorPopups.add = new magic.classes.LayerEditorPopup({
                id: "layer-add-popup-tool",
                caption: "Add new layer",
                target: evt.currentTarget.id,
                onSave: jQuery.proxy(this.init, this)
            });
        } 
        if (this.editorPopups.edit) {
            this.editorPopups.edit.deactivate();
        }
        this.editorPopups.add.activate({});
    }, this));
    
    /* Edit user layer button */
    jQuery("#" + this.id + "-user-layer-edit").click(jQuery.proxy(function(evt) {   
        if (!this.editorPopups.edit) {
            this.editorPopups.edit = new magic.classes.LayerEditorPopup({
                id: "layer-edit-popup-tool",
                caption: "Edit existing layer data",
                target: evt.currentTarget.id,
                onSave: jQuery.proxy(this.init, this)
            });
        } 
        if (this.editorPopups.add) {
            this.editorPopups.add.deactivate();
        }
        this.editorPopups.edit.activate(this.userLayerData[this.currentSelection]);
    }, this));
    
    /* Delete user layer button */
    jQuery("#" + this.id + "-user-layer-del").click(jQuery.proxy(function(evt) {            
        evt.preventDefault();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var id = this.currentSelection;
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/userlayers/delete/" + id,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                        var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(jQuery.proxy(function(uldata) {
                    /* Now delete the corresponding layer and data */
                    if (this.userLayerData[id] && this.userLayerData[id].olLayer) {
                        this.map.removeLayer(this.userLayerData[id].olLayer);
                        delete this.userLayerData[id];
                    }
                    /* Reload the layers */
                    this.init();
                }, this))
                .fail(function (xhr) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to delete user layer - details below:</p>' + 
                            '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                        '</div>'
                    );
                });                   
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }                            
        }, this));               
    }, this));  
    
};

/**
 *  Scan the user layer data, sort into lists of user and community layers, ordered by caption 
 */
magic.classes.UserLayerManagerForm.prototype.layerMarkup = function() {
    var userLayers = [], communityLayers = [];
    jQuery.each(this.userLayerData, function(layerId, layerData) {
        if (layerData.owner == magic.runtime.map_context.username) {
            /* User layer */
            userLayers.push(layerData);
        } else {
            /* Community layer */
            communityLayers.push(layerData);
        }
    });
    /* Alphabetically sort both arrays in order of caption */
    userLayers.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    communityLayers.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    
    var userLayerInsertAt = jQuery("#" + this.id + "-user-layers");
    userLayerInsertAt.empty();
    if (userLayers.length == 0) {
        /* No records */
        userLayerInsertAt.append('<li class="dropdown-header">There are currently no user uploaded layers</li>');
    } else {
        /* Dropdown markup */
        var idBase = this.id;
        userLayerInsertAt.append(
            '<li class="dropdown-header">' + 
                '<div style="display:inline-block;width:20px">Vis</div>' + 
                '<div style="display:inline-block;width:50px">Owner</div>' + 
                '<div style="display:inline-block;width:200px">Name</div>' + 
            '</li>'
        );
        jQuery.each(userLayers, function(idx, ul) {
            userLayerInsertAt.append(
                '<li data-pk="' + ul.id + '">' + 
                    '<a id="' + idBase + '-' + ul.id + '-user-layer-select" href="JavaScript:void(0)">' + 
                        '<div style="display:inline-block;width:20px">' + 
                            '<input id="' + idBase + '-' + ul.id + '-user-layer-vis" type="checkbox"' + 
                                (ul.olLayer != null && ul.olLayer.getVisible() ? ' checked="checked"' : '') + '>' + 
                            '</input>' +
                        '</div>' + 
                        '<div style="display:inline-block;width:50px">' + 
                            ul.owner + 
                        '</div>' + 
                        '<div style="display:inline-block;width:200px" data-toggle="tooltip" data-html="true" data-placement="bottom" ' + 
                            'title="' + ul.description + '<br/>Modified on : ' + magic.modules.Common.dateFormat(ul.modified_date, "dmy") + '">' + 
                            magic.modules.Common.ellipsis(ul.caption, 30) + 
                        '</div>' + 
                    '</a>' + 
                '</li>'
            );
        });
    }
    var communityLayerInsertAt = jQuery("#" + this.id + "-community-layers");
    communityLayerInsertAt.empty();
    if (communityLayers.length == 0) {
        /* No records */
        communityLayerInsertAt.append('<li class="dropdown-header">There are currently no community uploaded layers</li>');
    } else {
        /* Dropdown markup */
        var idBase = this.id;
        communityLayerInsertAt.append(
            '<li class="dropdown-header">' + 
                '<div style="display:inline-block;width:20px">Vis</div>' + 
                '<div style="display:inline-block;width:50px">Owner</div>' + 
                '<div style="display:inline-block;width:200px">Name</div>' + 
            '</li>'
        );
        jQuery.each(communityLayers, function(idx, cl) {
            communityLayerInsertAt.append(
                '<li data-pk="' + cl.id + '">' + 
                    '<a id="' + idBase + '-' + cl.id + '-community-layer-select" href="JavaScript:void(0)">' + 
                        '<div style="display:inline-block;width:20px">' + 
                            '<input id="' + idBase + '-' + cl.id + '-community-layer-vis" type="checkbox"' + 
                                (cl.olLayer != null && cl.olLayer.getVisible() ? ' checked="checked"' : '') + '>' + 
                            '</input>' +
                        '</div>' + 
                        '<div style="display:inline-block;width:50px">' + 
                            cl.owner + 
                        '</div>' + 
                        '<div style="display:inline-block;width:200px" data-toggle="tooltip" data-html="true" data-placement="bottom" ' + 
                            'title="' + cl.description + '<br/>Modified on : ' + magic.modules.Common.dateFormat(ul.modified_date, "dmy") + '">' + 
                            magic.modules.Common.ellipsis(cl.caption, 30) + 
                        '</div>' +  
                    '<div>' + 
                '</li>'
            );
        });
    }
};

magic.classes.UserLayerManagerForm.prototype.markup = function() {
    return(
        '<form id="' + this.id + '-form" class="form-horizontal" role="form" enctype="multipart/form-data" style="margin-top:10px">' +             
            '<div class="btn-toolbar" style="margin-bottom:10px">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-user-layer-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Your uploaded layers&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-user-layers" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-user-layer-legend" class="btn btn-sm btn-info" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="left" >' + 
                        '<i style="pointer-events:none" title="Layer legend" class="fa fa-list"></i>' + 
                    '</button>' +
                    '<button id="' + this.id + '-user-layer-add" class="btn btn-sm btn-primary" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Add a new layer" class="fa fa-star"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.id + '-user-layer-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit layer data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-user-layer-del">' +
                        '<i data-toggle="tooltip" data-placement="top" title="Delete this layer" class="fa fa-trash"></i>' + 
                    '</button>' + 
                '</div>' + 
                '<div class="btn-group dropdown" role="group">' + 
                    '<button id="' + this.id + '-user-layer-actions" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" data-container="body">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Further actions" class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul class="dropdown-menu dropdown-menu-right" style="overflow:auto">' + 
                        '<li><a id="' + this.id + '-user-layer-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                        '<li role="separator" class="divider"></li>' + 
                        '<li><a id="' + this.id + '-user-layer-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                        '<li><a id="' + this.id + '-user-layer-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                        '<li><a id="' + this.id + '-user-layer-dld" href="Javascript:void(0)">Download data</a></li>' + 
                    '</ul>' + 
                '</div>' + 
            '</div>' + 
            '<div class="btn-toolbar">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-community-layer-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Community layers&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-community-layers" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' +      
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-community-layer-legend" class="btn btn-sm btn-info" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="left" >' + 
                        '<i style="pointer-events:none" title="Layer legend" class="fa fa-list"></i>' + 
                    '</button>' +                         
                '</div>' + 
                '<div class="btn-group dropdown" role="group">' + 
                    '<button id="' + this.id + '-community-layer-actions" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" data-container="body">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Further actions" class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul class="dropdown-menu dropdown-menu-right">' + 
                        '<li><a id="' + this.id + '-community-layer-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                        '<li role="separator" class="divider"></li>' + 
                        '<li><a id="' + this.id + '-community-layer-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                        '<li><a id="' + this.id + '-community-layer-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                        '<li><a id="' + this.id + '-community-layer-dld" href="Javascript:void(0)">Download data</a></li>' + 
                    '</ul>' + 
                '</div>' + 
            '</div>' + 
        '</form>'         
    );
};

/**
 * Set the selection button caption to the name of the currently focussed layer, and indicate visibility on the map
 * @param {jQuery.Event} selection event
 */
magic.classes.UserLayerManagerForm.prototype.selectLayer = function(evt) {
    var selId = null;
    var targetId = evt.currentTarget.id;
    var elt = jQuery("#" + targetId);
    if (elt.length > 0) {
        selId = elt.closest("li").attr("data-pk");
    }        
    if (selId != null && selId != "") {
        var ztlId = null;
        var isChecked = false;        
        if (elt.attr("type") == "checkbox") {
            isChecked = elt.prop("checked");
            this.provisionLayer(this.userLayerData[selId], isChecked);
            ztlId = targetId.replace(/-vis$/, "-ztl").replace(selId + "-", "");
        } else {
            ztlId = targetId.replace(/-select$/, "-ztl").replace(selId + "-", "");
        }
        /* Enable/disable the zoom to layer link for this layer according to checkbox state */
        var ztl = jQuery("#" + ztlId);
        if (isChecked) {
            ztl.closest("li").removeClass("disabled");
        } else {
            ztl.closest("li").addClass("disabled");
        }
        /* Set the dropdown button caption and visibility indicator */
        elt.closest(".dropdown-menu").prev().html(
            '<i class="fa fa-eye' + (isChecked ? "" : "-slash") + '" style="font-size:16px"></i>&nbsp;&nbsp;' + 
            magic.modules.Common.ellipsis(this.userLayerData[selId].caption, 25) + "&nbsp;&nbsp;" + 
            '<span class="caret"></span>'
        );
        /* Finally record the current selection */
        this.currentSelection = selId;
    }
};

magic.classes.UserLayerManagerForm.prototype.saveState = function() {    
    this.savedState = {
        editing: this.currentSelection || null
    };
    console.log("============ Save state ============");
    console.log(this.savedState);
    console.log("============ Done ============");
};

magic.classes.UserLayerManagerForm.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        console.log("============ Restore state ============");
        console.log(this.savedState);
        console.log("============ Done ============");
        jQuery("#" + this.savedState.editing).trigger("click");
        this.savedState = {};
    }
};

/**
 * Fetch data on all uploaded layers user has access to
 * @param {Function} cb
 */
magic.classes.UserLayerManagerForm.prototype.fetchLayers = function(cb) {    
    /* Load the available user layers */
    jQuery.ajax({
        url: magic.config.paths.baseurl + "/userlayers/data", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    }).done(jQuery.proxy(function(uldata) {
        /* Alphabetical order of caption */
        uldata.sort(function(a, b) {
            return(a.caption.localeCompare(b.caption));
        });
        cb(uldata);
    }, this)).fail(function() {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load available user layers</div>');
    });
};

/**
 * Lazily create layer from fetched data if required
 * @param {Object} layerData
 * @param {boolean} visible
 * @return {ol.Layer}
 */
magic.classes.UserLayerManagerForm.prototype.provisionLayer = function(layerData, visible) {     
    var olLayer = null;    
    var exData = this.userLayerData[layerData.id];
    var exLayer = exData ? exData.olLayer : null;    
    if (exLayer == null) {
        /* Check layers on map for the id */        
        this.map.getLayers().forEach(function (layer) {
            var md = layer.get("metadata");                        
            if (md && md.id == layerData.id) {
                exLayer = layer;
            }
        });
    }
    if (exLayer == null) {
        if (visible) {
            /* We create the layer now */
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
            var styledef = layerData.styledef;
            if (typeof styledef === "string") {
                styledef = JSON.parse(styledef);
            }
            var geomType = (styledef["mode"] == "file" || styledef["mode"] == "default") ? "unknown" : styledef["mode"];
            var nd = jQuery.extend({}, {
                id: layerData.id,
                name: layerData.caption,
                geom_type: geomType,
                attribute_map: null
            }, defaultNodeAttrs);
            nd.source = jQuery.extend({}, {
                wms_source: layerData.service, 
                feature_name: layerData.layer
            }, defaultSourceAttrs);
            var proj = this.map.getView().getProjection(); 
            var resolutions = magic.runtime.map.getView().getResolutions();
            var wmsSource = new ol.source.TileWMS({
                url: magic.modules.Endpoints.getOgcEndpoint(nd.source.wms_source, "wms"),
                params: {
                    "LAYERS": nd.source.feature_name,
                    "STYLES": "",
                    "TRANSPARENT": true,
                    "CRS": proj.getCode(),
                    "SRS": proj.getCode(),
                    "VERSION": "1.3.0",
                    "TILED": true
                },
                tileGrid: new ol.tilegrid.TileGrid({
                    resolutions: resolutions,
                    origin: proj.getExtent().slice(0, 2)
                }),
                projection: proj
            });
            olLayer = new ol.layer.Tile({
                name: nd.name,
                visible: visible,
                opacity: this.userPayloadConfig[layerData.id] ? this.userPayloadConfig[layerData.id].opacity : 1.0,
                minResolution: resolutions[resolutions.length-1],
                maxResolution: resolutions[0]+1,
                metadata: nd,
                source: wmsSource
            });
            nd.layer = olLayer;    
            nd.layer.setZIndex(this.zIndexWmsStack++);
            this.map.addLayer(olLayer);
        }
    } else {
        /* Layer already exists, do a refresh in case the layer name has changed */
        olLayer = exLayer;
        if (jQuery.isFunction(olLayer.getSource().updateParams)) {
            olLayer.getSource().updateParams(jQuery.extend({}, 
                olLayer.getSource().getParams(), 
                {"LAYERS": layerData.layer, "buster": new Date().getTime()}
            ));
        }
        olLayer.setVisible(visible);
    }
    layerData.olLayer = olLayer;
    this.userLayerData[layerData.id] = layerData;
    return(olLayer);
};

/**
 * Return the WMS URL for the selected layer
 */
magic.classes.UserLayerManagerForm.prototype.layerWmsUrl = function() {
    if (this.currentSelection && this.userLayerData[this.currentSelection]) {
        var ld = this.userLayerData[this.currentSelection];
        return(magic.config.paths.baseurl + "/ogc/user/wms?SERVICE=WMS&" + 
            "VERSION=1.3.0&" + 
            "REQUEST=GetMap&" + 
            "FORMAT=image/png&" + 
            "TRANSPARENT=true&" + 
            "LAYERS=" + ld.layer + "&" + 
            "CRS=" + this.map.getView().getProjection().getCode() + "&" + 
            "SRS=" + this.map.getView().getProjection().getCode() + "&" + 
            "TILED=true&" + 
            "WIDTH=1000&" + 
            "HEIGHT=1000&" + 
            "STYLES=&" + 
            "BBOX=" + magic.runtime.map.getView().getProjection().getExtent().join(","));
    } else {
        return("");
    }
};

/**
 * Return the direct data URL for the selected layer
 */
magic.classes.UserLayerManagerForm.prototype.layerDirectUrl = function() {
    return(this.currentSelection ? magic.config.paths.baseurl + "/userlayers/" + this.currentSelection + "/data" : "");
};

/**
 * Get top of WMS layer stack in map
 * @return {Number|zi}
 */
magic.classes.UserLayerManagerForm.prototype.getWmsStackTop = function(map) {
    var maxStack = -1;
    map.getLayers().forEach(function (layer) {
        var zi = layer.getZIndex();
        if (zi < 400 && zi > maxStack) {
            maxStack = zi;
        }
    });
    return(maxStack);
};

/**
 * Zap any open pop-ups (used when changing tab)
 * @param {boolean} quiet suppress warnings about unsaved edits
 */
magic.classes.UserLayerManagerForm.prototype.tidyUp = function(quiet) {
    if (this.editorPopup) {
        this.editorPopup.deactivate(quiet);
    }
};
