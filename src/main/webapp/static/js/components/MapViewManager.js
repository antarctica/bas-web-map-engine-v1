/* Favourite maps form */

magic.classes.MapViewManager = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "viewmanager-tool";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* The retrieved data on base and user defined maps */
    this.userMapData = [];
    
    /* All the various form widgets in convenient jQuery form */
    this.widgets = {};
    
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
                    '<div class="form-group form-group-sm col-sm-12 edit-view-fs-title"><strong>Add new map view</strong></div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' +                     
                        '<label class="col-sm-2" for="' + this.id + '-name">Name</label>' + 
                        '<div class="col-sm-10">' + 
                            '<input type="text" name="' + this.id + '-name" id="' + this.id + '-name" class="form-control" ' + 
                                'placeholder="Map name" maxlength="100" ' + 
                                'data-toggle="tooltip" data-placement="right" ' + 
                                'title="Map name (required)" ' + 
                                'required="required">' +
                            '</input>' + 
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-2" for="' + this.id + '-allowed_usage">Share</label>' + 
                        '<div class="col-sm-10">' + 
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
        /* Fetch maps */
        this.fetchMaps();
        /* Get widgets */
        this.idHid    = jQuery("#" + this.id + "-id");
        this.bmHid    = jQuery("#" + this.id + "-basemap");
        this.nmInp    = jQuery("#" + this.id + "-name");
        this.pmSel    = jQuery("#" + this.id + "-allowed_usage");
        this.loadBtn  = jQuery("#" + this.id + "-view-list-go");
        this.bmkBtn   = jQuery("#" + this.id + "-view-list-bmk");
        this.addBtn   = jQuery("#" + this.id + "-add");
        this.editBtn  = jQuery("#" + this.id + "-edit");
        this.delBtn   = jQuery("#" + this.id + "-delete");
        this.saveBtn  = jQuery("#" + this.id + "-go");
        this.cancBtn  = jQuery("#" + this.id + "-cancel");
        this.mgrForm  = jQuery("#" + this.id + "-form");
        this.editForm = jQuery(".edit-view-fs");
        this.efTitle  = jQuery(".edit-view-fs-title");
        this.dd       = jQuery("#" + this.id + "-view-list");
        this.newTab   = jQuery("#" + this.id + "-view-new-tab");
        /* Assign handlers - changing dropdown value*/
        this.dd.change(jQuery.proxy(function() {
            var mapId = this.dd.val();
            var userMap = this.isUserMap(mapId);
            this.idHid.val(mapId);                        
            this.editBtn.prop("disabled", !userMap);
            this.loadBtn.prop("disabled", false);
        }, this));
        /* Load map button */
        this.loadBtn.click(jQuery.proxy(function() {            
            window.open(magic.config.paths.baseurl + "/home/" + this.dd.val(), this.newTab.prop("checked") ? "_blank" : "_self"); 
        }, this));
        /* Bookmarkable URL button */
        this.bmkBtn.click(jQuery.proxy(function() {            
            bootbox.prompt({
                "title": "Bookmarkable URL",
                "value": magic.config.paths.baseurl + "/home/" + this.dd.val(),
                "callback": function(result){}
            });
        }, this));
        /* New map button */
        this.addBtn.click(jQuery.proxy(function() {
            this.editForm.removeClass("hidden");
            this.efTitle.html('<strong>Add new map</strong>');
            this.mgrForm[0].reset();                
            this.editBtn.prop("disabled", true);
            this.prop("disabled", true);
            this.loadBtn.prop("disabled", true);
            this.nmInp.focus();
        }, this));
        /* Edit map button */
        this.editBtn.click(jQuery.proxy(function() {
            this.editForm.removeClass("hidden");
            this.efTitle.html('<strong>Edit existing map</strong>');
            var mapData = this.userMapData[this.dd.prop("selectedIndex")];
            this.idHid.val(mapData.id);
            this.bmHid.val(mapData.basemap);
            this.nmInp.val(mapData.title);
            this.pmSel.val(mapData.permissions);
            this.nmInp.focus();
        }, this));
         /* Delete map button */
        this.delBtn.click(jQuery.proxy(function() {
            var mapView = this.dd.val();
            if (!this.isUserMap(mapView)) {
                return(false);
            }
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure?</div>', jQuery.proxy(function(result) {
                if (result) {
                    /* Do the deletion */
                    var jqxhr = jQuery.ajax({
                        url: magic.config.paths.baseurl + "/usermaps/delete/" + mapView.substring(mapView.indexOf("/")+1),
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
            if (this.nmInp[0].checkValidity() === false) {
                this.nmInp.closest("div.form-group").addClass("has-error");
            } else {
                this.nmInp.closest("div.form-group").removeClass("has-error");
                var formdata = {
                    id: this.idHid.val(),
                    name: this.nmInp.val(),
                    allowed_usage: this.pmSel.val(),
                    basemap: this.bmHid.val() || magic.runtime.mapname,
                    data: this.mapPayload()
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
                        this.loadBtn.prop("disabled", false);
                        this.editBtn.prop("disabled", false);
                        this.delBtn.prop("disabled", false);
                        this.dd.prop("disabled", false);
                        setTimeout(jQuery.proxy(function() {
                            this.editForm.addClass("hidden");
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
            this.editForm.addClass("hidden");
            this.loadBtn.prop("disabled", false);
            this.editBtn.prop("disabled", false);
            this.delBtn.prop("disabled", false);
            this.dd.prop("disabled", false);                
        }, this));
        /* Close button */
        jQuery(".viewmanager-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));                
    }, this));           
};

/**
 * Fetch data on all official public and derived map views
 */
magic.classes.MapViewManager.prototype.fetchMaps = function() {
    /* Clear select and prepend the invite to select */
    this.dd.empty();
    this.dd.append(jQuery("<option>", {value: "", text: "Please select"}));
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
            var bmOpt = jQuery("<option>", {value: bm.name});
            bmOpt.text(bm.title);
            bmGroup.append(bmOpt);
            bmTitles[bm.name.substring(bm.name.indexOf(":")+1)] = bm.title;
        });
        this.dd.append(bmGroup);
        this.userMapData = udata;
        var currentBm = null;
        var umGroup = null;
        jQuery.each(userMapData, jQuery.proxy(function(ium, um) {
            if (currentBm == null || um.basemap != currentBm) {
                umGroup = jQuery("<optgroup>", {label: "Views of " + bmTitles[um.basemap]});
                this.dd.append(umGroup);
            }
            var umOpt = jQuery("<option>", {value: um.basemap + "/" + um.id});
            umOpt.text(um.name);
            umGroup.append(umOpt);
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
 * Detect whether map with given id is a public base map (non-writable) or a user view (expressed as <basemapname>/<id>)
 * @param {type} mapid
 * @return {Boolean}
 */
magic.classes.MapViewManager.prototype.isUserMap = function(mapid) {
    return(mapid.indexOf("/") >= 0);
};
