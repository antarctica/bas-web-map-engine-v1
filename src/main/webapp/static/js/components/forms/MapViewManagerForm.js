/* Custom map view management */

magic.classes.MapViewManagerForm = function(options) {
        
    /* API options */    
    this.id = options.id || "map-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* Map data */
    this.mapData = null; 
    
    this.baseMapOrder = [];
    
    /* Layer editor popup tools */
    this.editorPopups = {
        "add": null,
        "edit": null
    };
    
    this.inputBaseNames = ["id", "basemap", "name", "allowed_usage", "data"];
    
    this.controls = {};        
        
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    
};

magic.classes.MapViewManagerForm.prototype.init = function() {    
   
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });
    /* Process base maps and load user-defined map views */
    this.mapData = {};
    this.baseMapOrder = [];
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        jQuery.each(data, jQuery.proxy(function(idx, rec) {            
            /* Permission-related data before the ':', base map name after */
            var nameCpts = rec.name.split(":");
            this.mapData[nameCpts[1]] = {
                "sharing": nameCpts[0],
                "title": rec.title,
                "views": []
            };
            /* Preserve the alphabetical ordering of the data */
            this.baseMapOrder.push(nameCpts[1]);
        }, this));
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {        
        jQuery.each(udata, jQuery.proxy(function(ium, um) {
            this.mapData[um.basemap].views.push(um.id);       
            this.mapData[um.id] = um;
        }, this));         
        /* Tabulate the layer markup */
        this.mapMarkup();
        this.assignHandlers(); 
        if (this.hasSavedState()) {
            /* Restore saved state */
            this.restoreState();   
        } else {
            /* Set the default button states */
            this.setButtonStates(null);      
        }
    }, this));
    userRequest.fail(function() {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load available map views</div>');
    });          
};

magic.classes.MapViewManagerForm.prototype.markup = function() {
    return(
        '<form id="' + this.id + '-form" class="form-horizontal" role="form" style="margin-top:10px">' +
            '<input type="hidden" id="' + this.id + '-id"></input>' + 
            '<input type="hidden" id="' + this.id + '-basemap"></input>' + 
            '<input type="hidden" id="' + this.id + '-data"></input>' + 
            '<div class="form-group form-group-sm col-sm-12"><strong>Available base maps and user views</strong></div>' +
            '<div class="btn-toolbar" style="margin-bottom:10px">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-map-select" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                        'data-toggle="dropdown" style="width:180px">' + 
                        'Select a map view&nbsp;&nbsp;<span class="caret"></span>' + 
                    '</button>' + 
                    '<ul id="' + this.id + '-maps" class="dropdown-menu">' +                     
                    '</ul>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' +                      
                    '<button id="' + this.id + '-map-add" class="btn btn-sm btn-primary" type="button" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Save current map view" class="fa fa-star"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.id + '-map-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit selected map view data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-map-del">' +
                        '<i data-toggle="tooltip" data-placement="top" title="Delete selected map view" class="fa fa-trash"></i>' + 
                    '</button>' +                     
                '</div>' +  
                '<div class="btn-group" role="group">' + 
                    '<button id="' + this.id + '-map-bmk" class="btn  btn-sm btn-primary" type="button">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Bookmarkable URL for selected map view" class="fa fa-bookmark"></i>' + 
                    '</button>' +
                    '<button id="' + this.id + '-map-load" class="btn  btn-sm btn-primary" type="button">' + 
                        '<i data-toggle="tooltip" data-placement="top" title="Load selected map view" class="fa fa-arrow-circle-right"></i>' + 
                    '</button>' +
                '</div>' + 
            '</div>' +             
            '<div class="checkbox" style="padding-top:0px">' + 
                '<label>' + 
                    '<input id="' + this.id + '-map-load-new-tab" type="checkbox" checked ' + 
                        'data-toggle="tooltip" data-placement="left" title="Load map in a new browser tab"></input> maps load in new browser tab' + 
                '</label>' + 
            '</div>' + 
        '</form>'
    );
};

magic.classes.MapViewManagerForm.prototype.mapMarkup = function() {
    var mapInsertAt = jQuery("#" + this.id + "-maps");
    mapInsertAt.empty();
    if (this.baseMapOrder.length == 0) {
        /* No records */
        mapInsertAt.append('<li class="dropdown-header">No base maps or user views available</li>');
    } else {
        /* Dropdown markup */
        var idBase = this.id;        
        jQuery.each(this.baseMapOrder, jQuery.proxy(function(idx, baseKey) {
            var baseData = this.mapData[baseKey];
            mapInsertAt.append(
                '<li data-pk="' + baseKey + '">' + 
                    '<a id="' + idBase + '-' + baseKey + '-map-select" href="JavaScript:void(0)"><strong>' + baseData.title + '</strong></a>' + 
                '</li>'
            );
            if (baseData.views.length > 0) {
                /* List out current user's views of this map */
                mapInsertAt.append(
                    '<li class="dropdown-header">' + 
                        '<div style="margin-left:20px">Your views of ' + baseData.title + '</div>' + 
                    '</li>'
                );                
                jQuery.each(baseData.views, jQuery.proxy(function(vidx, viewId) {
                    mapInsertAt.append(
                        '<li data-pk="' + viewId + '">' + 
                            '<a style="margin-left:20px" id="' + idBase + '-' + viewId + '-map-select" href="JavaScript:void(0)">' + this.mapData[viewId].name + '</a>' + 
                        '</li>'
                    );                    
                }, this));
            }
        }, this));
    }
};

/**
 * Enable/disable button states according to received object
 * @param {Object} disableStates
 */
magic.classes.MapViewManagerForm.prototype.setButtonStates = function(disableStates) {
    if (!disableStates) {
        var selMap = this.getSelection();
        disableStates = {
            "load": !selMap, "bmk": !selMap, "add": false, "edit": !selMap, "del": !selMap
        };
    }
    jQuery.each(this.controls.btn, function(k, v) {
        if (disableStates[k]) {
            v.addClass("disabled");
        } else {
            v.removeClass("disabled");
        }
    });
};

/**
 * Set the various button/widget handlers
 */
magic.classes.MapViewManagerForm.prototype.assignHandlers = function() {
    
    var form = jQuery("#" + this.id + "-form");
    
    this.controls = {
        "btn": {
            "load": jQuery("#" + this.id + "-map-load"),
            "bmk": jQuery("#" + this.id + "-map-bmk"),
            "add": jQuery("#" + this.id + "-map-add"),
            "edit": jQuery("#" + this.id + "-map-edit"),
            "del": jQuery("#" + this.id + "-map-del")
        },
        "cb": {
            "newtab": jQuery("#" + this.id + "-map-load-new-tab")
        }       
    };
    
    /* Dropdown layer selection handler */
    form.find("a[id$='-map-select']").off("click").on("click", jQuery.proxy(this.selectMap, this));
    
    /* Load map button */
    this.controls.btn.load.off("click").on("click", jQuery.proxy(function() {                
        window.open(this.selectedMapLoadUrl(), this.controls.cb.newtab.prop("checked") ? "_blank" : "_self"); 
    }, this));
    
    /* Bookmarkable URL button */
    this.controls.btn.bmk.off("click").on("click", jQuery.proxy(function() {             
        bootbox.prompt({
            "size": "small",
            "title": "Bookmarkable URL",
            "value": this.selectedMapLoadUrl(),
            "callback": function(){}
        });
    }, this));
    
    /* New map button */
    this.controls.btn.add.off("click").on("click", jQuery.proxy(function(evt) {
        this.editorPopups.add = new magic.classes.MapEditorPopup({
            id: "map-add-popup-tool",
            caption: "Save current map view",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.edit) {
            this.editorPopups.edit.deactivate();
        }        
        this.editorPopups.add.activate({});            
    }, this));
    
    /* Edit map button */
    this.controls.btn.edit.off("click").on("click", jQuery.proxy(function(evt) { 
        this.editorPopups.edit = new magic.classes.MapEditorPopup({
            id: "map-edit-popup-tool",
            caption: "Edit selected map view",
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.init, this)
        });
        if (this.editorPopups.add) {
            this.editorPopups.add.deactivate();
        }        
        this.editorPopups.edit.activate(this.mapData[this.getSelection()]);    
    }, this));
    
    /* Delete map button */
    this.controls.btn.del.off("click").on("click", jQuery.proxy(function() {            
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this view?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var selection = this.getSelection(); 
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/usermaps/delete/" + selection,
                    method: "DELETE",
                    beforeSend: function (xhr) {                        
                        xhr.setRequestHeader(
                            jQuery("meta[name='_csrf_header']").attr("content"), 
                            jQuery("meta[name='_csrf']").attr("content")
                        );
                    }
                })
                .done(jQuery.proxy(this.init, this))
                .fail(function (xhr) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to delete user map view - details below:</p>' + 
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
 * Set the selection button caption to the name of the current map
 * @param {jQuery.Event} selection event
 */
magic.classes.MapViewManagerForm.prototype.selectMap = function(evt) {
    var selId = null;
    var targetId = evt.currentTarget.id;
    var elt = jQuery("#" + targetId);
    if (elt.length > 0) {
        selId = elt.closest("li").attr("data-pk");
    }        
    if (selId != null && selId != "") {        
        /* Set the dropdown button caption and visibility indicator */
        var name = this.mapData[selId].basemap ? this.mapData[selId].name : this.mapData[selId].title;
        elt.closest(".dropdown-menu").prev().html(           
            magic.modules.Common.ellipsis(name, 20) + "&nbsp;&nbsp;" + 
            '<span class="caret"></span>'
        );
        /* Record the current selection */
        this.setSelection(selId);
        /* Finally reflect selection in button statuses */ 
        if (!this.mapData[selId].basemap) {
            /* Base maps should not offer exit/delete! */
            this.setButtonStates({
                "load": false, "bmk": false, "add": false, "edit": true, "del": true
            });
        } else {
            /* Allow all actions on this user's own maps */
            this.setButtonStates(null);
        }        
    }
};

/**
 * Set the current map selection
 * @param {String|int} value
 */
magic.classes.MapViewManagerForm.prototype.setSelection = function(value) {
    this.currentSelection = value || null;          
};

/**
 * Set the current map selection
 * @return {String|int}
 */
magic.classes.MapViewManagerForm.prototype.getSelection = function() {
     return(this.currentSelection);    
};

magic.classes.MapViewManagerForm.prototype.saveState = function() {
    this.savedState = {
        "selection": this.getSelection()
    };    
};

magic.classes.MapViewManagerForm.prototype.restoreState = function() {     
    if (this.savedState.selection) {        
        jQuery("#" + this.id + "-" + this.savedState.selection + "-map-select").trigger("click");
        this.clearState();
    }
};

magic.classes.MapViewManagerForm.prototype.clearState = function() {    
    this.savedState = {};
};

magic.classes.MapViewManagerForm.prototype.hasSavedState = function() { 
    if (!jQuery.isEmptyObject(this.savedState)) {
        return(this.savedState.selection);
    }
    return(false);
};

magic.classes.MapViewManagerForm.prototype.formDirty = function() {
    return(this.formEdited);
};

magic.classes.MapViewManagerForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

/**
 * Ensure that any user map only has sharing permissions at least as restricted as its base map
 * @param {String} selection
 */
magic.classes.MapViewManagerForm.prototype.populateAllowedUsage = function(selection) {
    if (this.userMapData[selection]) {
        var baseMap = this.userMapData[selection].basemap;
        if (this.baseMapData[baseMap]) {
            var perms = this.baseMapData[baseMap].sharing;
            var allowedUsage = jQuery("#" + this.id + "-allowed_usage");
            allowedUsage.empty();
            allowedUsage.append(jQuery('<option>', {
                value: "owner",
                text: "no"                
            }));
            if (perms == "public") {
                allowedUsage.append(jQuery('<option>', {
                    value: "public",
                    text: "with everyone"                
                }));
            } else if (perms != "owner") {
                allowedUsage.append(jQuery('<option>', {
                    value: "login",
                    text: "with logged-in users only"                
                }));
            }
            allowedUsage.val(this.userMapData[selection].allowed_usage);
        }
    }
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.MapViewManagerForm.prototype.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.center = this.map.getView().getCenter();
        payload.zoom = this.map.getView().getZoom();
        payload.rotation = this.map.getView().getRotation();
        /* Save layer visibility states */
        payload.layers = {};
        this.map.getLayers().forEach(function (layer) {
            if (layer.get("metadata")) {
                var layerId = layer.get("metadata").id;
                if (layerId) {
                    payload.layers[layerId] = {
                        "visibility": layer.getVisible(),
                        "opacity": layer.getOpacity()
                    };
                }
            }
        });
        /* Save group expanded states */
        payload.groups = {};
        jQuery("div[id^='layer-group-panel']").each(function(idx, elt) {
            var groupId = elt.id.replace("layer-group-panel-", "");
            payload.groups[groupId] = jQuery(elt).hasClass("in");
        });
    }
    return(JSON.stringify(payload));
};

/**
 * Return the load URL for the selected map option
 */
magic.classes.MapViewManagerForm.prototype.selectedMapLoadUrl = function() {
    var selId = this.getSelection();
    if (this.mapData[selId].basemap) {
        selId = this.mapData[selId].basemap + "/" + selId;
    }
    return(magic.config.paths.baseurl + "/home/" + selId);   
};
