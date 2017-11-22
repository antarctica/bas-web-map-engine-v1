/* Custom map view management */

magic.classes.MapViewManagerForm = function(options) {
        
    /* API options */    
    this.id = options.id || "map-manager";
   
    /* Internals */
   
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* Base and user map data */
    this.baseMapData = null;    
    this.userMapData = null;
    
    /* Form and widgets */    
    this.mgrForm = null;
    
    this.controls = {};        
    
    this.editFs = null;
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
    
};

magic.classes.MapViewManagerForm.prototype.init = function() {
    
    /* Enclosing form */
    this.mgrForm  = jQuery("#" + this.id + "-form"); 
    
    /* Edit form fieldset */
    this.editFs = jQuery("#" + this.id + "-edit-view-fs");
    
    /* Control widgets */
    this.controls = {
        "btn": {
            "load":   jQuery("#" + this.id + "-view-list-go"),
            "bmk":    jQuery("#" + this.id + "-view-list-bmk"),
            "add":    jQuery("#" + this.id + "-add"),
            "edit":   jQuery("#" + this.id + "-edit"),
            "del":    jQuery("#" + this.id + "-delete"),
            "save":   jQuery("#" + this.id + "-go"),
            "cancel": jQuery("#" + this.id + "-cancel")
        },
        "dd": {
            "maps":   jQuery("#" + this.id + "-view-list")
        },
        "chk": {
            "newtab": jQuery("#" + this.id + "-view-new-tab")
        }
    };
   
    /* Clear dropdown map list and prepend the invite to select */
    this.controls.dd.maps.empty();    
    this.controls.dd.maps.append(jQuery("<option>", {value: "", text: "Please select"}));
    
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });
    /* Process base maps and load user-defined map views */
    var baseMapOrder = [];
    this.baseMapData = {};
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        jQuery.each(data, jQuery.proxy(function(idx, rec) {            
            /* Permission-related data before the ':', base map name after */
            var nameCpts = rec.name.split(":");
            this.baseMapData[nameCpts[1]] = {
                "sharing": nameCpts[0],
                "title": rec.title
            };
            /* Preserve the alphabetical ordering of the data */
            baseMapOrder.push(nameCpts[1]);
        }, this));
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {        
        /* List the official base maps */
        var bmGroup = jQuery("<optgroup>", {label: "Publically available maps"});
        jQuery.each(baseMapOrder, jQuery.proxy(function(idx, name) {            
            bmGroup.append(jQuery("<option>", {
                value: name, 
                text: this.baseMapData[name].title
            }));            
        }, this));
        this.controls.dd.maps.append(bmGroup);
        
        /* Now read the user map views defined for each base map */
        this.userMapData = {};
        var currentBm = null, umGroup = null;
        jQuery.each(udata, jQuery.proxy(function(ium, um) {
            if (currentBm == null || um.basemap != currentBm) {
                currentBm = um.basemap;
                umGroup = jQuery("<optgroup>", {label: "Your views of " + this.baseMapData[um.basemap].title});
                this.controls.dd.maps.append(umGroup);
            }
            if (umGroup) {
                umGroup.append(jQuery("<option>", {
                    value: um.id,
                    text: um.name
                }));
                this.userMapData[um.id] = um;
            }
        }, this));                   
        /* Disable irrelevant buttons which might otherwise offer confusing options */
        this.setButtonStates({
            "load": true,
            "edit": true,
            "del": true,
            "bmk": true
        }); 
        /* Assign handlers */
        this.assignHandlers();
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
            '<div class="form-group form-group-sm col-sm-12 edit-view-fs-title"><strong>Select a map view</strong></div>' +
            '<div class="form-group form-group-sm col-sm-12" style="margin-bottom:0px">' +
                '<div class="input-group">' + 
                    '<select id="' + this.id + '-view-list" class="form-control">' +                               
                    '</select>' + 
                    '<span class="input-group-btn">' +
                        '<button id="' + this.id + '-view-list-go" class="btn btn-primary btn-sm" type="button" title="Load map view">' + 
                            '<span class="fa fa-arrow-circle-right"></span>' + 
                        '</button>' +
                    '</span>' +                       
                '</div>' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' + 
                '<div class="checkbox">' + 
                    '<label>' + 
                        '<input id="' + this.id + '-view-new-tab" type="checkbox" checked ' + 
                            'data-toggle="tooltip" data-placement="left" title="Open view in a new browser tab"></input> in a new browser tab' + 
                    '</label>' + 
                '</div>' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                '<button id="' + this.id + '-add" class="btn btn-xs btn-primary" type="button" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Save current map view">' + 
                    '<span class="fa fa-star"></span> Add' + 
                '</button>' +          
                '<button id="' + this.id + '-edit" class="btn btn-xs btn-warning" type="button" style="margin-left:5px" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Update selected map view title">' + 
                    '<span class="fa fa-pencil"></span> Edit' + 
                '</button>' + 
                '<button id="' + this.id + '-delete" class="btn btn-xs btn-danger" type="button" style="margin-left:5px" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Delete selected map view">' + 
                    '<span class="fa fa-times-circle"></span> Delete' + 
                '</button>' + 
                '<button id="' + this.id + '-view-list-bmk" class="btn btn-xs btn-primary" type="button"  style="margin-left:5px" ' + 
                    'data-toggle="tooltip" data-placement="top" title="Bookmarkable URL for selected map view">' + 
                    '<span class="fa fa-bookmark"></span> Shareable URL' + 
                '</button>' +
            '</div>' +  
            '<div id="' + this.id + '-edit-view-fs" class="col-sm-12 well well-sm edit-view-fs hidden">' +
                '<div class="form-group form-group-sm col-sm-12 edit-view-fs-title"><strong>Add new map view</strong></div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +                     
                    '<label class="col-sm-3" for="' + this.id + '-name">Name</label>' + 
                    '<div class="col-sm-9">' + 
                        '<input type="text" name="' + this.id + '-name" id="' + this.id + '-name" class="form-control" ' + 
                            'placeholder="Map name" maxlength="100" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Map name (required)" ' + 
                            'required="required">' +
                        '</input>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-3" for="' + this.id + '-allowed_usage">Share</label>' + 
                    '<div class="col-sm-9">' + 
                        '<select name="' + this.id + '-allowed_usage" id="' + this.id + '-allowed_usage" class="form-control" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Sharing permissions">' +
                            '<option value="owner" default>no</option>' + 
                            '<option value="public">with everyone</option>' +
                            '<option value="login">with logged-in users only</option>' +
                        '</select>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-3 control-label">Modified</label>' + 
                    '<div class="col-sm-9">' + 
                        '<p id="' + this.id + '-last-mod" class="form-control-static"></p>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    magic.modules.Common.buttonFeedbackSet(this.id, "Save map state", "xs") +                         
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
 * Set the various button/widget handlers
 */
magic.classes.MapViewManagerForm.prototype.assignHandlers = function() {       
    
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
        this.mgrForm[0].reset();
        this.editFs.addClass("hidden");
        this.setButtonStates({
            "edit": !this.userMapData[selection], 
            "del": !this.userMapData[selection], 
            "bmk": true
        });              
        this.controls.dd.maps.prop("disabled", false);                
    }, this));
};

/**
 * Show the edit map view form, pre-populated with the given object
 * @param {Object} populator
 */
magic.classes.MapViewManagerForm.prototype.showEditForm = function(populator) {
    this.editFs.removeClass("hidden");    
    this.mgrForm[0].reset();
    if (populator != null) {
        jQuery("div.edit-view-fs-title").html('<strong>Edit existing map view</strong>');
        this.payloadToForm(populator);
        jQuery("#" + this.id + "-last-mod").closest("div.form-group").show();
        this.lastMod.html(populator.modified_date);
    } else {
        jQuery("div.edit-view-fs-title").html('<strong>Save current map view</strong>');
        jQuery("#" + this.id + "-last-mod").closest("div.form-group").hide();
    }
    this.setButtonStates({
        "load": true, "add": true, "edit": true, "del": true, "bmk": true
    });     
    this.mgrForm.find("input").first().focus();
    this.control.dd.maps.prop("disabled", true);
};

magic.classes.MapViewManagerForm.prototype.formToPayload = function() {
    var formdata = {};
    var idBase = "#" + this.id + "-";
    jQuery.each(["id", "basemap", "name", "allowed_usage", "data"], function(idx, elt) {
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
    jQuery.each(["id", "basemap", "name", "allowed_usage", "data"], function(idx, elt) {
        jQuery(idBase + elt).val(formdata[elt]);
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
    return(payload);
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
