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
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label for="' + this.id + '-list">Load</label>' + 
                    '<div class="input-group">' + 
                        '<select id="' + this.id + '-list" class="form-control">' +                               
                        '</select>' + 
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-list-go" class="btn btn-primary btn-sm" type="button" title="Load map (warning - will replace your current map!)">' + 
                                '<span class="fa fa-arrow-circle-right"></span>' + 
                            '</button>' +
                        '</span>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<button id="' + this.id + '-add" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Add current map to favourites">' + 
                        '<span class="fa fa-star"></span> Add' + 
                    '</button>' +          
                    '<button id="' + this.id + '-edit" class="btn btn-warning" type="button" style="margin-left:5px" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Update title of selected map">' + 
                        '<span class="fa fa-pencil"></span> Edit' + 
                    '</button>' + 
                '</div>' +  
                '<div class="edit-favourite-fs hidden" style="width:100% !important">' + 
                    '<input type="hidden" id="' + this.id + '-id"></input>' + 
                    '<input type="hidden" id="' + this.id + '-basemap"></input>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<input type="text" name="' + this.id + '-title" id="' + this.id + '-title" class="form-control" ' + 
                            'placeholder="Caption for favourite map" maxlength="100" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Caption for favourite map (required)" ' + 
                            'required="required">' +
                        '</input>' +                        
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        magic.modules.Common.buttonFeedbackSet(this.id, "Save map state") +                         
                        '<button id="' + this.id + '-cancel" class="btn btn-default btn-danger" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                            '<span class="fa fa-times-circle"></span> Cancel' + 
                        '</button>' +                        
                    '</div>' +  
                '</div>' + 
            '</form>' +               
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Favourite maps</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {
        /* Fetch data on bookmarked maps */
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }).done(jQuery.proxy(function(data) {
            this.user_map_data = data;
            /* Populate dropdown list of available maps */
            magic.modules.Common.populateSelect(jQuery("#" + this.id + "-list"), data, "id", "title", false);            
            /* Assign handlers */
            var dd = jQuery("#" + this.id + "-list");
            var idHid = jQuery("#" + this.id + "-id"),
                bmHid = jQuery("#" + this.id + "-basemap"),
                ttInp = jQuery("#" + this.id + "-title"),
                loadBtn = jQuery("#" + this.id + "-list-go"),
                addBtn = jQuery("#" + this.id + "-add"),
                editBtn = jQuery("#" + this.id + "-edit"),
                saveBtn = jQuery("#" + this.id + "-go"),
                cancBtn = jQuery("#" + this.id + "-cancel"),
                favFrm = jQuery("#" + this.id + "-form"),
                editForm = jQuery(".edit-favourite-fs");            
            /* Changing dropdown value*/
            dd.change(jQuery.proxy(function() {
                idHid.val(dd.val());
                editBtn.prop("disabled", false);
                loadBtn.prop("disabled", false);
            }, this));
            /* Load map button */
            loadBtn.click(jQuery.proxy(function() {
                var mapData = this.user_map_data[dd.prop("selectedIndex")];
                window.location = magic.config.paths.baseurl + "/home/" + mapData.basemap + "/" + mapData.id;
            }, this));
            /* New map button */
            addBtn.click(jQuery.proxy(function() {
                editForm.removeClass("hidden");
                favFrm[0].reset();                
                editBtn.prop("disabled", true);
                dd.prop("disabled", true);
                loadBtn.prop("disabled", true);
            }, this));
            /* Edit map button */
            editBtn.click(jQuery.proxy(function() {
                editForm.removeClass("hidden");
                var mapData = this.user_map_data[dd.prop("selectedIndex")];
                idHid.val(mapData.id);
                bmHid.val(mapData.basemap);
                ttInp.val(mapData.title);                
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
                        basemap: bmHid.val() || magic.runtime.mapname,
                        data: this.mapPayload()
                    };
                    var saveUrl = magic.config.paths.baseurl + "/usermaps/" + (formdata.id ? "update/" + formdata.id : "save");                
                    var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");               
                    jQuery.ajax({
                        url: saveUrl, 
                        data: JSON.stringify(formdata), 
                        method: "POST",
                        dataType: "json",
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-TOKEN": csrfHeaderVal
                        },
                        success: jQuery.proxy(function(response) {
                            magic.modules.Common.buttonClickFeedback(this.id, response.status < 400, response.detail);                        
                        }, this)
                    });
                }                
            }, this));
            /* Cancel button */
            cancBtn.click(jQuery.proxy(function() {
                favFrm[0].reset();
                editForm.addClass("hidden");
                editBtn.prop("disabled", false);
                dd.prop("disabled", false);
                loadBtn.prop("disabled", false);
            }, this));
            /* Close button */
            jQuery(".favourites-popover").find("button.close").click(jQuery.proxy(function() { 
                this.target.popover("hide");
            }, this));
            /* Disable irrelevant buttons */
            loadBtn.prop("disabled", data.length == 0);
            editBtn.prop("disabled", data.length == 0);
        }, this)).fail(function(data) {
            
        });
    }, this));           
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
        /* Save layer visibility states */
        payload.layers = {};
        this.map.getLayers().forEach(function (layer) {
            if (layer.get("metadata")) {
                console.log(layer.get("metadata"));
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
