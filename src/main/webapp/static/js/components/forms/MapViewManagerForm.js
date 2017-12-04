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
            this.mapData[um.basemap].views.push(um);            
        }, this)); 
        
        /* Tabulate the layer markup */
        this.mapMarkup();
        //this.assignHandlers();        
        /* Restore any saved state */
        //this.restoreState();   
        /* Set the button states */
        //this.setButtonStates(null);         
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
                jQuery.each(baseData.views, jQuery.proxy(function(vidx, view) {
                    mapInsertAt.append(
                        '<li data-pk="' + view.id + '">' + 
                            '<a style="margin-left:20px" id="' + idBase + '-' + view.id + '-map-select" href="JavaScript:void(0)">' + view.name + '</a>' + 
                        '</li>'
                    );                    
                }, this));
            }
        }, this));
    }
};

/**
 * Set the various button/widget handlers
 */
magic.classes.MapViewManagerForm.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    jQuery("#" + this.id + "-form :input").change(function() {
        jQuery("#" + this.id + "-form").data("changed", true);
    });
    
    /* Changing dropdown value*/
    this.controls.dd.maps.change(jQuery.proxy(function() {
        var selection = this.controls.dd.maps.val(); 
        this.setButtonStates({
            "load": selection == "", 
            "edit": !this.userMapData[selection], 
            "del": !this.userMapData[selection]
        }); 
        /* Repopulate the 'allowed_usage' dropdown in the edit form to only give valid options based on the base map sharing policy */
        this.populateAllowedUsage(selection);
        /* Disable 'load' button if there is no selection */
        this.controls.btn.load.prop("disabled", !selection);
    }, this));
    
    /* Load map button */
    this.controls.btn.load.click(jQuery.proxy(function() {                
        window.open(this.selectedMapLoadUrl(), this.controls.chk.newtab.prop("checked") ? "_blank" : "_self"); 
    }, this));
    
    /* Bookmarkable URL button */
    this.controls.btn.bmk.click(jQuery.proxy(function() {             
        bootbox.prompt({
            "size": "small",
            "title": "Bookmarkable URL",
            "value": this.selectedMapLoadUrl(),
            "callback": function(){}
        });
    }, this));
    
    /* New map button */
    this.controls.btn.add.click(jQuery.proxy(function() {
        this.showEditForm(null);            
    }, this));
    
    /* Edit map button */
    this.controls.btn.edit.click(jQuery.proxy(function() { 
        var selection = this.controls.dd.maps.val(); 
        if (this.userMapData[selection]) {
            this.showEditForm(this.userMapData[selection]);    
        }
    }, this));
    
     /* Delete map button */
    this.controls.btn.del.click(jQuery.proxy(function() {            
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this view?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                var selection = this.controls.dd.maps.val(); 
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
    
    /* Save button */
    this.controls.btn.save.click(jQuery.proxy(function() { 
        var nameInput = jQuery("#" + this.id + "-name");
        if (nameInput[0].checkValidity() === false) {
            nameInput.closest("div.form-group").addClass("has-error");
        } else {
            nameInput.closest("div.form-group").removeClass("has-error");
            var formdata = this.formToPayload();
            var saveUrl = magic.config.paths.baseurl + "/usermaps/" + (formdata.id ? "update/" + formdata.id : "save");                
            jQuery.ajax({
                url: saveUrl, 
                data: JSON.stringify(formdata), 
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                headers: {
                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                }
            })
            .done(jQuery.proxy(function(response) {
                    this.cleanForm();
                    var selection = this.controls.dd.maps.val(); 
                    magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail);
                    this.setButtonStates({
                        "edit": !this.userMapData[selection], 
                        "del": !this.userMapData[selection], 
                        "bmk": true
                    });                             
                    this.controls.dd.maps.prop("disabled", false);
                    setTimeout(jQuery.proxy(function() {
                        this.editFs.addClass("hidden");
                    }, this), 1000);
                    this.init();
                }, this))
            .fail(function (xhr) {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to save user map - details below:</p>' + 
                        '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                    '</div>'
                );
            });    
        }                
    }, this));
    
     /* Cancel button */
    this.controls.btn.cancel.click(jQuery.proxy(function() {
        var selection = this.controls.dd.maps.val(); 
        this.cleanForm();
        this.mgrForm[0].reset();
        this.editFs.addClass("hidden");
        this.setButtonStates({
            "edit": !this.userMapData[selection], 
            "del": !this.userMapData[selection], 
            "bmk": true
        });              
        this.controls.dd.maps.prop("disabled", false); 
        this.clearState();
    }, this));
};

/**
 * Show the edit map view form, pre-populated with the given object
 * @param {Object} populator
 */
magic.classes.MapViewManagerForm.prototype.showEditForm = function(populator) {
    this.editFs.removeClass("hidden"); 
    var lastMod = jQuery("#" + this.id + "-last-mod");
    if (populator == null || populator.id == "") {
        /* Adding a new map */
        if (populator == null) {
            this.mgrForm[0].reset(); 
            this.mgrForm.find("input[type='hidden']").val("");
        } else {
            this.payloadToForm(populator);
        }
        jQuery("div.edit-view-fs-title").html('<strong>Save current map view</strong>');
        lastMod.closest("div.form-group").hide();
        this.controls.dd.maps.val("");
    } else {    
        /* Editing an existing one */
        jQuery("div.edit-view-fs-title").html('<strong>Edit existing map view</strong>');        
        this.payloadToForm(populator);        
        lastMod.closest("div.form-group").show();
        lastMod.html(populator.modified_date);
        this.controls.dd.maps.val(populator.id);
    } 
    this.setButtonStates({
        "load": true, "add": true, "edit": true, "del": true, "bmk": true
    });     
    this.mgrForm.find("input").first().focus();    
    this.controls.dd.maps.prop("disabled", true);
};

magic.classes.MapViewManagerForm.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

magic.classes.MapViewManagerForm.prototype.saveState = function() {
    var selection = this.controls.dd.maps.val();
    var exData = selection ? this.userMapData[selection] : {};
    this.savedState = jQuery.extend(exData, this.formToPayload());
    console.log("============ Save state ============");
    console.log("Selection : " + selection);
    console.log(this.savedState);
    console.log("============ Done ============");
};

magic.classes.MapViewManagerForm.prototype.restoreState = function() {   
    if (!jQuery.isEmptyObject(this.savedState)) {
        console.log("============ Restore state ============");
        console.log(this.savedState);
        console.log("============ Done ============");
        this.showEditForm(this.savedState);
        this.clearState();
    }
};

magic.classes.MapViewManagerForm.prototype.clearState = function() {    
    this.savedState = {};
};

magic.classes.MapViewManagerForm.prototype.formDirty = function() {
    return(this.formEdited);
};

magic.classes.MapViewManagerForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

magic.classes.MapViewManagerForm.prototype.formToPayload = function() {
    var formdata = {};
    var idBase = "#" + this.id + "-";
    jQuery.each(this.inputBaseNames, function(idx, elt) {
        formdata[elt] = jQuery(idBase + elt).val();
    });
    if (formdata.basemap == magic.runtime.map_context.mapname) {
        /* This is an update of the currently loaded map, so update map payload */
        formdata.data = this.mapPayload();
    }
    return(formdata);
};

magic.classes.MapViewManagerForm.prototype.payloadToForm = function(formdata) {
    var idBase = "#" + this.id + "-";
    jQuery.each(this.inputBaseNames, function(idx, elt) {
        jQuery(idBase + elt).val(formdata[elt] || "");
    });
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
 * Enable/disable button states according to received object
 * @param {Object} disableStates
 */
magic.classes.MapViewManagerForm.prototype.setButtonStates = function(disableStates) {
    if (disableStates) {
        jQuery.each(this.controls.btn, jQuery.proxy(function(k, v) {
            if (disableStates[k]) {
                v.addClass("disabled");
            } else {
                v.removeClass("disabled");
            }
        }, this));
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
    var selection = this.controls.dd.maps.val();
    return(magic.config.paths.baseurl + "/home/" + 
        (this.userMapData[selection] ? this.userMapData[selection].basemap + "/" : "") + 
        selection
    );   
};
