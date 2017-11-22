/* User uploaded layer manager */

magic.classes.UserLayerManagerForm = function(options) {
    
    /* API options */    
    this.id = options.id || "map-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;    
    
    /* Form and widgets */    
    this.mgrForm = null;
    
    /* Styler popup tool */
    this.stylerPopup = null;
    
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
    
    /* Enclosing form */
    this.mgrForm  = jQuery("#" + this.id + "-form"); 
    
    /* Edit form fieldset */
    this.editFs = jQuery("#" + this.id + "-edit-view-fs");
    
    /* Initialise styler popup */
    this.stylerPopup = new magic.classes.StylerPopup({
        target: this.id + "-layer-style-edit", 
        formInput: this.id + "-layer-styledef",
        styleMode: this.id + "-layer-style-mode"
    });        
    
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
        userLayerInsertAt.append('<div>', {
            "class": "info",
            "text": "There are currently no user uploaded layers"
        });
    } else {
        /* Tabular markup */
        var tableHtml = 
            '<table class="table table-striped table-condensed" style="margin-bottom:5px">' + 
                '<tr><th>Layer</th><th>Owner</th><th colspan="4"></th></tr>';
        jQuery.each(userLayers, jQuery.proxy(function(idx, ul) {
            var pk = ul.id;
            tableHtml += 
                '<tr>' + 
                    '<td width="180px">' + 
                        '<span data-toggle="tooltip" data-placement="bottom" data-html="true" ' + 
                            'title="' + ul.caption + '<br/>' + ul.description + '<br/>Last modified on : ' + ul.modified_date  + '" role="button">' + 
                            magic.modules.Common.ellipsis(ul.caption, 30) + 
                        '</span>' + 
                    '</td>' + 
                    '<td width="60px">' + ul.owner + '</td>' + 
                    '<td width="30px"><input type="checkbox" checked="' + (ul.olLayer != null && ul.olLayer.getVisible()) + '"></input></td>' +
                    '<td width="30px"><span class="fa fa-pencil"></span></td>' + 
                    '<td width="30px"><span class="fa fa-times-circle"></span></td>' + 
                    '<td width="40px">' + 
                        '<button type="button" class="btn btn-xs btn-primary dropdown-toggle" data-toggle="dropdown">' + 
                            '<span class="caret"></span>' + 
                        '</button>' + 
                        '<ul class="dropdown-menu">' + 
                            '<li><a id="' + this.id + '-' + pk + '-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                            '<li role="separator" class="divider"></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-dld" href="Javascript:void(0)">Download data</a></li>' + 
                        '</ul>' + 
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
        communityLayerInsertAt.append('<div>', {
            "class": "info",
            "text": "There are currently no community uploaded layers"
        });
    } else {
        /* Tabular markup */
        var tableHtml = 
            '<table class="table table-striped table-condensed">' + 
                '<tr><th>Layer</th><th>Owner</th><th>Vis</th><th>Actions</th></tr>';
        jQuery.each(userLayers, function(idx, ul) {
            var pk = ul.id;
            tableHtml += 
                '<tr>' + 
                    '<td>' + 
                        '<span data-toggle="tooltip" data-placement="bottom" data-html="true" ' + 
                            'title="' + ul.description + '<br/>' + ul.modified_date  + '" role="button">' + ul.caption + 
                        '</span>' + 
                    '</td>' + 
                    '<td>' + ul.owner + '</td>' + 
                    '<td><input type="checkbox" checked="' + (ul.olLayer != null && ul.olLayer.getVisible()) + '"></input></td>' +                    
                    '<td>' + 
                        '<button type="button" class="btn btn-xs btn-primary dropdown-toggle" style="width:150px" data-toggle="dropdown">' + 
                            '<span class="caret"></span>' + 
                        '</button>' + 
                        '<ul class="dropdown-menu">' + 
                            '<li><a id="' + this.id + '-' + pk + '-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                            '<li role="separator" class="divider"></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                            '<li><a id="' + this.id + '-' + pk + '-dld" href="Javascript:void(0)">Download data</a></li>' + 
                        '</ul>' + 
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
            '<div class="panel panel-default">' + 
                '<div class="panel-heading">' +                            
                    '<a role="button" data-toggle="collapse" href="#' + this.id + '-user-layer-table">' +
                        '<span style="font-weight:bold">Your uploaded layers</span>' +
                    '</a>' +   
                '</div>' + 
                '<div id="' + this.id + '-user-layer-table" class="panel-collapse collapse in">' +
                    '<div class="panel-body" style="padding:5px">' +
                    '</div>' +
                '</div>' +
            '</div>' + 
            '<div class="panel panel-default">' + 
                '<div class="panel-heading">' +                            
                    '<a role="button" data-toggle="collapse" href="#' + this.id + '-community-layer-table">' +
                        '<span style="font-weight:bold">Community uploaded layers</span>' +
                    '</a>' +   
                '</div>' + 
                '<div id="' + this.id + '-community-layer-table" class="panel-collapse collapse">' +
                    '<div class="panel-body" style="padding:5px">' +
                    '</div>' +
                '</div>' +
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                '<button id="' + this.id + '-layer-add" class="btn btn-xs btn-primary" type="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Upload a new layer">' + 
                    '<span class="fa fa-star"></span> Add' + 
                '</button>' +                               
            '</div>' +  
            '<div class="col-sm-12 well well-sm edit-view-fs hidden">' +
                '<div id="' + this.id + '-layer-edit-title" class="form-group form-group-sm col-sm-12"><strong>Upload a new layer</strong></div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +                     
                    '<label class="col-sm-4 control-label" for="' + this.id + '-layer-caption">Name</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="text" id="' + this.id + '-layer-caption" class="form-control" ' + 
                            'placeholder="Layer caption" maxlength="100" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Layer name (required)" ' + 
                            'required="required">' +
                        '</input>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4 control-label" for="' + this.id + '-layer-description">Description</label>' + 
                    '<div class="col-sm-8">' + 
                        '<textarea id="' + this.id + '-layer-description" class="form-control" ' + 
                            'style="height:8em !important" ' + 
                            'placeholder="Detailed layer description, purpose, content etc" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Longer description of the layer">' +                                           
                        '</textarea>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-mode">Style</label>' + 
                    '<div class="form-inline col-sm-8">' + 
                        '<select id="' + this.id + '-layer-style-mode" class="form-control" style="width:80%" ' + 
                            'data-toggle="tooltip" data-placement="top" ' + 
                            'title="Layer styling">' +
                            '<option value="default" default>Default</option>' + 
                            '<option value="file">Use style in file</option>' +
                            '<option value="point">Point style</option>' +
                            '<option value="line">Line style</option>' +
                            '<option value="polygon">Polygon style</option>' +
                        '</select>' + 
                        '<button id="' + this.id + '-layer-style-edit" style="width:20%" data-toggle="popover" data-placement="right" ' + 
                            ' type="button" role="button"class="btn btn-sm btn-primary">Edit</button>' +
                    '</div>' + 
                '</div>' +                    
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4 control-label" for="' + this.id + '-layer-allowed_usage">Share</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select name="' + this.id + '-layer-allowed_usage" id="' + this.id + '-layer-allowed_usage" class="form-control" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Sharing permissions">' +
                            '<option value="owner" default>no</option>' + 
                            '<option value="public">with everyone</option>' +
                            '<option value="login">with logged-in users only</option>' +
                        '</select>' + 
                    '</div>' + 
                '</div>' + 
                '<div id="publish-files-dz" class="dropzone col-sm-12">' +                        
                '</div>' +                    
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label">Modified</label>' + 
                    '<div class="col-sm-8">' + 
                        '<p id="' + this.id + '-layer-last-mod" class="form-control-static"></p>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    magic.modules.Common.buttonFeedbackSet(this.id, "Publish layer", "xs", "Publish") +                         
                    '<button id="' + this.id + '-cancel" class="btn btn-xs btn-danger" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                        '<span class="fa fa-times-circle"></span> Cancel' + 
                    '</button>' +                        
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