/* User uploaded layer manager */

magic.classes.UserLayerManager = function(options) {
    
    options = jQuery.extend({}, {
        id: "layermanager-tool",
        caption: "Manage user layers",
        layername: null,
        popoverClass: "layermanager-popover",
        popoverContentClass: "layermanager-popover-content"
    }, options);
    
    magic.classes.NavigationBarTool.call(this, options);
        
    /* Internal properties */
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(function() {                
            this.savedState = {};
        }, this), 
        onMinimise: jQuery.proxy(function() {
            var editLayerId = this.selectedLayerId() || "__new_layer";
            this.savedState[this.selectedLayerId()] = this.editFs.hasClass("hidden") ? null : this.formToPayload();
        }, this)
    });
    
    /* Styler popup tool */
    this.stylerPopup = null;
    
    this.zIndexWmsStack = -1;    
    
    this.userPayloadConfig = magic.runtime.map_context.userdata ? (magic.runtime.map_context.userdata.layers || {}) : {};
    
    this.userLayerData = {}; 
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
      
    /* Fetch user layer data from server */
    this.fetchLayers(jQuery.proxy(function(uldata) {
        /* Get top of WMS stack */
        this.zIndexWmsStack = this.getWmsStackTop(this.map);    
        /* Record the layer data, and create any visible layers */
        jQuery.each(uldata, jQuery.proxy(function(iul, ul) {
            this.prepLayer(ul);        
        }, this));        
        this.target.popover({
            template: this.template,
            title: this.titleMarkup(),
            container: "body",
            html: true,            
            content: this.markup()
        }).on("shown.bs.popover", jQuery.proxy(this.activate, this));           
    }, this));
};

magic.classes.UserLayerManager.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.UserLayerManager.prototype.constructor = magic.classes.UserLayerManager;

magic.classes.UserLayerManager.prototype.interactsMap = function () {
    return(false);
};

magic.classes.UserLayerManager.prototype.onActivateHandler = function() {
    /* Get widgets */
    this.ddLayers  = jQuery("#" + this.id + "-layers");
    this.divVis    = jQuery("#" + this.id + "-layer-vis-div");
    this.cbVis     = jQuery("#" + this.id + "-layer-vis");
    this.ztlLink   = jQuery("#" + this.id + "-layer-ztl");
    this.wmsLink   = jQuery("#" + this.id + "-layer-wms");
    this.urlLink   = jQuery("#" + this.id + "-layer-url");
    this.dldLink   = jQuery("#" + this.id + "-layer-dld");
    this.addBtn    = jQuery("#" + this.id + "-layer-add");
    this.editBtn   = jQuery("#" + this.id + "-layer-edit");
    this.delBtn    = jQuery("#" + this.id + "-layer-delete");
    this.saveBtn   = jQuery("#" + this.id + "-go");
    this.cancBtn   = jQuery("#" + this.id + "-cancel");
    this.mgrForm   = jQuery("#" + this.id + "-form");        
    this.elTitle   = jQuery("#" + this.id + "-layer-edit-title");
    this.editFs    = this.elTitle.closest("div.well");
    this.ddStyle   = jQuery("#" + this.id + "-layer-style-mode");
    this.styleEdit = jQuery("#" + this.id + "-layer-style-edit");
    this.hidStyle  = jQuery("#" + this.id + "-layer-styledef");
    this.lastMod   = jQuery("#" + this.id + "-layer-last-mod");
    /* Initialise styler popup */
    this.stylerPopup = new magic.classes.StylerPopup({
        target: this.id + "-layer-style-edit", 
        formInput: this.id + "-layer-styledef",
        styleMode: this.id + "-layer-style-mode"
    });        
    /* Fetch layers */
    this.refreshAfterUpdate(this.userLayerData);
    /* Set initial button states */
    this.setButtonStates({
        addBtn: false, editBtn: true, delBtn: true
    });
    /* Assign handlers - changing layer dropdown value*/
    this.ddLayers.change(jQuery.proxy(function() {
        this.setButtonStates({
            addBtn: false, editBtn: !this.userLayerSelected(), delBtn: !this.userLayerSelected()
        });
        this.stylerPopup.deactivate();
        var layerId = this.selectedLayerId();
        if (layerId == null || layerId == "") {
            this.divVis.addClass("hidden");
        } else {
            this.divVis.removeClass("hidden");
            /* Set checkbox according to selected layer visibility status */
            var layer = this.userLayerData[layerId].olLayer;                
            if (layer != null) {                    
                this.cbVis.prop("checked", layer.getVisible());
                if (layer.getVisible()) {
                    this.ztlLink.closest("li").removeClass("disabled");
                } else {
                    this.ztlLink.closest("li").addClass("disabled");
                }
            } else {
                this.cbVis.prop("checked", false);
                this.ztlLink.closest("li").addClass("disabled");
            }
        }
        if (!jQuery.isEmptyObject(this.savedState)) {
            var savedId = Object.keys(this.savedState)[0];
            if (this.savedState[savedId] != null) {
                this.showEditForm(this.savedState[savedId]);
            }
            this.savedState = {};
        }
    }, this));
    /* Layer visibility checkbox change handler */
    this.cbVis.change(jQuery.proxy(function(evt) {
        var selId = this.selectedLayerId();
        if (selId != null && selId != "") {
            this.prepLayer(this.userLayerData[selId], this.cbVis.prop("checked"));               
        }
        if (this.cbVis.prop("checked")) {
            this.ztlLink.closest("li").removeClass("disabled");
        } else {
            this.ztlLink.closest("li").addClass("disabled");
        }
    }, this));
    /* Zoom to layer button handler */
    this.ztlLink.click(jQuery.proxy(function(evt) {
        if (jQuery(evt.currentTarget).closest("li").hasClass("disabled")) {
            return(false);
        }
        var selId = this.selectedLayerId();
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
    /* Layer style mode change handler */
    this.ddStyle.change(jQuery.proxy(function() {
        var selection = this.ddStyle.val();
        if (selection == "default" || selection == "file") {
            this.stylerPopup.deactivate();
            this.styleEdit.addClass("hidden");
        } else {
            this.stylerPopup.enableRelevantFields();
            this.styleEdit.removeClass("hidden");                
        }
    }, this));        
    /* WMS URL link */
    this.wmsLink.click(jQuery.proxy(function() {             
        bootbox.prompt({
            "title": "WMS URL",
            "value": this.layerWmsUrl(),
            "callback": function(){}
        });
    }, this));
    /* Direct data URL link */
    this.urlLink.click(jQuery.proxy(function() {             
        bootbox.prompt({
            "title": "Direct data feed URL",
            "value": this.layerDirectUrl(),
            "callback": function(){}
        });
    }, this));        
    /* Data download link */
    this.dldLink.click(jQuery.proxy(function() {
        var dldUrl = this.layerDirectUrl();
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
    this.addBtn.click(jQuery.proxy(function() {
        this.showEditForm(null);
    }, this));
    /* Edit layer button */
    this.editBtn.click(jQuery.proxy(function() {   
        this.showEditForm(this.userLayerData[this.selectedLayerId()]);
    }, this));
     /* Delete layer button */
    this.delBtn.click(jQuery.proxy(function() {            
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var id = this.selectedLayerId();
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
                    this.fetchLayers(jQuery.proxy(this.refreshAfterUpdate, this));                                                
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
    /* Cancel button */
    this.cancBtn.off("click").on("click", jQuery.proxy(function() {
        this.stylerPopup.deactivate();
        this.mgrForm[0].reset();
        this.hideEditForm();
        this.setButtonStates({
            addBtn: false, editBtn: !this.userLayerSelected(), delBtn: !this.userLayerSelected()
        });              
        this.ddLayers.removeClass("disabled");    
        this.ddLayers.prop("disabled", false);
        this.divVis.addClass("hidden");
        this.savedState = {};
    }, this));
    /* Investigate restoring a saved state after a minimise/restore */
    var savedId = Object.keys(this.savedState)[0];
    if (savedId == "__new_layer") {
        savedId = "";
    }
    this.ddLayers.val(savedId).trigger("change");
};

magic.classes.UserLayerManager.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-form" class="form-horizontal" role="form" enctype="multipart/form-data">' +  
                '<input type="hidden" id="' + this.id + '-layer-id"></input>' + 
                '<input type="hidden" id="' + this.id + '-layer-styledef"></input>' + 
                '<div class="form-group form-group-sm col-sm-12"><strong>Select a user layer</strong></div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<select name="' + this.id + '-layers" id="' + this.id + '-layers" class="form-control" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="List of uploaded user layers">' +                       
                    '</select>' +  
                '</div>' + 
                '<div id="' + this.id + '-layer-vis-div" class="form-group form-group-sm col-sm-12 hidden">' + 
                    '<div class="form-inline">' + 
                        '<div class="checkbox" style="padding-top:0px">' + 
                            '<label>' + 
                                '<input id="' + this.id + '-layer-vis" type="checkbox" ' + 
                                    'data-toggle="tooltip" data-placement="left" title="Check/uncheck to toggle layer visibility"></input> is currently visible' + 
                            '</label>' + 
                        '</div>' + 
                        '<div class="btn-group" style="margin-left:10px">' + 
                            '<button type="button" class="btn btn-xs btn-primary dropdown-toggle" style="width:150px" data-toggle="dropdown">' + 
                                'Actions&nbsp;&nbsp;<span class="caret"></span>' + 
                            '</button>' + 
                            '<ul class="dropdown-menu">' + 
                                '<li><a id="' + this.id + '-layer-ztl" href="Javascript:void(0)">Zoom to layer extent</a></li>' + 
                                '<li role="separator" class="divider"></li>' + 
                                '<li><a id="' + this.id + '-layer-wms" href="Javascript:void(0)">OGC WMS</a></li>' + 
                                '<li><a id="' + this.id + '-layer-url" href="Javascript:void(0)">Direct data URL</a></li>' + 
                                '<li><a id="' + this.id + '-layer-dld" href="Javascript:void(0)">Download data</a></li>' + 
                            '</ul>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<button id="' + this.id + '-layer-add" class="btn btn-xs btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Upload a new layer">' + 
                        '<span class="fa fa-star"></span> Add' + 
                    '</button>' +          
                    '<button id="' + this.id + '-layer-edit" class="btn btn-xs btn-warning" type="button" style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Edit selected layer">' + 
                        '<span class="fa fa-pencil"></span> Edit' + 
                    '</button>' + 
                    '<button id="' + this.id + '-layer-delete" class="btn btn-xs btn-danger" type="button" style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Delete selected layer">' + 
                        '<span class="fa fa-times-circle"></span> Delete' + 
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
            '</form>' +               
        '</div>'
    );
};

/**
 * Show the edit layer form, pre-populated with the given object
 * @param {Object} populator
 */
magic.classes.UserLayerManager.prototype.showEditForm = function(populator) {
    this.editFs.removeClass("hidden");    
    this.mgrForm[0].reset();
    /* Initialise drag-drop zone */
    this.initDropzone();
    if (populator != null) {
        this.elTitle.html('<strong>Edit existing layer</strong>');
        this.payloadToForm(populator);
        this.lastMod.closest("div.form-group").show();
        this.lastMod.html(populator.modified_date);
    } else {
        this.elTitle.html('<strong>Upload a new file</strong>');
        this.lastMod.closest("div.form-group").hide();
        this.styleEdit.addClass("hidden");
    }
    this.setButtonStates({
        addBtn: true, editBtn: true, delBtn: true
    });     
    this.mgrForm.find("input").first().focus();
    this.ddLayers.prop("disabled", true);
};

/**
 * Hide the edit layer form
 */
magic.classes.UserLayerManager.prototype.hideEditForm = function() {    
    this.destroyDropzone();
    this.editFs.addClass("hidden");  
};

/**
 * Fetch data on all uploaded layers user has access to
 * @param {Function} cb
 */
magic.classes.UserLayerManager.prototype.fetchLayers = function(cb) {
    if (this.ddLayers) {
        /* Clear select and prepend the invite to select */
        this.ddLayers.empty();
        this.ddLayers.append(jQuery("<option>", {value: "", text: "Please select"}));
    }
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
 * Populate the user layer selection dropdown and update map layers
 * @param {Object} uldata
 */
magic.classes.UserLayerManager.prototype.refreshAfterUpdate = function(uldata) {
    this.ddLayers.empty();
    var currentUser = null, ulGroup = null;
    var defOpt = jQuery("<option>", {value: ""});
    defOpt.text("Please select...");
    this.ddLayers.append(defOpt);
    jQuery.each(uldata, jQuery.proxy(function(iul, ul) {
        if (currentUser == null || ul.owner != currentUser) {
            currentUser = ul.owner;
            ulGroup = jQuery("<optgroup>", {label: currentUser == magic.runtime.map_context.username ? "Your uploaded layers" : "Community uploaded layers"});
            this.ddLayers.append(ulGroup);
        }
        var ulOpt = jQuery("<option>", {value: ul.id});
        ulOpt.text(ul.caption);
        ulGroup.append(ulOpt);
        var isVis = (ul.olLayer && ul.olLayer.getVisible());
        this.prepLayer(ul, isVis);
    }, this));     
};

/**
 * Detect whether selected layer is owned by current user
 * @return {Boolean}
 */
magic.classes.UserLayerManager.prototype.userLayerSelected = function() {
    var selItem = this.ddLayers.val();
    if (selItem == null || selItem == "") {
        return(false);
    }
    return(this.userLayerData[this.ddLayers.val()].owner == magic.runtime.map_context.username);
};

/**
 * Set the form button states according to received object
 * @para, {Object} states
 * @return {Boolean}
 */
magic.classes.UserLayerManager.prototype.setButtonStates = function(states) {
    for (var btn in states) {
        if (states[btn]) {
            this[btn].addClass("disabled");
        } else {
            this[btn].removeClass("disabled");
        }
        this[btn].prop("disabled", states[btn]);
    }
};

/**
 * Lazily create layer from fetched data if required
 * @param {Object} layerData
 * @param {boolean} visible
 * @return {ol.Layer}
 */
magic.classes.UserLayerManager.prototype.prepLayer = function(layerData, visible) { 
    var userEp = magic.modules.Endpoints.getUserDataEndpoint();
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
 * Return the identifier for the selected layer option
 */
magic.classes.UserLayerManager.prototype.selectedLayerId = function() {
    return(this.ddLayers.val());
};

/**
 * Return the WMS URL for the selected layer
 */
magic.classes.UserLayerManager.prototype.layerWmsUrl = function() {
    var selId = this.selectedLayerId();
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
 */
magic.classes.UserLayerManager.prototype.layerDirectUrl = function() {
    return(this.selectedLayerId() ? magic.config.paths.baseurl + "/userlayers/" + this.selectedLayerId() + "/data" : "");
};

/**
 * Get top of WMS layer stack in map
 * @return {Number|zi}
 */
magic.classes.UserLayerManager.prototype.getWmsStackTop = function(map) {
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
 * Create required JSON payload from form fields
 * @return {Object}
 */
magic.classes.UserLayerManager.prototype.formToPayload = function() {
    var payload = {};
    var inputs = ["id", "caption", "description", "allowed_usage", "styledef"];
    jQuery.each(inputs, jQuery.proxy(function(idx, ip) {
        payload[ip] = jQuery("#" + this.id + "-layer-" + ip).val();
    }, this));    
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.UserLayerManager.prototype.payloadToForm = function(populator) {
    var inputs = ["id", "caption", "description", "allowed_usage", "styledef"];
    jQuery.each(inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-layer-" + ip).val(populator[ip]);
    }, this));
    var styledef = populator["styledef"];
    if (typeof styledef === "string") {
        styledef = JSON.parse(styledef);
    }
    /* Set styling mode, and trigger styler popover if necessary */
    this.ddStyle.val(styledef["mode"]);
    if (styledef["mode"] == "point" || styledef["mode"] == "line" || styledef["mode"] == "polygon") {
        this.stylerPopup.activate();
    }
};

/**
 * Initialise the dropzone for uploading files
 */
magic.classes.UserLayerManager.prototype.destroyDropzone = function() {
    try {
        Dropzone.forElement("div#publish-files-dz").destroy();
    } catch(e) {}
};

/**
 * Initialise the dropzone for uploading files
 */
magic.classes.UserLayerManager.prototype.initDropzone = function() {
    var previewTemplate =             
        '<div class="row col-sm-12">' + 
            '<div class="col-sm-4" style="padding-left:0px !important">' +
                '<p class="name" data-dz-name style="font-weight:bold"></p>' +                
            '</div>' +
            '<div class="col-sm-2">' +
                '<p class="size" data-dz-size=""></p>' +
            '</div>' +
            '<div class="col-sm-4 publish-feedback">' +
                '<div class="progress progress-striped active show" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                    '<div class="progress-bar progress-bar-success" style="width:0%;" data-dz-uploadprogress></div>' +
                '</div>' +
                '<div class="publish-feedback-msg hidden">' + 
                '</div>' + 
            '</div>' +
            '<div class="col-sm-2">' +
                '<button data-dz-remove class="btn btn-xs btn-danger publish-delete show">' +
                    '<i class="glyphicon glyphicon-trash"></i>' +
                    '<span>&nbsp;Delete</span>' +
                '</button>' +
                '<button class="btn btn-xs btn-success publish-success hidden">' +
                    '<i class="glyphicon glyphicon-ok"></i>' +
                    '<span>&nbsp;Publish ok</span>' +
                '</button>' +
                '<button class="btn btn-xs btn-warning publish-error hidden">' +
                    '<i class="glyphicon glyphicon-remove"></i>' +
                    '<span>&nbsp;Publish failed</span>' +
                '</button>' +
            '</div>' +   
            '<div class="row col-sm-12">' + 
                '<strong class="error text-danger" data-dz-errormessage></strong>' + 
            '</div>' + 
        '</div>';
    var ulm = this;
    var saveBtn = this.saveBtn;
    this.destroyDropzone();    
    new Dropzone("div#publish-files-dz", {
        url: magic.config.paths.baseurl + "/userlayers/save",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 100,  /* Maximum file size, in MB */
        uploadMultiple: false,        
        autoProcessQueue: false,
        maxFiles: 1,
        parallelUploads: 1,
        previewTemplate: previewTemplate,
        headers: {
            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
        },
        init: function () {
            this.on("complete", jQuery.proxy(function(file) {
                //console.log("complete handler");
                var response = JSON.parse(file.xhr.responseText);                
                if (response.status < 400) {
                    /* Successful save */
                    magic.modules.Common.buttonClickFeedback(this.ulm.id, true, response.detail);
                    this.ulm.setButtonStates({
                        addBtn: false, editBtn: !this.ulm.userLayerSelected(), delBtn: !this.ulm.userLayerSelected()
                    });                             
                    this.ulm.ddLayers.prop("disabled", false);
                    setTimeout(jQuery.proxy(function() {
                        this.hideEditForm();
                    }, this.ulm), 2000);
                    this.ulm.fetchLayers(jQuery.proxy(this.ulm.refreshAfterUpdate, this.ulm));                   
                } else {
                    /* Failed to save */
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to save user layer data - details below:</p>' + 
                            '<p>' + response.detail + '</p>' + 
                        '</div>'
                    );     
                    this.ulm.ddLayers.prop("disabled", false);
                }
                this.pfdz.removeAllFiles();
            }, {pfdz: this, ulm: ulm})); 
            this.on("maxfilesexceeded", function(file) {
                this.removeAllFiles();
                this.addFile(file);
            });
            this.on("addedfile", function(file) {
                jQuery("div#publish-files-dz").find("p.name").html(magic.modules.Common.ellipsis(file.name, 18));
            });
            this.on("error", jQuery.proxy(function(file, msg, theXhr) {
                window.setTimeout(jQuery.proxy(this.removeAllFiles, this), 3000);
            }, this));
            /* Save button */
            saveBtn.off("click").on("click", jQuery.proxy(function() {            
                /* Indicate any invalid fields */
                var ok = true;
                jQuery.each(this.ulm.mgrForm.find("input[required='required']"), function(idx, ri) {
                    var riEl = jQuery(ri);
                    var fg = riEl.closest("div.form-group");
                    var vState = riEl.prop("validity");
                    if (vState.valid) {
                        fg.removeClass("has-error");
                    } else {
                        fg.addClass("has-error");
                        ok = false;
                    }
                });
                if (ok) {
                    var formdata = this.ulm.formToPayload();                    
                    if (!jQuery.isArray(this.pfdz.files) || this.pfdz.files.length == 0) {
                        /* No upload file, so assume only the other fields are to change and process form data */
                        if (formdata["id"]) {
                            /* Do an update of user layer data */
                            var jqXhr = jQuery.ajax({
                                url: magic.config.paths.baseurl + "/userlayers/update/" + formdata["id"], 
                                data: JSON.stringify(formdata), 
                                method: "POST",
                                dataType: "json",
                                contentType: "application/json",
                                headers: {
                                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                                }
                            })
                            .done(jQuery.proxy(function(response) {
                                magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail);
                                this.setButtonStates({
                                    addBtn: false, editBtn: !this.userLayerSelected(), delBtn: !this.userLayerSelected()
                                });                               
                                this.ddLayers.prop("disabled", false);
                                setTimeout(jQuery.proxy(function() {
                                    this.hideEditForm();
                                }, this), 2000);    
                                this.fetchLayers(jQuery.proxy(this.refreshAfterUpdate, this)); 
                            }, this.ulm))
                            .fail(function (xhr) {
                                bootbox.alert(
                                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                        '<p>Failed to save user layer data - details below:</p>' + 
                                        '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                                    '</div>'
                                );
                            });    
                        } else {
                            bootbox.alert(
                                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                    '<p>No uploaded file found - please specify the data to upload</p>' + 
                                '</div>'
                            );
                        }
                    } else {
                        /* Uploaded file present, so process via DropZone */
                        /* Add the other form parameters to the dropzone POST */                    
                        this.pfdz.on("sending", function(file, xhr, data) { 
                            jQuery.each(formdata, function(key, val) {
                                data.append(key, val);
                            });      
                        });
                        this.pfdz.processQueue();
                    }
                } else {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Please correct the marked errors in your input and try again</div>');
                }            
            }, {pfdz: this, ulm: ulm}));
        },
        accept: function (file, done) {
            switch (file.type) {
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/gpx+xml":
                case "application/vnd.google-earth.kml+xml":
                case "application/zip":
                case "application/x-zip-compressed":
                    break;
                case "":
                    /* Do some more work - GPX (and sometimes KML) files routinely get uploaded without a type */
                    if (file.name.match(/\.gpx$/) != null) {
                        file.type = "application/gpx+xml";
                    } else if (file.name.match(/\.kml$/) != null) {
                        file.type = "application/vnd.google-earth.kml+xml";
                    } else {
                        done(this.options.dictInvalidFileType);
                        return;
                    }
                    break;
                default:
                    done(this.options.dictInvalidFileType);
                    return;
            }
            done();
        },
        dictDefaultMessage: "Upload GPX, KML, CSV or zipped Shapefiles by dragging and dropping them here",
        dictInvalidFileType: "Not a GPX, KML, CSV or zipped Shapefile",
        dictFileTooBig: "File is too large ({{filesize}} bytes) - maximum size is {{maxFileSize}}",
        dictResponseError: "Publication failed - server responded with code {{statusCode}}",
        dictCancelUpload: "Cancel upload",
        dictCancelUploadConfirmation: "Are you sure?"
    });
};
