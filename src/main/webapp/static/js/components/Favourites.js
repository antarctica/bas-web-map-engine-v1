/* Favourite maps form */

magic.classes.Favourites = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "favourites";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
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
                    '<label  for="' + this.id + '-list">Load</label>' + 
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
                    '<button id="' + this.id + '-add" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Add current map to favourites">' + 
                        '<span class="fa fa-star"></span>' + 
                    '</button>' +          
                    '<button id="' + this.id + '-edit" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Update title of selected map">' + 
                        '<span class="fa fa-pencil"></span>' + 
                    '</button>' + 
                '</div>' +                 
                '<input type="hidden" id="' + this.id + '-id"></input>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label  for="' + this.id + '-title">Load</label>' + 
                    '<div class="input-group">' + 
                        '<input type="text" name="' + this.id + '-title" id="' + this.id + '-title" class="form-control" ' + 
                            'placeholder="New title" maxlength="100" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Title for favourite map (required)" ' + 
                            'required="required">' +
                        '</input>' +
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-list-go" class="btn btn-primary btn-sm" type="button" title="Load map">' + 
                                '<span class="fa fa-save"></span>' + 
                            '</button>' +
                        '</span>' +
                    '</div>' + 
                '</div>' +                 
            '</form>' +               
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Favourites</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {
        /* TODO Fetch data on bookmarked maps */
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }).done(function(data) {
            
        }).fail(function(data) {
            
        });
        
        /* Set button handlers */
        
        
        
//        jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
//            jQuery(evt.currentTarget).tooltip("hide");  /* Get rid of annoying persistent tooltip - not sure why... */
//            var formdata = {
//                data: this.mapPayload()
//            };
//            var ok = true;
//            jQuery("#" + this.id + "-payload").val(formdata.payload);
//            jQuery("#" + this.id + "-feedback-form")[0].checkValidity();
//            jQuery.each(["trackerId", "subject", "description", "reporter"], jQuery.proxy(function(idx, elt) {
//                var fip = jQuery("#" + this.id + "-" + elt);
//                var fg = fip.closest("div.form-group");
//                var fstate = fip.prop("validity");
//                if (fstate.valid) {
//                    if (elt == "description") {
//                        formdata[elt] = JSON.stringify(jQuery.extend({}, this.mapPayload(), {"description": fip.val()}));
//                    } else {
//                        formdata[elt] = fip.val();
//                    }
//                    fg.removeClass("has-error").addClass("has-success");
//                } else {
//                    ok = false;
//                    fg.removeClass("has-success").addClass("has-error");
//                }
//            }, this));
//            if (ok) {                
//                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content"); 
//                this.target.popover("hide");
//                var jqXhr = jQuery.ajax({
//                        url: magic.config.paths.baseurl + "/feedback",
//                        method: "POST",
//                        processData: false,
//                        data: JSON.stringify(formdata),
//                        headers: {
//                            "Content-Type": "application/json",
//                            "X-CSRF-TOKEN": csrfHeaderVal
//                        }
//                    });
//                    jqXhr.done(jQuery.proxy(function(response) {                        
//                        bootbox.alert(
//                            '<div class="alert alert-info" style="margin-bottom:0">' + 
//                                '<p>Successfully sent your feedback</p>' + 
//                            '</div>'
//                        );
//                    }, this));
//                    jqXhr.fail(function(xhr, status, err) {
//                        var detail = JSON.parse(xhr.responseText)["detail"];
//                        bootbox.alert(
//                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
//                                '<p>Error occurred - details below:</p>' + 
//                                '<p>' + detail + '</p>' + 
//                            '</div>'
//                        );
//                    });                
//            }
//        }, this));
        /* Close button */
        jQuery(".feedback-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
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
        magic.runtime.map.getLayers().forEach(function (layer) {
            if (layer.get("metadata")) {
                var layerId = layer.get("metadata").id;
                payload.layers[layerId]["visibility"] = layer.getVisible();
                payload.layers[layerId]["opacity"] = layer.getOpacity();
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
