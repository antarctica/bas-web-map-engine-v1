/* User uploaded layer manager */

magic.classes.UserLayerManagerForm = function(options) {
    
    /* API options */    
    this.id = options.id || "layer-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;    
   
    /* Styler popup tool */
    this.stylerPopup = null;
    
    /* Layer editor popup tool */
    this.editorPopup = null;
    
    /* zIndex of the top of the WMS stack in the map, insertion point for new layers */
    this.zIndexWmsStack = -1;    
    
    /* Data from a saved map indicating visibility, transparency etc of user layers */
    this.userPayloadConfig = magic.runtime.map_context.userdata ? (magic.runtime.map_context.userdata.layers || {}) : {};
    
    /* Layer data for c, keyed by id */
    this.userLayerData = {}; 
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    
};

magic.classes.UserLayerManagerForm.prototype.init = function() {
   
    /* Get top of WMS stack */
    this.zIndexWmsStack = this.getWmsStackTop(this.map);  
    
    /* Load the available user layers from server */
    this.fetchLayers(jQuery.proxy(function(uldata) {          
        /* Record the layer data, and create any visible layers */
        jQuery.each(uldata, jQuery.proxy(function(idx, ul) {
            this.provisionLayer(ul);            
        }, this));       
        /* Tabulate the layer markup */
        this.layerMarkup();
        this.assignHandlers();
    }, this));
};

magic.classes.UserLayerManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    /* Layer visibility checkboxes change handler */
    form.find("[id$='-vis']").change(jQuery.proxy(function(evt) {  
        var isChecked = jQuery(evt.currentTarget).prop("checked");
        var selId = this.pkFromId(evt.currentTarget.id);
        if (selId != null && selId != "") {
            this.provisionLayer(this.userLayerData[selId], isChecked);               
        }
        /* Enable/disable the zoom to layer link for this layer according to checkbox state */
        var ztl = jQuery(evt.currentTarget.id.replace(/vis$/, "ztl"));
        if (isChecked) {
            ztl.closest("li").removeClass("disabled");
        } else {
            ztl.closest("li").addClass("disabled");
        }
    }, this));
    
    /* Zoom to layer link handlers */
    form.find("[id$='-ztl']").click(jQuery.proxy(function(evt) {
        if (jQuery(evt.currentTarget).closest("li").hasClass("disabled")) {
            return(false);
        }
        var selId = this.pkFromId(evt.currentTarget.id);
        if (selId != null && selId != "") {
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/userlayers/" + selId + "/extent", 
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
    form.find("[id$='-wms']").click(jQuery.proxy(function(evt) {             
        bootbox.prompt({
            "title": "WMS URL",
            "value": this.layerWmsUrl(this.pkFromId(evt.currentTarget.id)),
            "callback": function(){}
        });
    }, this));
    
    /* Direct data URL link */
    form.find("[id$='-url']").click(jQuery.proxy(function(evt) {             
        bootbox.prompt({
            "title": "Direct data feed URL",
            "value": this.layerDirectUrl(this.pkFromId(evt.currentTarget.id)),
            "callback": function(){}
        });
    }, this));        
    
    /* Data download link */
    form.find("[id$='-dld']").click(jQuery.proxy(function(evt) {
        var dldUrl = this.layerDirectUrl(this.pkFromId(evt.currentTarget.id));
        if (dldUrl) {
            window.open(dldUrl);
        } else {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Please select a layer</p>' + 
                '</div>'
            );
        }
    }, this));
    
    /* New layer button */
    jQuery("#" + this.id + "-user-layer-add").click(jQuery.proxy(function(evt) {
        if (!this.editorPopup) {
            this.editorPopup = new magic.classes.LayerEditorPopup({
                target: evt.currentTarget.id,
                onSave: jQuery.proxy(this.init, this)
            });
        }
        this.editorPopup.activate({});
    }, this));
    
    /* Edit layer button */
    form.find("[id$='-edit']").click(jQuery.proxy(function(evt) {   
        if (!this.editorPopup) {
            this.editorPopup = new magic.classes.LayerEditorPopup({
                target: evt.currentTarget.id,
                onSave: jQuery.proxy(this.init, this)
            });
        } else {
            this.editorPopup.setTarget(jQuery("#" + evt.currentTarget.id));
        }
        this.editorPopup.activate(this.userLayerData[this.pkFromId(evt.currentTarget.id)]);
    }, this));
    
    /* Delete layer button */
    form.find("[id$='-del']").click(jQuery.proxy(function(evt) {            
        evt.preventDefault();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var id = this.pkFromId(evt.currentTarget.id);
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
                    if (id in this.userLayerData) {
                        if (this.userLayerData[id].olLayer) {
                            this.map.removeLayer(this.userLayerData[id].olLayer);
                        }
                        delete this.userLayerData[id];
                    }
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
    var userLayerInsertAt = jQuery("#" + this.id + "-user-layer-table").find(".panel-body");
    userLayerInsertAt.empty();
    if (userLayers.length == 0) {
        /* No records */
        userLayerInsertAt.append('<div class="info">There are currently no user uploaded layers</div>');
    } else {
        /* Tabular markup */
        var tableHtml = 
            '<table class="table table-striped table-condensed" style="margin-bottom:5px">' + 
                '<tr><th>Layer</th><th>Owner</th><th colspan="4"></th></tr>';
        jQuery.each(userLayers, jQuery.proxy(function(idx, ul) {
            var pk = ul.id;
            tableHtml += 
                '<tr data-pk="' + pk + '">' + 
                    '<input type="hidden" id="' + this.id + '-' + pk + '-id" value="' + pk + '">' +
                    '<input type="hidden" id="' + this.id + '-' + pk + '-styledef" value="' + ul.styledef + '">' +
                    '<td width="180px">' + 
                        '<span data-toggle="tooltip" data-placement="bottom" data-html="true" ' + 
                            'title="' + ul.caption + '<br/>' + ul.description + '<br/>Last modified on : ' + ul.modified_date  + '" role="button">' + 
                            magic.modules.Common.ellipsis(ul.caption, 30) + 
                        '</span>' + 
                    '</td>' + 
                    '<td width="50px">' + ul.owner + '</td>' + 
                    '<td width="30px">' + 
                        '<input id="' + this.id + '-' + pk + '-vis" type="checkbox"' + (ul.olLayer != null && ul.olLayer.getVisible() ? ' checked="checked"' : '') + '></input>' + 
                    '</td>' +
                    '<td width="30px">' + 
                        '<a id="' + this.id + '-' + pk + '-edit" href="JavaScript:void(0)" data-toggle="popover" data-trigger="manual" data-placement="right">' + 
                            '<i data-toggle="tooltip" data-placement="bottom" title="Edit layer data" style="font-size: 20px; color: #286090" class="fa fa-pencil"></i>' + 
                        '</a>' + 
                    '</td>' + 
                    '<td width="30px">' + 
                        '<a id="' + this.id + '-' + pk + '-del" href="Javascript:void(0)" data-toggle="popover" data-trigger="manual" data-placement="right">' +
                            '<i data-toggle="tooltip" data-placement="bottom" title="Delete this layer" style="font-size: 20px; color: #d9534f" class="fa fa-trash"></i>' + 
                        '</a>' + 
                    '</td>' + 
                    '<td width="40px">' + 
                        '<div class="dropdown">' + 
                            '<button type="button" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown">' + 
                                '<i class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                            '</button>' + 
                            '<ul class="dropdown-menu dropdown-menu-right">' + 
                                '<li><a id="' + this.id + '-' + pk + '-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                                '<li role="separator" class="divider"></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-dld" href="Javascript:void(0)">Download data</a></li>' + 
                            '</ul>' + 
                        '</div>' + 
                   '</td>' + 
                '</tr>';
        }, this));
        tableHtml += '</table>';
        userLayerInsertAt.append(tableHtml);
    }
    var communityLayerInsertAt = jQuery("#" + this.id + "-community-layer-table").find(".panel-body");
    communityLayerInsertAt.empty();
    if (communityLayers.length == 0) {
        /* No records */
        communityLayerInsertAt.append('<div class="info">There are currently no community uploaded layers</div>');
    } else {
        /* Tabular markup */
        var tableHtml = 
            '<table class="table table-striped table-condensed">' + 
                '<tr><th>Layer</th><th>Owner</th><th>Vis</th><th>Actions</th></tr>';
        jQuery.each(communityLayers, function(idx, ul) {
            var pk = ul.id;
            tableHtml += 
                '<tr data-pk="' + pk + '">' + 
                    '<input type="hidden" id="' + this.id + '-' + pk + '-id" value="' + pk + '">' +
                    '<input type="hidden" id="' + this.id + '-' + pk + '-styledef" value="' + ul.styledef + '">' +
                    '<td width="240px">' + 
                        '<span data-toggle="tooltip" data-placement="bottom" data-html="true" ' + 
                            'title="' + ul.description + '<br/>' + ul.modified_date  + '" role="button">' + ul.caption + 
                        '</span>' + 
                    '</td>' + 
                    '<td width="50px">' + ul.owner + '</td>' + 
                    '<td width="30px">' + 
                        '<input id="' + this.id + '-' + pk + '-vis" type="checkbox"' + (ul.olLayer != null && ul.olLayer.getVisible() ? ' checked="checked"' : '') + '></input>' + 
                    '</td>' +                    
                    '<td width="40px">' + 
                        '<div class="dropdown">' + 
                            '<button type="button" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown">' + 
                                '<i class="fa fa-ellipsis-h"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                            '</button>' + 
                            '<ul class="dropdown-menu dropdown-menu-right">' + 
                                '<li><a id="' + this.id + '-' + pk + '-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                                '<li role="separator" class="divider"></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                                '<li><a id="' + this.id + '-' + pk + '-dld" href="Javascript:void(0)">Download data</a></li>' + 
                            '</ul>' + 
                        '</div>' + 
                   '</td>' + 
                '</tr>';
        });
        tableHtml += '</table>';
        communityLayerInsertAt.append(tableHtml);
    }
};

magic.classes.UserLayerManagerForm.prototype.markup = function() {
    return(
        '<form id="' + this.id + '-form" class="form-horizontal" role="form" enctype="multipart/form-data" style="margin-top:10px">' + 
            '<div class="panel panel-default" style="margin-bottom:10px">' + 
                '<div class="panel-heading">' +                            
                    '<a class="panel-title" role="button" data-toggle="collapse" href="#' + this.id + '-user-layer-table">' +
                        '<span style="font-weight:bold" data-toggle="tooltip" data-placement="bottom" title="Click here to toggle expand/collapse of layer group">' + 
                            'Your uploaded layers' + 
                        '</span>' +
                    '</a>' +   
                '</div>' + 
                '<div id="' + this.id + '-user-layer-table" class="panel-collapse collapse in">' +
                    '<div class="panel-body" style="padding:5px">' +
                    '</div>' +
                '</div>' +
            '</div>' + 
            '<button id="' + this.id + '-user-layer-add" class="btn btn-sm btn-primary" style="margin-bottom:10px" type="button" ' + 
                'data-toggle="tooltip" data-placement="top" data-container="#' + this.id + '-form" title="Upload a new user layer">' + 
                '<span class="fa fa-upload"></span> Add' + 
            '</button>' +  
            '<div class="panel panel-default" style="margin-bottom:5px">' + 
                '<div class="panel-heading">' +                            
                    '<a class="panel-title" role="button" data-toggle="collapse" href="#' + this.id + '-community-layer-table">' +
                        '<span style="font-weight:bold" data-toggle="tooltip" data-placement="bottom" title="Click here to toggle expand/collapse of layer group">' + 
                            'Community uploaded layers' + 
                        '</span>' +
                    '</a>' +   
                '</div>' + 
                '<div id="' + this.id + '-community-layer-table" class="panel-collapse collapse">' +
                    '<div class="panel-body" style="padding:5px">' +
                    '</div>' +
                '</div>' +
            '</div>' +                                                                
        '</form>'         
    );
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
    if (typeof visible !== "boolean") {
        visible = this.userPayloadConfig[layerData.id] ? this.userPayloadConfig[layerData.id].visibility : false;
    }
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
 * @param {String} selId 
 */
magic.classes.UserLayerManagerForm.prototype.layerWmsUrl = function(selId) {
    if (selId && this.userLayerData[selId]) {
        var ld = this.userLayerData[selId];
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
 * @param {String} selId 
 */
magic.classes.UserLayerManagerForm.prototype.layerDirectUrl = function(selId) {
    return(selId ? magic.config.paths.baseurl + "/userlayers/" + selId + "/data" : "");
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
 * Get layer primary key id from input id of form <stuff>-<pk>-<inputname>
 * @param {String} id
 * @return {String}
 */
magic.classes.UserLayerManagerForm.prototype.pkFromId = function(id) {
    var elt = jQuery("#" + id);
    if (elt.length > 0) {
        return(elt.closest("tr").attr("data-pk"));
    }    
    return(null);
};

/**
 * Zap any open pop-ups (used when changing tab)
 */
magic.classes.UserLayerManagerForm.prototype.tidyUp = function() {
    if (this.editorPopup) {
        this.editorPopup.deactivate();
    }
};

