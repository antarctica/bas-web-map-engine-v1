/* Favourite maps form */

magic.classes.Favourites = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "favourites";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* The retrieved data on user defined maps */
    this.user_map_data = [];
    
    this.template = 
        '<div class="popover popover-auto-width favourites-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 350px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-form" class="form-horizontal" role="form">' +
                '<input type="hidden" id="' + this.id + '-id"></input>' + 
                '<input type="hidden" id="' + this.id + '-basemap"></input>' +
                '<div class="form-group form-group-sm col-sm-12" style="margin-bottom:0px">' +
                    '<div class="input-group">' + 
                        '<select id="' + this.id + '-list" class="form-control">' +                               
                        '</select>' + 
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-list-go" class="btn btn-primary btn-sm" type="button" title="Load map">' + 
                                '<span class="fa fa-arrow-circle-right"></span>' + 
                            '</button>' +
                        '</span>' +                       
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<div class="checkbox">' + 
                        '<label>' + 
                            '<input id="' + this.id + '-new-tab" type="checkbox" checked ' + 
                                'data-toggle="tooltip" data-placement="left" title="Open map in a new browser tab"></input> in a new browser tab' + 
                        '</label>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<button id="' + this.id + '-add" class="btn btn-xs btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Add current map to favourites">' + 
                        '<span class="fa fa-star"></span> Add' + 
                    '</button>' +          
                    '<button id="' + this.id + '-edit" class="btn btn-xs btn-warning" type="button" style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Update title of selected map">' + 
                        '<span class="fa fa-pencil"></span> Edit' + 
                    '</button>' + 
                    '<button id="' + this.id + '-delete" class="btn btn-xs btn-danger" type="button" style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Delete selected map">' + 
                        '<span class="fa fa-times-circle"></span> Delete' + 
                    '</button>' + 
                    '<button id="' + this.id + '-list-bmk" class="btn btn-xs btn-primary" type="button"  style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Bookmarkable URL for selected map">' + 
                        '<span class="fa fa-bookmark"></span>' + 
                    '</button>' +
                '</div>' +  
                '<div class="col-sm-12 well well-sm edit-favourite-fs hidden">' +
                    '<div class="form-group form-group-sm col-sm-12 edit-favourite-fs-title"><strong>Add new map</strong></div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' +                     
                        '<label class="col-sm-2" for="' + this.id + '-title">Name</label>' + 
                        '<div class="col-sm-10">' + 
                            '<input type="text" name="' + this.id + '-title" id="' + this.id + '-title" class="form-control" ' + 
                                'placeholder="Map title" maxlength="100" ' + 
                                'data-toggle="tooltip" data-placement="right" ' + 
                                'title="Map title (required)" ' + 
                                'required="required">' +
                            '</input>' + 
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-2" for="' + this.id + '-permissions">Share</label>' + 
                        '<div class="col-sm-10">' + 
                            '<select name="' + this.id + '-permissions" id="' + this.id + '-permissions" class="form-control" ' + 
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
        title: '<span><big><strong>Load favourite map</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {
        /* Fetch maps */
        this.fetchMaps();
        /* Assign handlers */
        var dd = jQuery("#" + this.id + "-list");
        var idHid = jQuery("#" + this.id + "-id"),
            bmHid = jQuery("#" + this.id + "-basemap"),
            ttInp = jQuery("#" + this.id + "-title"),
            pmSel = jQuery("#" + this.id + "-permissions"),
            loadBtn = jQuery("#" + this.id + "-list-go"),
            bmkBtn = jQuery("#" + this.id + "-list-bmk"),
            addBtn = jQuery("#" + this.id + "-add"),
            editBtn = jQuery("#" + this.id + "-edit"),
            delBtn = jQuery("#" + this.id + "-delete"),
            saveBtn = jQuery("#" + this.id + "-go"),
            cancBtn = jQuery("#" + this.id + "-cancel"),
            favFrm = jQuery("#" + this.id + "-form"),
            editForm = jQuery(".edit-favourite-fs"),
            editFormTitle = jQuery(".edit-favourite-fs-title"); 
        /* Changing dropdown value*/
        dd.change(jQuery.proxy(function() {
            idHid.val(dd.val());
            editBtn.prop("disabled", false);
            loadBtn.prop("disabled", false);
        }, this));
        /* Load map button */
        loadBtn.click(jQuery.proxy(function() {
            var mapData = this.user_map_data[dd.prop("selectedIndex")];
            window.open(
                magic.config.paths.baseurl + "/home/" + mapData.basemap + "/" + mapData.id, 
                jQuery("#" + this.id + "-new-tab").prop("checked") ? "_blank" : "_self"
            ); 
        }, this));
        /* Bookmarkable URL button */
        bmkBtn.click(jQuery.proxy(function() {
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
            ttInp.focus();
        }, this));
        /* Edit map button */
        editBtn.click(jQuery.proxy(function() {
            editForm.removeClass("hidden");
            editFormTitle.html('<strong>Edit existing map</strong>');
            var mapData = this.user_map_data[dd.prop("selectedIndex")];
            idHid.val(mapData.id);
            bmHid.val(mapData.basemap);
            ttInp.val(mapData.title);
            pmSel.val(mapData.permissions);
            ttInp.focus();
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
                            magic.modules.Common.populateSelect(jQuery("#" + this.id + "-list"), ud, "id", "title", false);
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
            if (ttInp[0].checkValidity() === false) {
                ttInp.closest("div.form-group").addClass("has-error");
            } else {
                ttInp.closest("div.form-group").removeClass("has-error");
                var formdata = {
                    id: idHid.val(),
                    title: ttInp.val(),
                    permissions: pmSel.val(),
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
                        magic.modules.Common.buttonClickFeedback(this.id, response.status < 400, response.detail); 
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
        jQuery(".favourites-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));                
    }, this));           
};

/**
 * Fetch data on bookmarked maps 
 */
magic.classes.Favourites.prototype.fetchMaps = function() {
    jQuery.ajax({
        url: magic.config.paths.baseurl + "/usermaps/data",
        method: "GET",
        dataType: "json"
    }).done(jQuery.proxy(function(data) {
        this.user_map_data = data;
        /* Populate dropdown list of available maps */
        magic.modules.Common.populateSelect(jQuery("#" + this.id + "-list"), data, "id", "title", false);                        
        /* Disable irrelevant buttons */       
        jQuery("#" + this.id + "-list-go").prop("disabled", data.length == 0);
        jQuery("#" + this.id + "-edit").prop("disabled", data.length == 0);
        jQuery("#" + this.id + "-delete").prop("disabled", data.length == 0);
    }, this)).fail(function(data) {            
    });
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.Favourites.prototype.mapPayload = function() {
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
                    }
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
