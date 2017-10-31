/* Custom map view management */

magic.classes.MapViewManager = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "viewmanager-tool";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* The retrieved data on base and user defined maps */
    this.userMapData = {};
    
    this.template = 
        '<div class="popover popover-auto-width viewmanager-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 350px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-form" class="form-horizontal" role="form">' +
                '<input type="hidden" id="' + this.id + '-id"></input>' + 
                '<input type="hidden" id="' + this.id + '-basemap"></input>' +                
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
                '<div class="col-sm-12 well well-sm edit-view-fs hidden">' +
                    '<div id="' + this.id + '-eftitle" class="form-group form-group-sm col-sm-12 edit-view-fs-title"><strong>Add new map view</strong></div>' + 
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
            '</form>' +               
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Manage map views</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {        
        /* Get widgets */
        this.loadBtn  = jQuery("#" + this.id + "-view-list-go");
        this.bmkBtn   = jQuery("#" + this.id + "-view-list-bmk");
        this.addBtn   = jQuery("#" + this.id + "-add");
        this.editBtn  = jQuery("#" + this.id + "-edit");
        this.delBtn   = jQuery("#" + this.id + "-delete");
        this.saveBtn  = jQuery("#" + this.id + "-go");
        this.cancBtn  = jQuery("#" + this.id + "-cancel");
        this.mgrForm  = jQuery("#" + this.id + "-form");        
        this.efTitle  = jQuery("#" + this.id + "-eftitle");
        this.editFs   = this.efTitle.closest("div.well");
        this.ddMaps   = jQuery("#" + this.id + "-view-list");
        this.newTab   = jQuery("#" + this.id + "-view-new-tab");
        this.lastMod  = jQuery("#" + this.id + "-last-mod");
        /* Fetch maps */
        this.fetchMaps();
        /* Set initial button states */
        this.setButtonStates({
            loadBtn: true, addBtn: false, editBtn: true, delBtn: true, bmkBtn: true
        });
        /* Assign handlers - changing dropdown value*/
        this.ddMaps.change(jQuery.proxy(function() {
            this.setButtonStates({
                loadBtn: this.ddMaps.val() == "", addBtn: false, editBtn: !this.userMapSelected(), delBtn: !this.userMapSelected(), bmkBtn: false
            });            
        }, this));
        /* Load map button */
        this.loadBtn.click(jQuery.proxy(function() {                
            window.open(this.selectedMapLoadUrl(), this.newTab.prop("checked") ? "_blank" : "_self"); 
        }, this));
        /* Bookmarkable URL button */
        this.bmkBtn.click(jQuery.proxy(function() {             
            bootbox.prompt({
                "size": "small",
                "title": "Bookmarkable URL",
                "value": this.selectedMapLoadUrl(),
                "callback": function(result){}
            });
        }, this));
        /* New map button */
        this.addBtn.click(jQuery.proxy(function() {
            this.showEditForm(null);            
        }, this));
        /* Edit map button */
        this.editBtn.click(jQuery.proxy(function() { 
            var mapData = this.userMapData[this.selectedMapId()];
            this.showEditForm(mapData);            
        }, this));
         /* Delete map button */
        this.delBtn.click(jQuery.proxy(function() {            
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this view?</div>', jQuery.proxy(function(result) {
                if (result) {
                    /* Do the deletion */
                    var jqxhr = jQuery.ajax({
                        url: magic.config.paths.baseurl + "/usermaps/delete/" + this.selectedMapId(),
                        method: "DELETE",
                        beforeSend: function (xhr) {
                            var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                            var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                            xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                        }
                    })
                    .done(jQuery.proxy(this.fetchMaps, this))
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
        this.saveBtn.click(jQuery.proxy(function() { 
            var nameInput = jQuery("#" + this.id + "-name");
            if (nameInput[0].checkValidity() === false) {
                nameInput.closest("div.form-group").addClass("has-error");
            } else {
                nameInput.closest("div.form-group").removeClass("has-error");
                var formdata = {
                    id:             jQuery("#" + this.id + "-id").val(),
                    name:           nameInput.val(),
                    allowed_usage:  jQuery("#" + this.id + "-allowed_usage").val(),
                    basemap:        jQuery("#" + this.id + "-basemap").val() || magic.runtime.map_context.mapname,
                    data:           this.mapPayload()
                };
                var saveUrl = magic.config.paths.baseurl + "/usermaps/" + (formdata.id ? "update/" + formdata.id : "save");                
                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");               
                var jqXhr = jQuery.ajax({
                    url: saveUrl, 
                    data: JSON.stringify(formdata), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": csrfHeaderVal
                    }
                })
                .done(jQuery.proxy(function(response) {
                        magic.modules.Common.buttonClickFeedback(this.id, jQuery.isNumeric(response) || response.status < 400, response.detail);
                        this.setButtonStates({
                            loadBtn: false, addBtn: false, editBtn: !this.userMapSelected(), delBtn: !this.userMapSelected(), bmkBtn: true
                        });                             
                        this.ddMaps.prop("disabled", false);
                        setTimeout(jQuery.proxy(function() {
                            this.editFs.addClass("hidden");
                        }, this), 1000);
                        this.fetchMaps();
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
        this.cancBtn.click(jQuery.proxy(function() {
            this.mgrForm[0].reset();
            this.editFs.addClass("hidden");
            this.setButtonStates({
                loadBtn: false, addBtn: false, editBtn: !this.userMapSelected(), delBtn: !this.userMapSelected(), bmkBtn: true
            });              
            this.ddMaps.prop("disabled", false);                
        }, this));
        /* Close button */
        jQuery(".viewmanager-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));                
    }, this));           
};

/**
 * Show the edit map view form, pre-populated with the given object
 * @param {Object} populator
 */
magic.classes.MapViewManager.prototype.showEditForm = function(populator) {
    this.editFs.removeClass("hidden");    
    this.mgrForm[0].reset();
    if (populator != null) {
        this.efTitle.html('<strong>Edit existing map view</strong>');
        var inputs = ["id", "basemap", "name", "allowed_usage"];
        var idBase = "#" + this.id + "-";
        jQuery.each(inputs, function(idx, inp) {
            jQuery(idBase + inp).val(populator[inp]);
        });
        this.lastMod.closest("div.form-group").show();
        this.lastMod.html(populator.modified_date);
    } else {
        this.efTitle.html('<strong>Save current map view</strong>');
        this.lastMod.closest("div.form-group").hide();
    }
    this.setButtonStates({
        loadBtn: true, addBtn: true, editBtn: true, delBtn: true, bmkBtn: true
    });     
    this.mgrForm.find("input").first().focus();
    this.ddMaps.prop("disabled", true);
};

/**
 * Fetch data on all official public and derived map views
 */
magic.classes.MapViewManager.prototype.fetchMaps = function() {
    /* Clear select and prepend the invite to select */
    this.ddMaps.empty();
    this.ddMaps.append(jQuery("<option>", {value: "", text: "Please select"}));
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });
    var baseMapData;
    /* Load the user-defined map views */
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        baseMapData = data;
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {
        /* List the official base maps */
        var bmTitles = {};
        var bmGroup = jQuery("<optgroup>", {label: "Publically available maps"});
        jQuery.each(baseMapData, function(ibm, bm) {
            /* Strip permission-related data before the ':' */
            var santisedName = bm.name.substring(bm.name.indexOf(":")+1);
            var bmOpt = jQuery("<option>", {value: bm.name});
            bmOpt.text(bm.title);
            bmGroup.append(bmOpt);
            bmTitles[santisedName] = bm.title;
        });
        this.ddMaps.append(bmGroup);
        this.userMapData = {};
        var currentBm = null, umGroup = null;
        jQuery.each(udata, jQuery.proxy(function(ium, um) {
            if (currentBm == null || um.basemap != currentBm) {
                currentBm = um.basemap;
                umGroup = jQuery("<optgroup>", {label: "Your views of " + bmTitles[um.basemap]});
                this.ddMaps.append(umGroup);
            }
            var umOpt = jQuery("<option>", {value: "user:" + um.id});
            umOpt.text(um.name);
            umGroup.append(umOpt);
            this.userMapData[um.id] = um;
        }, this));                   
        /* Disable irrelevant buttons which might otherwise offer confusing options */       
        this.loadBtn.prop("disabled", udata.length == 0 && baseMapData.length == 0);
        this.editBtn.prop("disabled", udata.length == 0);
        this.delBtn.prop("disabled", udata.length == 0);
    }, this));
    userRequest.fail(function(xhr, status) {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load available map views</div>');
    });          
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.MapViewManager.prototype.mapPayload = function() {
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
 * Set the form button states according to received object
 * @para, {Object} states
 * @return {Boolean}
 */
magic.classes.MapViewManager.prototype.setButtonStates = function(states) {
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
 * Detect whether selected map option represents a public base map (non-writable) or a user view (expressed as <basemapname>/<id>)
 * @return {Boolean}
 */
magic.classes.MapViewManager.prototype.userMapSelected = function() {
    return(this.ddMaps.val().startsWith("user:"));
};

/**
 * Return the identifier for the selected map option
 */
magic.classes.MapViewManager.prototype.selectedMapId = function() {
    return(this.ddMaps.val().substring(this.ddMaps.val().indexOf(":")+1));   
};

/**
 * Return the load URL for the selected map option
 */
magic.classes.MapViewManager.prototype.selectedMapLoadUrl = function() {
    var url = magic.config.paths.baseurl + "/home/";
    if (this.userMapSelected()) {
        url += this.userMapData[this.selectedMapId()].basemap + "/" + this.selectedMapId();
    } else {
        url += this.selectedMapId();
    }
    return(url);   
};