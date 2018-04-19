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
    
    this.controls = {
        "user": {},
        "community": {}
    };
    
    /* zIndex of the top of the WMS stack in the map, insertion point for new layers */
    this.zIndexWmsStack = -1;    
    
    /* Data from a saved map indicating visibility, transparency etc of user layers */
    this.userPayloadConfig = magic.runtime.map_context.userdata ? (magic.runtime.map_context.userdata.layers || {}) : {};
    
    /* Layer data keyed by id */
    this.userLayerData = {}; 
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    this.clearState();
    
    /* Current selection tracker */
    this.currentSelection = null;
    this.setSelection();
    
    /* First time initialise flag, to allow initial layer visibility states from a user map payload to be applied once only */
    this.initialisedLayers = false;
    
};

magic.classes.UserLayerManagerForm.prototype.init = function() {
    
    this.editorPopups = {
        "add": null,
        "edit": null
    };
   
    /* Get top of WMS stack */
    this.zIndexWmsStack = this.getWmsStackTop(this.map);  
    
    /* Load the available user layers from server */
    this.fetchLayers(jQuery.proxy(function(uldata) {          
        /* Record the layer data, and create any visible layers */
        var vis;
        jQuery.each(uldata, jQuery.proxy(function(idx, ul) {
            if (!this.initialisedLayers) {
                /* Apply one-off visibility from user map payload */
                vis = this.userPayloadConfig[ul.id] ? this.userPayloadConfig[ul.id].visibility : false;
            } 
            this.provisionLayer(ul, vis, this.initialisedLayers);            
        }, this));          
        /* Tabulate the layer markup */
        this.layerMarkup();
        this.assignHandlers();        
        if (this.hasSavedState()) {
            /* Restore saved state */
            this.restoreState();   
        } else {
            /* Set the default button states */
            this.setButtonStates(null);      
        }
    }, this));
    
    /* Flag we have applied the user map payload data */
    this.initialisedLayers = true;
};

/**
 * Refresh the lists of layers after deletion
 */
magic.classes.UserLayerManagerForm.prototype.refreshLayerLists = function() {   
    this.zIndexWmsStack = this.getWmsStackTop(this.map);          
    this.layerMarkup();
    this.assignHandlers();
};

/**
 * Enable/disable button states according to received object
 * @param {Object} disableStates
 */
magic.classes.UserLayerManagerForm.prototype.setButtonStates = function(disableStates) {
    if (!disableStates) {
        var selUser = this.getSelection("user");
        var selComm = this.getSelection("community");
        disableStates = {
            "user": {
                "legend": selUser == null, "add": false, "edit": selUser == null, "del": selUser == null, "actions": selUser == null
            },
            "community": {
                "legend": selComm == null, "actions": selComm == null
            }
        };
    }
    for (var lt in this.controls) {
        jQuery.each(this.controls[lt].btn, function(k, v) {
            if (disableStates[lt][k]) {
                v.prop("disabled", true);
            } else {
                v.prop("disabled", false);
            }
        });
    }
};

magic.classes.UserLayerManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    this.controls = {
        "user": {
            "btn": {
                "legend": jQuery("#" + this.id + "-user-layer-legend"),
                "add": jQuery("#" + this.id + "-user-layer-add"),
                "edit": jQuery("#" + this.id + "-user-layer-edit"),
                "del": jQuery("#" + this.id + "-user-layer-del"),
                "actions": jQuery("#" + this.id + "-user-layer-actions")
            },
            "dd": {
                "ztl": jQuery("#" + this.id + "-user-layer-ztl"),
                "wms": jQuery("#" + this.id + "-user-layer-wms"),
                "url": jQuery("#" + this.id + "-user-layer-url"),
                "dld": jQuery("#" + this.id + "-user-layer-dld")
            }
        },
        "community": {
            "btn": {
                "legend": jQuery("#" + this.id + "-community-layer-legend"),
                "actions": jQuery("#" + this.id + "-community-layer-actions")
            },
            "dd": {
                "ztl": jQuery("#" + this.id + "-community-layer-ztl"),
                "wms": jQuery("#" + this.id + "-community-layer-wms"),
                "url": jQuery("#" + this.id + "-community-layer-url"),
                "dld": jQuery("#" + this.id + "-community-layer-dld")                
            }
        }
    };
    
    for (var lt in this.controls) {
                
        /* Dropdown layer selection handler */
        form.find("a[id$='-" + lt + "-layer-select']").off("click").on("click", {type: lt}, jQuery.proxy(this.selectLayer, this));
        
        /* Layer visibility checkboxes change handler */
        form.find("[id$='-" + lt + "-layer-vis']").off("change").on("change", {type: lt}, jQuery.proxy(this.selectLayer, this));               
        
        /* Zoom to layer link handlers */
        this.controls[lt].dd.ztl.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {  
            var selection = this.getSelection(evt.data.type);
            if (selection) {
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/userlayers/" + selection + "/extent", 
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
        this.controls[lt].dd.wms.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {             
            bootbox.prompt({
                "title": "WMS URL",
                "value": this.layerWmsUrl(evt.data.type),
                "callback": function(){}
            });
        }, this));

        /* Direct data URL link */
        this.controls[lt].dd.url.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {             
            bootbox.prompt({
                "title": "Direct data feed URL",
                "value": this.layerDirectUrl(evt.data.type),
                "callback": function(){}
            });
        }, this));        

        /* Data download link */
        this.controls[lt].dd.dld.off("click").on("click", {type: lt}, jQuery.proxy(function(evt) {
            window.open(this.layerDirectUrl(evt.data.type));       
        }, this));
    }
    
     /* Legend button handlers */
    this.addLegendHoverHandler("user");
    this.addLegendHoverHandler("community");    
    
    /* New user layer button */
    this.controls.user.btn.add.off("click").on("click", jQuery.proxy(function(evt) {        
        this.editorPopups.add = new magic.classes.LayerEditorPopup({
            id: "layer-add-popup-tool",
            caption: "Add new layer",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.edit) {
            this.editorPopups.edit.deactivate();
        }        
        this.editorPopups.add.activate({});
    }, this));
    
    /* Edit user layer button */
    this.controls.user.btn.edit.off("click").on("click", jQuery.proxy(function(evt) {        
        this.editorPopups.edit = new magic.classes.LayerEditorPopup({
            id: "layer-edit-popup-tool",
            caption: "Edit existing layer data",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.add) {
            this.editorPopups.add.deactivate();
        }        
        this.editorPopups.edit.activate(this.userLayerData[this.currentSelection.user]);
    }, this));
    
    /* Delete user layer button */
    this.controls.user.btn.del.off("click").on("click", jQuery.proxy(function(evt) {            
        evt.preventDefault();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var id = this.currentSelection.user;
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
                    }
                    /* Reload the layers */
                    delete this.userLayerData[id];
                    this.refreshLayerLists();
                    /* Reset the dropdown button caption and visibility indicator */
                    jQuery("#" + this.id + "-user-layer-select").html('Select a layer&nbsp;&nbsp;<span class="caret"></span>');                       
                    /* Reset the current selection and reset button statuses */
                    this.setSelection("user", null);
                    this.setButtonStates(null);
                }, this))
                .fail(function (xhr) {
                    var msg;
                    try {
                        msg = JSON.parse(xhr.responseText)["detail"];
                    } catch(e) {
                        msg = xhr.responseText;
                    }
                    magic.modules.Common.showAlertModal("Failed to delete user layer - details : " + msg, "warning");                    
                });                   
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }                            
        }, this));               
    }, this));  
    
};

magic.classes.UserLayerManagerForm.prototype.addLegendHoverHandler = function(lt) {
    this.controls[lt].btn.legend.popover("destroy");
    this.controls[lt].btn.legend.popover({
        container: "body",
        html: true,
        trigger: "hover",
        content: jQuery.proxy(function(evt) {
            var cont = "No legend available";
            var selId = this.currentSelection[lt];
            if (selId && this.userLayerData[selId]) {
                var md = this.userLayerData[selId];
                var cacheBuster = "&buster=" + new Date().getTime();
                var legendUrl = md.service + 
                    "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20&styles=&layer=" + md.layer + 
                    "&legend_options=fontName:Bitstream Vera Sans Mono;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180" + cacheBuster;
                cont = '<img src="' + legendUrl + '" alt="Legend"></img>';
            }        
            return('<div style="width:120px">' + cont + '</div>');
        }, this)
    });
};

/**
 *  Scan the user layer data, sort into lists of user and community layers, ordered by caption 
 */
magic.classes.UserLayerManagerForm.prototype.layerMarkup = function() {
    var layers = {
        "user": [],
        "community": []
    };
    jQuery.each(this.userLayerData, function(layerId, layerData) {
        if (layerData.owner == magic.runtime.map_context.username) {
            /* User layer */
            layers.user.push(layerData);
        } else {
            /* Community layer */
            layers.community.push(layerData);
        }
    });
    /* Alphabetically sort both arrays in order of caption */
    layers.user.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    layers.community.sort(function(a, b) {
        return(a.caption.localeCompare(b.caption));
    });
    
    var layerTypes = ["user", "community"];
    for (var i = 0; i < layerTypes.length; i++) {
        var lt = layerTypes[i];
        var layerInsertAt = jQuery("#" + this.id + "-" + lt + "-layers");
        layerInsertAt.empty();
        if (layers[lt].length == 0) {
            /* No records */
            layerInsertAt.append('<li class="dropdown-header">There are currently no user uploaded layers</li>');
        } else {
            /* Dropdown markup */
            var idBase = this.id;
            layerInsertAt.append(
                '<li class="dropdown-header">' + 
                    '<div style="display:inline-block;width:20px">Vis</div>' + 
                    '<div style="display:inline-block;width:100px">Owner</div>' + 
                    '<div style="display:inline-block;width:200px">Name</div>' + 
                '</li>'
            );
            jQuery.each(layers[lt], function(idx, ul) {
                layerInsertAt.append(
                    '<li data-pk="' + ul.id + '">' + 
                        '<a id="' + idBase + '-' + ul.id + '-' + lt + '-layer-select" href="JavaScript:void(0)">' + 
                            '<div style="display:inline-block;width:20px">' + 
                                '<input id="' + idBase + '-' + ul.id + '-' + lt + '-layer-vis" type="checkbox"' + 
                                    (ul.olLayer != null && ul.olLayer.getVisible() ? ' checked="checked"' : '') + '>' + 
                                '</input>' +
                            '</div>' + 
                            '<div style="display:inline-block;width:100px">' + 
                                ul.owner + 
                            '</div>' + 
                            '<div style="display:inline-block;width:200px" data-toggle="tooltip" data-html="true" data-placement="bottom" ' + 
                                'title="' + ul.caption + '<br>' + ul.description + '<br>Modified on : ' + magic.modules.Common.dateFormat(ul.modified_date, "dmy") + '">' + 
                                magic.modules.Common.ellipsis(ul.caption, 30) + 
                            '</div>' + 
                        '</a>' + 
                    '</li>'
                );
            });
        }
    }
};

magic.classes.UserLayerManagerForm.prototype.markup = function() {
    var layerTypes = ["user", "community"];
    var markup = '<form id="' + this.id + '-form" class="form-horizontal" role="form" enctype="multipart/form-data" style="margin-top:10px">';
    for (var i = 0; i < layerTypes.length; i++) {
        var lt = layerTypes[i];
        markup += 
            '<div class="form-group form-group-sm col-sm-12"><strong>' + (lt == "user" ? 'My' : 'Community') + ' uploaded layers</strong></div>' +
            '<div class="btn-toolbar" style="margin-bottom:10px">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Select a layer&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-' + lt + '-layers" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-legend" class="btn btn-sm btn-info" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom" >' + 
                        '<i style="pointer-events:none" title="Legend for selected layer" class="fa fa-list"></i>' + 
                    '</button>' +
                    (lt == "user" ? 
                    '<button id="' + this.id + '-' + lt + '-layer-add" class="btn btn-sm btn-primary" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Add a new layer" class="fa fa-star"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.id + '-' + lt + '-layer-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Edit selected layer data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-' + lt + '-layer-del">' +
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Delete selected layer" class="fa fa-trash"></i>' + 
                    '</button>' : '') + 
                '</div>' + 
                '<div class="btn-group dropdown" role="group">' + 
                    '<button id="' + this.id + '-' + lt + '-layer-actions" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" data-container="body">' + 
                        '<i data-toggle="tooltip" data-placement="top" data-trigger="hover" title="Further actions" class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul class="dropdown-menu dropdown-menu-right" style="overflow:auto">' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                        '<li role="separator" class="divider"></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                        '<li><a id="' + this.id + '-' + lt + '-layer-dld" href="Javascript:void(0)">Download data</a></li>' + 
                    '</ul>' + 
                '</div>' + 
            '</div>';
    }
    markup += '</form>';
    return(markup);
};

/**
 * Set the current selection for either list
 * @param {String} type user|community
 * @param {String|int} value
 */
magic.classes.UserLayerManagerForm.prototype.setSelection = function(type, value) {
     if (!type) {
         this.currentSelection = {
             "user": null,
             "community": null
         };
     } else {
         this.currentSelection[type] = value;
     }
};

/**
 * Set the current selection for either list
 * @param {String} type user|community
 * @return {String|int}
 */
magic.classes.UserLayerManagerForm.prototype.getSelection = function(type) {
     return(this.currentSelection[type]);    
};

/**
 * Set the selection button caption to the name of the currently focussed layer, and indicate visibility on the map
 * @param {jQuery.Event} selection event
 */
magic.classes.UserLayerManagerForm.prototype.selectLayer = function(evt) {
    var selId = null;
    var lt = evt.data.type;
    var targetId = evt.currentTarget.id;
    var elt = jQuery("#" + targetId);
    if (elt.length > 0) {
        selId = elt.closest("li").attr("data-pk");
    }        
    if (selId != null && selId != "") {
        var isChecked = false;        
        if (elt.attr("type") == "checkbox") {
            /* Checkbox clicked */
            isChecked = elt.prop("checked");            
        } else {
            /* Link row - find checkbox */
            isChecked = elt.find("input[type='checkbox']").prop("checked");
        }
        this.provisionLayer(this.userLayerData[selId], isChecked, false);
        /* Enable/disable the zoom to layer link for this layer according to checkbox state */
        if (isChecked) {
            this.controls[lt].dd.ztl.closest("li").prop("disabled", false);
        } else {
            this.controls[lt].dd.ztl.closest("li").prop("disabled", true);
        }
        /* Set the dropdown button caption and visibility indicator */
        elt.closest(".dropdown-menu").prev().html(
            '<i class="fa fa-eye' + (isChecked ? "" : "-slash") + '" style="font-size:16px"></i>&nbsp;&nbsp;' + 
            magic.modules.Common.ellipsis(this.userLayerData[selId].caption, 20) + "&nbsp;&nbsp;" + 
            '<span class="caret"></span>'
        );
        /* Record the current selection */
        this.setSelection(lt, selId);
        /* Finally reflect selection in button statuses */        
        this.setButtonStates(null);
        
    }
};

magic.classes.UserLayerManagerForm.prototype.saveState = function() {    
    this.savedState = {
        "user": {
            "selection": this.currentSelection.user || null
        },
        "community": {
            "selection": this.currentSelection.community || null
        }        
    };   
};

magic.classes.UserLayerManagerForm.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {        
        var userSel = this.savedState.user.selection;
        var commSel = this.savedState.community.selection;
        this.clearState();
        if (userSel != null) {
            jQuery("#" + this.id + "-" + userSel + "-user-layer-select").trigger("click");
        }
        if (commSel != null) {
            jQuery("#" + this.id + "-" + commSel + "-community-layer-select").trigger("click");
        }        
    }
};

magic.classes.UserLayerManagerForm.prototype.clearState = function() {    
    this.savedState = {
        "user": {
            "selection": null
        },
        "community": {
            "selection": null
        }        
    };    
};

magic.classes.UserLayerManagerForm.prototype.hasSavedState = function() { 
    if (!jQuery.isEmptyObject(this.savedState)) {
        return(
            (this.savedState.user && this.savedState.user.selection) ||
            (this.savedState.community && this.savedState.community.selection)
        );
    }
    return(false);
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
        magic.modules.Common.showAlertModal("Failed to load available user layers", "error");
    });
};

/**
 * Lazily create layer from fetched data if required
 * @param {Object} layerData
 * @param {boolean} visible
 * @param {boolean} inheritVis don't alter visibility of a layer which already exists on the map
 * @return {ol.Layer}
 */
magic.classes.UserLayerManagerForm.prototype.provisionLayer = function(layerData, visible, inheritVis) {     
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
                is_interactive: true,
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
        if (!inheritVis) {
            olLayer.setVisible(visible);
        }
    }
    layerData.olLayer = olLayer;
    this.userLayerData[layerData.id] = layerData;
    return(olLayer);
};

/**
 * Return the WMS URL for the selected layer
 * @param {String} type user|community
 * @return {String}
 */
magic.classes.UserLayerManagerForm.prototype.layerWmsUrl = function(type) {
    var selection = this.getSelection(type);
    if (selection && this.userLayerData[selection]) {
        var ld = this.userLayerData[selection];
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
 * @param {String} type user|community
 * @return {String}
 */
magic.classes.UserLayerManagerForm.prototype.layerDirectUrl = function(type) {
    var selection = this.getSelection(type);
    return(selection ? magic.config.paths.baseurl + "/userlayers/" + selection + "/data" : "");
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
 * @param {boolean} deactivate true if deactivating rather than simply minimising
 */
magic.classes.UserLayerManagerForm.prototype.tidyUp = function(quiet, deactivate) {
    quiet = quiet || false;
    deactivate = deactivate || false;
    if (this.editorPopups.edit && this.editorPopups.edit.isActive()) {
        this.editorPopups.edit.deactivate(quiet);
        this.editorPopups.edit = null;
    }
    if (this.editorPopups.add && this.editorPopups.add.isActive()) {
        this.editorPopups.add.deactivate(quiet);
        this.editorPopups.add = null;
    }
    if (deactivate) {
        /* Turn off all layers and reset selections */
        jQuery.each(this.userLayerData, function(layerId, layerData) {
            if (layerData.olLayer) {
                layerData.olLayer.setVisible(false);
            }
        });
        this.setSelection();
    }
};
