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
    this.base_map_data = [];
    this.user_map_data = [];
    
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
                        '<select id="' + this.id + '-view-list" class="form-control fa">' +                               
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
                        '<span class="fa fa-bookmark"></span>' + 
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
                            '<select name="' + this.id + '-permissions" id="' + this.id + '-allowed_usage" class="form-control" ' + 
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
        /* Assign handlers */
        var dd = jQuery("#" + this.id + "-view-list");
        var idHid = jQuery("#" + this.id + "-id"),
            bmHid = jQuery("#" + this.id + "-basemap"),
            nmInp = jQuery("#" + this.id + "-name"),
            pmSel = jQuery("#" + this.id + "-allowed_usage"),
            loadBtn = jQuery("#" + this.id + "-view-list-go"),
            bmkBtn = jQuery("#" + this.id + "-view-list-bmk"),
            addBtn = jQuery("#" + this.id + "-add"),
            editBtn = jQuery("#" + this.id + "-edit"),
            delBtn = jQuery("#" + this.id + "-delete"),
            saveBtn = jQuery("#" + this.id + "-go"),
            cancBtn = jQuery("#" + this.id + "-cancel"),
            favFrm = jQuery("#" + this.id + "-form"),
            editForm = jQuery(".edit-view-fs"),
            editFormTitle = jQuery(".edit-view-fs-title"); 
        /* Changing dropdown value*/
        dd.change(jQuery.proxy(function() {
            idHid.val(dd.val());
            editBtn.prop("disabled", false);
            loadBtn.prop("disabled", false);
        }, this));
        /* Load map button */
        loadBtn.click(jQuery.proxy(function() {
            var url;
            if (jQuery.isNumeric(dd.val()) {
                url = magic.config.paths.baseurl + "/home/" + this.user_map_data[dd.prop("selectedIndex")]["basemap"] + "/" + dd.val();
            } else {
                url = magic.config.paths.baseurl + "/home/" dd.val();
            }
            window.open(url, jQuery("#" + this.id + "-view-new-tab").prop("checked") ? "_blank" : "_self"); 
        }, this));
        /* Bookmarkable URL button */
        bmkBtn.click(jQuery.proxy(function() {
            //TODO
            var mapData = this.user_map_data[dd.prop("selectedIndex")];
            bootbox.prompt({
                "title": "Bookmarkable URL",
                "value": magic.config.paths.baseurl + "/home/" + mapData.basemap + "/" + mapData.id,
                "callback": function(result){}
            });
        }, this));
        /* New map button */
        addBtn.click(jQuery.proxy(function() {
            editForm.removeClass("hidden");
            editFormTitle.html('<strong>Add new map</strong>');
            favFrm[0].reset();                
            editBtn.prop("disabled", true);
            dd.prop("disabled", true);
            loadBtn.prop("disabled", true);
            nmInp.focus();
        }, this));
        /* Edit map button */
        editBtn.click(jQuery.proxy(function() {
            editForm.removeClass("hidden");
            editFormTitle.html('<strong>Edit existing map</strong>');
            var mapData = this.user_map_data[dd.prop("selectedIndex")];
            idHid.val(mapData.id);
            bmHid.val(mapData.basemap);
            nmInp.val(mapData.title);
            pmSel.val(mapData.permissions);
            nmInp.focus();
        }, this));
         /* Delete map button */
        delBtn.click(jQuery.proxy(function() {
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure?</div>', function(result) {
                if (result) {
                    /* Do the deletion */
                    var jqxhr = jQuery.ajax({
                        url: magic.config.paths.baseurl + "/usermaps/delete/" + dd.val(),
                        method: "DELETE",
                        beforeSend: function (xhr) {
                            var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                            var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                            xhr.setRequestHeader(csrfHeader, csrfHeaderVal)
                        }
                    })
                    .done(function () {
                        /* Reload the list of maps for the dropdown */
                        jQuery.ajax({
                            url: magic.config.paths.baseurl + "/usermaps/data",
                            method: "GET",
                            dataType: "json"
                        }).done(jQuery.proxy(function(ud) {
                            magic.modules.Common.populateSelect(jQuery("#" + this.id + "-view-list"), ud, "id", "title", false);
                            /* Disable irrelevant buttons */
                            loadBtn.prop("disabled", ud.length == 0);
                            editBtn.prop("disabled", ud.length == 0);
                            delBtn.prop("disabled", ud.length == 0);
                        }, this));
                    })
                    .fail(function (xhr, status) {
                        var detail = JSON.parse(xhr.responseText)["detail"];
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                '<p>Failed to delete user map - details below:</p>' + 
                                '<p>' + detail + '</p>' + 
                            '</div>'
                        );
                    });                   
                    bootbox.hideAll();
                } else {
                    bootbox.hideAll();
                }                            
            });               
        }, this));
        /* Save button */
        jQuery("#" + this.id + "-go").click(jQuery.proxy(function() {
            if (nmInp[0].checkValidity() === false) {
                nmInp.closest("div.form-group").addClass("has-error");
            } else {
                nmInp.closest("div.form-group").removeClass("has-error");
                var formdata = {
                    id: idHid.val(),
                    name: nmInp.val(),
                    allowed_usage: pmSel.val(),
                    basemap: bmHid.val() || magic.runtime.mapname,
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
                        loadBtn.prop("disabled", false);
                        editBtn.prop("disabled", false);
                        delBtn.prop("disabled", false);
                        dd.prop("disabled", false);
                        setTimeout(function() {
                            editForm.addClass("hidden");
                        }, 1000);
                        this.fetchMaps();
                    }, this))
                .fail(function (xhr, status) {
                    var detail = JSON.parse(xhr.responseText)["detail"];
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to save user map - details below:</p>' + 
                            '<p>' + detail + '</p>' + 
                        '</div>'
                    );
                });    
            }                
        }, this));
        /* Cancel button */
        cancBtn.click(jQuery.proxy(function() {
            favFrm[0].reset();
            editForm.addClass("hidden");
            loadBtn.prop("disabled", false);
            editBtn.prop("disabled", false);
            delBtn.prop("disabled", false);
            dd.prop("disabled", false);                
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
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });    
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        this.base_map_data = data;
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {
        this.user_map_data = udata;
        var listData = {};
        /* Group the public and private maps according to base map name */
        for (var i = 0; i < this.base_map_data.length; i++) {
            listData[this.base_map_data[i].name] = [{
                "value": this.base_map_data[i].name,
                "text": this.base_map_data[i].title
            }];
        }
        for (var j = 0; j < this.user_map_data.length; i++) {
            if (this.user_map_data[j].basemap in listData) {
                listData[this.user_map_data[j].basemap].push({
                    "value": this.user_map_data[j].id,
                    "text": "&#xf061;&nbsp;" + this.user_map_data[j].name
                });
            }
        }
        /* Populate dropdown list of available views */
        magic.modules.Common.populateSelect(jQuery("#" + this.id + "-view-list"), listData, "value", "text", false);                        
        /* Disable irrelevant buttons which might otherwise offer confusing options */       
        jQuery("#" + this.id + "-view-list-go").prop("disabled", udata.length == 0);
        jQuery("#" + this.id + "-edit").prop("disabled", udata.length == 0);
        jQuery("#" + this.id + "-delete").prop("disabled", udata.length == 0);
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
