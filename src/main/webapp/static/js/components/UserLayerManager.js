/* User uploaded layer manager */

magic.classes.UserLayerManager = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "layermanager-tool";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    this.zIndexWmsStack = -1;    
    
    this.userPayloadConfig = magic.runtime.userdata ? (magic.runtime.userdata.layers || {}) : {};
    
    this.userLayerData = {};   
    
    /* Fetch user layer data from server */
    this.fetchLayers(jQuery.proxy(this.initialise, this));
};

magic.classes.UserLayerManager.prototype.initialise = function(uldata) {
    /* Get top of WMS stack */
    this.zIndexWmsStack = this.getWmsStackTop(this.map);    
    /* Record the layer data, and create any visible layers */
    jQuery.each(uldata, jQuery.proxy(function(iul, ul) {
        this.prepLayer(ul);        
    }, this));
    this.template = 
        '<div class="popover popover-auto-width layermanager-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 500px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-form" class="form-horizontal" role="form">' +  
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
                    '<div class="checkbox" style="padding-top:0px">' + 
                        '<label>' + 
                            '<input id="' + this.id + '-layer-vis" type="checkbox" ' + 
                                'data-toggle="tooltip" data-placement="left" title="Check/uncheck to toggle layer visibility"></input> is currently visible' + 
                        '</label>' + 
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
                    '<button id="' + this.id + '-layer-bmk" class="btn btn-xs btn-primary" type="button"  style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Resource URL for accessing selected layer">' + 
                        '<span class="fa fa-bookmark"></span> Shareable URL' + 
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
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.id + '-layer-style-mode" class="form-control" ' + 
                                'data-toggle="tooltip" data-placement="right" ' + 
                                'title="Layer styling">' +
                                '<option value="default" default>Default</option>' + 
                                '<option value="file">Use style in file</option>' +
                                '<option value="point">Point style</option>' +
                                '<option value="line">Line style</option>' +
                                '<option value="polygon">Polygon style</option>' +
                            '</select>' + 
                        '</div>' + 
                    '</div>' +
                    '<div id="' + this.id + '-style-fs" class="hidden">' + 
                        '<div id="' + this.id + '-style-point-fs">' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-marker">Marker</label>' + 
                                '<div class="col-sm-8">' + 
                                    '<select class="form-control" id="' + this.id + '-layer-style-marker" ' +                                         
                                            'data-toggle="tooltip" data-placement="right" title="Choose a marker type">' + 
                                        '<option value="circle">Circle</option>' + 
                                        '<option value="triangle">Triangle</option>' + 
                                        '<option value="square">Square</option>' + 
                                        '<option value="pentagon">Pentagon</option>' + 
                                        '<option value="hexagon">Hexagon</option>' + 
                                        '<option value="star">Star</option>' + 
                                    '</select>' +
                                '</div>' + 
                            '</div>' +
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-radius">Size</label>' + 
                                '<div class="col-sm-8">' +
                                    '<input type="number" class="form-control" id="' + this.id + '-layer-style-radius" ' + 
                                            'placeholder="Radius of graphic marker in pixels" ' +
                                            'min="3" max="20" step="0.2" value="5" ' + 
                                            'data-toggle="tooltip" data-placement="right" title="Radius of graphic marker in pixels, default 5">' + 
                                    '</input>' +
                                '</div>' + 
                            '</div>' + 
                        '</div>' + 
                        '<div id="' + this.id + '-style-line-fs">' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-stroke_width">Outline width</label>' + 
                                '<div class="col-sm-8">' +
                                    '<input type="number" class="form-control" id="' + this.id + '-layer-style-stroke_width" ' + 
                                           'placeholder="Width of outline in pixels" ' + 
                                           'min="3" max="20" step="0.2" value="1" ' + 
                                           'data-toggle="tooltip" data-placement="right" title="Width of outline in pixels, default 1">' + 
                                    '</input>' +
                                '</div>' + 
                            '</div>' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-stroke_color">Outline colour</label>' + 
                                '<div class="col-sm-8">' +
                                    '<input type="color" class="form-control" id="' + this.id + '-layer-style-stroke_color" ' +                                        
                                           'data-toggle="tooltip" data-placement="right" title="Colour of the graphic outline, default black"' + 
                                    '</input>' +
                                '</div>' + 
                            '</div>' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label for="' + this.id + '-layer-style-stroke_opacity" class="col-sm-4 control-label">Outline opacity</label>' + 
                                '<div class="col-sm-8">' + 
                                    '<input type="number" class="form-control" id="' + this.id + '-layer-style-stroke_opacity" ' +
                                           'placeholder="Outline opacity (0->1)" ' + 
                                           'min="0" max="1" step="0.1" value="1.0" ' + 
                                           'data-toggle="tooltip" data-placement="right" title="Outline opacity (0.0 = transparent, 1.0 = opaque)">' +                          
                                    '</input>' + 
                                '</div>' + 
                            '</div>' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-stroke_linestyle">Line style</label>' + 
                                '<div class="col-sm-8">' + 
                                    '<select class="form-control id="' + this.id + '-layer-style-stroke_linestyle" ' +                                       
                                            'data-toggle="tooltip" data-placement="right" title="Type of line" required="required">' + 
                                        '<option value="solid">Solid</option>'+ 
                                        '<option value="dotted">Dotted</option>' +
                                        '<option value="dashed">Dashed</option>' +
                                        '<option value="dotted-dashed">Dash/dot</option>' + 
                                    '</select>' + 
                                '</div>' + 
                            '</div>' + 
                        '</div>' + 
                        '<div id="' + this.id + '-style-polygon-fs">' + 
                            '<div class="form-group form-group-sm col-sm-12">' + 
                                '<label class="col-sm-4 control-label" for="' + this.id + '-layer-style-fill_color">Fill colour</label>' + 
                                '<div class="col-sm-8">' +
                                    '<input type="color" class="form-control" id="' + this.id + '-layer-style-fill_color" ' +                                        
                                           'data-toggle="tooltip" data-placement="right" title="Colour of the graphic interior fill, default black"' + 
                                    '</input>' +
                                '</div>' + 
                            '</div>' + 
                            '<div class="form-group form-group-sm col-sm-12">' +
                                '<label for="' + this.id + '-layer-style-fill_opacity" class="col-sm-4 control-label">Fill opacity</label>' + 
                                '<div class="col-sm-8">' + 
                                    '<input type="number" class="form-control" id="' + this.id + '-layer-style-fill_opacity" ' + 
                                           'placeholder="Fill opacity (0->1)" ' + 
                                           'min="0" max="1" step="0.1" value="1.0" ' + 
                                           'data-toggle="tooltip" data-placement="right" title="Fill opacity (0.0 = transparent, 1.0 = opaque)" required="required">' + 
                                    '</input>' + 
                                '</div>' + 
                            '</div>' +      
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
                        magic.modules.Common.buttonFeedbackSet(this.id, "Upload layer", "xs", "Upload") +                         
                        '<button id="' + this.id + '-cancel" class="btn btn-xs btn-danger" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                            '<span class="fa fa-times-circle"></span> Cancel' + 
                        '</button>' +                        
                    '</div>' +  
                '</div>' +
            '</form>' +               
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Manage user layers</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {         
        /* Get widgets */
        this.ddLayers = jQuery("#" + this.id + "-layers");
        this.divVis   = jQuery("#" + this.id + "-layer-vis-div");
        this.cbVis    = jQuery("#" + this.id + "-layer-vis");        
        this.bmkBtn   = jQuery("#" + this.id + "-layer-bmk");
        this.addBtn   = jQuery("#" + this.id + "-layer-add");
        this.editBtn  = jQuery("#" + this.id + "-layer-edit");
        this.delBtn   = jQuery("#" + this.id + "-layer-delete");
        this.saveBtn  = jQuery("#" + this.id + "-go");
        this.cancBtn  = jQuery("#" + this.id + "-cancel");
        this.mgrForm  = jQuery("#" + this.id + "-form");        
        this.elTitle  = jQuery("#" + this.id + "-layer-edit-title");
        this.editFs   = this.elTitle.closest("div.well");
        this.styleFs  = jQuery("#" + this.id + "-style-fs");
        this.ddStyle = jQuery("#" + this.id + "-layer-style-mode");
        this.lastMod  = jQuery("#" + this.id + "-layer-last-mod");
        /* Initialise drag-drop zone */
        this.initDropzone();
        /* Fetch layers */
        this.populateLayerSelector(uldata);
        /* Set initial button states */
        this.setButtonStates({
            addBtn: false, editBtn: true, delBtn: true, bmkBtn: true
        });
        /* Assign handlers - changing layer dropdown value*/
        this.ddLayers.change(jQuery.proxy(function() {
            this.setButtonStates({
                addBtn: false, editBtn: !this.userLayerSelected(), delBtn: !this.userLayerSelected(), bmkBtn: false
            });
            var layerId = this.selectedLayerId();
            if (layerId == null || layerId == "") {
                this.divVis.addClass("hidden");
            } else {
                this.divVis.removeClass("hidden");
                /* Set checkbox according to selected layer visibility status */
                var layer = this.userLayerData[layerId].olLayer;
                if (layer != null) {
                    this.cbVis.prop("checked", layer.getVisible());
                }
            }
        }, this));
        this.cbVis.change(jQuery.proxy(function(evt) {
            var selId = this.selectedLayerId();
            if (selId != null && selId != "") {
                this.prepLayer(this.userLayerData[selId], this.cbVis.prop("checked"));               
            }
        }, this));
        this.ddStyle.change(jQuery.proxy(function() {
            var selection = this.ddStyle.val();
            if (selection == "auto" || selection == "file") {
                this.styleFs.addClass("hidden");
            } else {
                this.styleFs.removeClass("hidden");
                var pointFs = jQuery("#" + this.id + "-style-point-fs"),
                    lineFs = jQuery("#" + this.id + "-style-line-fs"),
                    polygonFs = jQuery("#" + this.id + "-style-polygon-fs");                
                switch(selection) {
                    case "point":
                        pointFs.removeClass("hidden");
                        lineFs.removeClass("hidden");
                        polygonFs.removeClass("hidden");
                        break;
                    case "line":
                        pointFs.addClass("hidden");
                        lineFs.removeClass("hidden");
                        polygonFs.addClass("hidden");
                        break;
                    default:
                        pointFs.addClass("hidden");
                        lineFs.removeClass("hidden");
                        polygonFs.removeClass("hidden");
                        break;
                }                
            }
        }, this));
        /* Bookmarkable URL button */
        this.bmkBtn.click(jQuery.proxy(function() {             
            bootbox.prompt({
                "title": "Bookmarkable URL",
                "value": this.selectedLayerLoadUrl(),
                "callback": function(result){}
            });
        }, this));
        /* New layer button */
        this.addBtn.click(jQuery.proxy(function() {
            this.showEditForm(null);
        }, this));
        /* Edit layer button */
        this.editBtn.click(jQuery.proxy(function() {   
            var layerData = this.userLayerData[this.selectedLayerId()];
            this.showEditForm(layerData);
        }, this));
         /* Delete layer button */
        this.delBtn.click(jQuery.proxy(function() {            
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this layer?</div>', jQuery.proxy(function(result) {
                if (result) {
                    /* Do the deletion */
                    var id = this.selectedLayerId();
                    var jqxhr = jQuery.ajax({
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
                        this.fetchLayers(uldata);                                                
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
        this.cancBtn.click(jQuery.proxy(function() {
            this.mgrForm[0].reset();
            this.editFs.addClass("hidden");
            this.setButtonStates({
                addBtn: false, editBtn: !this.userLayerSelected(), delBtn: !this.userLayerSelected(), bmkBtn: true
            });              
            this.ddLayers.removeClass("disabled");    
            this.ddLayers.prop("disabled", false);
            this.divVis.addClass("hidden");
        }, this));
        /* Close button */
        jQuery(".layermanager-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
    }, this));           
};

/**
 * Show the edit layer form, pre-populated with the given object
 * @param {Object} populator
 */
magic.classes.UserLayerManager.prototype.showEditForm = function(populator) {
    this.editFs.removeClass("hidden");    
    this.mgrForm[0].reset();
    if (populator != null) {
        this.elTitle.html('<strong>Edit existing layer</strong>');
        this.payloadToForm(populator);
        this.lastMod.closest("div.form-group").show();
        this.lastMod.html(populator.modified_date);
    } else {
        this.elTitle.html('<strong>Upload a new file</strong>');
        this.lastMod.closest("div.form-group").hide();
    }
    this.setButtonStates({
        addBtn: true, editBtn: true, delBtn: true, bmkBtn: true
    });     
    this.mgrForm.find("input").first().focus();
    this.ddLayers.prop("disabled", true);
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
    var xhr = jQuery.ajax({
        url: magic.config.paths.baseurl + "/userlayers/data", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    }).done(jQuery.proxy(function(uldata) {
        cb(uldata);
    }, this)).fail(function() {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load available user layers</div>');
    });
};

/**
 * Populate the user layer selection dropdown
 * @param {Object} uldata
 */
magic.classes.UserLayerManager.prototype.populateLayerSelector = function(uldata) {
    var currentUser = null, ulGroup = null;
    var defOpt = jQuery("<option>", {value: ""});
    defOpt.text("Please select...");
    this.ddLayers.append(defOpt);
    jQuery.each(uldata, jQuery.proxy(function(iul, ul) {
        if (currentUser == null || ul.owner != currentUser) {
            currentUser = ul.owner;
            ulGroup = jQuery("<optgroup>", {label: currentUser == magic.runtime.username ? "Your uploaded layers" : "Community uploaded layers"});
            this.ddLayers.append(ulGroup);
        }
        var ulOpt = jQuery("<option>", {value: ul.id});
        ulOpt.text(ul.caption);
        ulGroup.append(ulOpt);        
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
    return(this.userLayerData[this.ddLayers.val()].owner == magic.runtime.username);
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
    console.log("*** Entered prepLayer() ***");
    console.log(layerData);    
    if (typeof visible !== "boolean") {
        console.log("Determine visibility from payload config...");
        visible = this.userPayloadConfig[layerData.id].visibility;
    }
    console.log("Intended to be visible : " + visible);
    var olLayer = null;     
    var exLayer = layerData.olLayer;
    if (exLayer == null) {
        if (visible) {
            /* We create the layer now */
            console.log("No existing layer => create it...");
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
                    resolutions: magic.runtime.viewdata.resolutions,
                    origin: proj.getExtent().slice(0, 2)
                }),
                projection: proj
            });
            olLayer = new ol.layer.Tile({
                name: nd.name,
                visible: visible,
                opacity: this.userPayloadConfig[layerData.id].opacity || 1.0,
                minResolution: magic.runtime.viewdata.resolutions[magic.runtime.viewdata.resolutions.length-1],
                maxResolution: magic.runtime.viewdata.resolutions[0]+1,
                metadata: nd,
                source: wmsSource
            });
            nd.layer = olLayer;    
            nd.layer.setZIndex(this.zIndexWmsStack++);
            this.map.addLayer(olLayer);
            console.log("Created ok");
        } else {
            console.log("Not necessary to create the layer yet");
        }
    } else {
        /* Layer already exists, do a refresh in case the layer name has changed */
        console.log("Layer exists => refresh only");
        olLayer = exLayer;
        if (jQuery.isFunction(olLayer.getSource().updateParams)) {
            olLayer.getSource().updateParams(jQuery.extend({}, 
                olLayer.getSource().getParams(), 
                {"LAYERS": layerData.layer}
            ));
        }
        olLayer.setVisible(visible);
        console.log("Done");
    }
    layerData.olLayer = olLayer;
    this.userLayerData[layerData.id] = layerData;
    console.log("UserLayerData is now:");
    console.log(this.userLayerData);
    console.log("*** Exiting prepLayer() ***");
    return(olLayer);
};

/**
 * Return the identifier for the selected layer option
 */
magic.classes.UserLayerManager.prototype.selectedLayerId = function() {
    return(this.ddLayers.val());
};

/**
 * Return the load URL for the selected layer
 */
magic.classes.UserLayerManager.prototype.selectedLayerLoadUrl = function() {
    //TODO  
    console.log("Not implemented");
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
    var idBase = "#" + this.id + "-layer-";
    var inputs = ["id", "caption", "description", "allowed_usage"];
    jQuery.each(inputs, function(idx, ip) {
        payload[ip] = jQuery(idBase + ip).val();
    });
    var styledef = {};
    var styleIdBase = idBase + "style-";
    var styleInputs = ["mode", "marker", "radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    jQuery.each(styleInputs, jQuery.proxy(function(idx, sip) {
        styledef[sip] = jQuery(styleIdBase + sip).val();
    }, this));
    payload["styledef"] = JSON.stringify(styledef);
    return(payload);
};

/**
 * Populate form from given JSON payload
 * @param {Object} populator
 */
magic.classes.UserLayerManager.prototype.payloadToForm = function(populator) {
    var idBase = "#" + this.id + "-layer-";
    var inputs = ["id", "caption", "description", "allowed_usage"];
    jQuery.each(inputs, function(idx, ip) {
        jQuery(idBase + ip).val(populator[ip]);
    });
    var styleIdBase = idBase + "style-";
    var styleInputs = ["mode", "marker", "radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    var styledef = populator["styledef"];
    if (typeof styledef === "string") {
        styledef = JSON.parse(styledef);
    }
    if (styledef["mode"] != "default" && styledef["mode"] != "file") {
        this.styleFs.removeClass("hidden");
    } else {
        this.styleFs.addClass("hidden");
    }
    jQuery.each(styleInputs, jQuery.proxy(function(idx, sip) {
        jQuery(styleIdBase + sip).val(styledef[sip]);
    }, this));
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
    jQuery("div#publish-files-dz").dropzone({
        url: magic.config.paths.baseurl + "/userlayers/save",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 100,  /* Maximum file size, in MB */
        uploadMultiple: false,
        autoDiscover: false,
        autoProcessQueue: false,
        maxFiles: 1,
        parallelUploads: 1,
        previewTemplate: previewTemplate,
        headers: {
            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
        },
        init: function () {
            this.on("complete", jQuery.proxy(function(file, response) {
                if (response.status < 400) {
                    /* Successful save */
                    magic.modules.Common.buttonClickFeedback(this.ulm.id, true, response.detail);
                    this.setButtonStates({
                        addBtn: false, editBtn: !this.ulm.userLayerSelected(), delBtn: !this.ulm.userLayerSelected(), bmkBtn: true
                    });                             
                    this.ulm.ddLayers.prop("disabled", false);
                    setTimeout(jQuery.proxy(function() {
                        this.editFs.addClass("hidden");
                    }, this.ulm), 2000);
                    this.ulm.fetchlayers(jQuery.proxy(this.ulm.populateLayerSelector, this.ulm));
                } else {
                    /* Failed to save */
                    magic.modules.Common.buttonClickFeedback(this.ulm.id, false, response.detail);
                    setTimeout(jQuery.proxy(function() {
                        this.editFs.addClass("hidden");
                    }, this.ulm), 2000);
                }
            }, {pfdz: this, ulm: ulm})); 
            this.on("maxfilesexceeded", function(file) {
                this.removeAllFiles();
                this.addFile(file);
            });
            this.on("addedfile", function(file) {
                jQuery("div#publish-files-dz").find("p.name").html(magic.modules.Common.ellipsis(file.name, 18));
            });
            this.on("error", jQuery.proxy(function() {
                window.setTimeout(jQuery.proxy(this.removeAllFiles, this), 3000);
            }, this));
            /* Save button */
            saveBtn.click(jQuery.proxy(function() {            
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
                    /* Add the other form parameters to the dropzone POST */
                    this.pfdz.on("sending", function(file, xhr, data) {
                        jQuery.each(formdata, function(key, val) {
                            data.append(key, val);
                        });
                    });
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
                                magic.modules.Common.buttonClickFeedback(this.ulm.id, jQuery.isNumeric(response) || response.status < 400, response.detail);
                                this.setButtonStates({
                                    addBtn: false, editBtn: !this.ulm.userLayerSelected(), delBtn: !this.ulm.userLayerSelected(), bmkBtn: true
                                });                               
                                this.ulm.ddLayers.prop("disabled", false);
                                setTimeout(jQuery.proxy(function() {
                                    this.editFs.addClass("hidden");
                                }, this.ulm), 2000);                            
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

