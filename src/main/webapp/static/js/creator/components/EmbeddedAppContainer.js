/* Embedded Map Creator main class */

magic.classes.creator.EmbeddedAppContainer = function() {
    
    /* Initialise the various form dialogs */
    this.dialogs = {        
        "metadataForm": new magic.classes.creator.MapMetadataForm({
            formSchema: [
                {"field": "id", "default": ""},
                {"field": "name","default": "new_map"},
                {"field": "title", "default": ""},
                {"field": "description", "default": ""},            
                {"field": "owner_email", "default": ""},                
                {"field": "allowed_usage", "default": "public"},
                {"field": "allowed_edit", "default": "login"}
            ]
        }),
        "mapLayerSelector": new magic.classes.creator.MapLayerSelector({}),
        "mapParameterSelector": new magic.classes.creator.MapParameterSelector({embedded: true})
    };
    
    /* Master region selector (may load a map context here if a search string exists) */
    this.regionSelector = new magic.classes.creator.MapRegionSelector({
        "contextLoader": jQuery.proxy(this.loadContext, this),
        "mapTitleService": magic.config.paths.baseurl + "/embedded_maps/dropdown",
        "mapDataService": magic.config.paths.baseurl + "/embedded_maps/name"
    });
    
    /* Tooltips */                    
    jQuery('[data-toggle="tooltip"]').tooltip({trigger: "hover"});
    /* For dynamic tooltips - http://stackoverflow.com/questions/9958825/how-do-i-bind-twitter-bootstrap-tooltips-to-dynamically-created-elements */
    jQuery("body").tooltip({selector: '[data-toggle="tooltip"]', trigger: "hover"});
                      
};

/**
 * Callback to load a map context 
 * @param {Object} mapContext
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes, required if mapContext not set
 */
magic.classes.creator.EmbeddedAppContainer.prototype.loadContext = function(mapContext, region) { 
    
    if (!mapContext) {
        /* Assumed this is a new map, so create default parameter data */
        if (region) {
            /* Assemble default map context */
            mapContext = {};
            jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
                mapContext = jQuery.extend(true, mapContext, dialog.defaultData(region));
            }, this));
        } else {
            bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No map context or region data supplied - aborting</div>');
            return;
        }
    }
    
    /* Record global projection */
    magic.runtime.projection = mapContext.projection;
    
    /* Load the context */
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        dialog.loadContext(mapContext);
    }, this));
    
    /* Save map handler */
    var saveBtn = jQuery("#map-save-context");
    saveBtn.closest("div.row").removeClass("hidden");
    saveBtn.off("click").on("click", jQuery.proxy(this.saveContext, this));
    
    /* Delete map handler */
    var delBtn = jQuery("#map-delete");   
    delBtn.off("click").on("click", jQuery.proxy(function() {
        this.deleteMap(mapContext.id);
    }, this));
};

/**
 * Assemble a final map context for saving to database
 */
magic.classes.creator.EmbeddedAppContainer.prototype.saveContext = function() {
    var valid = true;
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        valid = valid && dialog.validate();
    }, this));
    if (valid) {
        /* Forms were valid */
        var context = {};
        jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
            jQuery.extend(true, context, dialog.getContext(true));
        }, this));                
        this.modifyMapExtentByDataLayers(context, jQuery.proxy(function(postData) {
            /* Now validate the assembled map context against the JSON schema in /static/js/json/embedded_web_map_schema.json
             * https://github.com/geraintluff/tv4 is the validator used */            
            jQuery.getJSON(magic.config.paths.baseurl + "/static/js/json/embedded_web_map_schema.json", jQuery.proxy(function(schema) {        
                var validated = tv4.validate(postData, schema);               
                if (!validated) {
                    /* Failed to validate the data against the schema - complain */
                    var validationErrors = JSON.stringify(tv4.error, null, 4);
                    bootbox.alert(
                        '<div class="alert alert-danger" style="margin-top:10px">' + 
                            '<p>Failed to validate your map data against the web map schema</p>' + 
                            '<p>Detailed explanation of the failure below:</p>' + 
                            '<p>' + validationErrors + '</p>' + 
                        '</div>'
                    );
                } else {
                    /* Schema validation was ok */
                    var existingId = postData.id; 
                    console.log(postData);
                    var postDataStr = JSON.stringify(postData);
                    jQuery.ajax({
                        url: magic.config.paths.baseurl + "/embedded_maps/" + (existingId != "" ? "update/" + existingId : "save"),                        
                        method: "POST",
                        processData: false,
                        data: postDataStr,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader(
                                jQuery("meta[name='_csrf_header']").attr("content"), 
                                jQuery("meta[name='_csrf']").attr("content")
                            );
                        }
                    })
                    .done(function(response) {
                        /* Load up example finished map into test bed in a new tab */
                        magic.runtime.serviceUrl = magic.config.paths.baseurl + "/embedded_maps/name/" + postData.name;
                        window.open(magic.config.paths.baseurl + "/static/html/test_embed.html");                    
                    })
                    .fail(function(xhr) {
                        var msg;
                        try {
                            msg = JSON.parse(xhr.responseText)["detail"];
                        } catch(e) {
                            msg = xhr.responseText;
                        }
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                '<p>Failed to save your map - details below:</p>' + 
                                '<p>' + msg + '</p>' + 
                            '</div>'
                        );
                    });
                }
            }, this))
            .fail(function(xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to retrieve JSON schema for embedded map - details below:</p>' + 
                        '<p>' + msg + '</p>' + 
                    '</div>'
                );
            });  
        }, this));        
    } else {
        /* Validation errors */
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Please correct the marked fields before resubmitting</p>' + 
            '</div>'
        );
    }
};

/** 
 * Check if any data layers had the 'is_extent' attribute set, find their combined extent and modify the map extent accordingly
 * @param {Object} context
 * @param {Function} callback
 */
magic.classes.creator.EmbeddedAppContainer.prototype.modifyMapExtentByDataLayers = function(context, callback) {
    var extents = [];
    var extentRequests = [];
    jQuery.each(context.layers, jQuery.proxy(function(idx, elt) {
        if (elt.is_extent === true && elt.feature_name) {
            var restExtent = magic.config.paths.baseurl + "/gs/extent/" + elt.feature_name;
            var restEndpoint = magic.modules.Endpoints.getEndpointBy("url", elt.wms_source);
            if (restEndpoint != null) {
                restExtent = restExtent + "/" + restEndpoint.id;
            }
            extentRequests.push(jQuery.getJSON(restExtent, 
                jQuery.proxy(function(data) {                   
                    if (jQuery.isArray(data) && data.length == 4) {
                        extents.push(magic.modules.GeoUtils.extentFromWgs84Extent(data, context.projection));
                    }
                }, this))
            );
        }
    }, this));
    if (extentRequests.length > 0) {
        jQuery.when.apply(jQuery, extentRequests)
        .always(jQuery.proxy(function() {
            /* Postprocess to set map centre and zoom level in the event that these must be taken from data layers */
            jQuery.extend(true, context, {
                "data_extent": magic.modules.GeoUtils.uniteExtents(extents)
            });
            if (jQuery.isFunction(callback)) {
                callback(context);
            }
        }, this))
        .fail(function(xhr) {
            var msg;
            try {
                msg = JSON.parse(xhr.responseText)["detail"];
            } catch(e) {
                msg = xhr.responseText;
            }
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to calculate embedded map extent from data layers:</p>' + 
                    '<p>' + msg + '</p>' + 
                '</div>'
            );
        });
    } else {
        if (jQuery.isFunction(callback)) {
            callback(context);
        }
    }  
};

/**
 * Delete an embedded map
 * @param {String} id
 */
magic.classes.creator.EmbeddedAppContainer.prototype.deleteMap = function(id) {
    bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete this map?</div>', jQuery.proxy(function(result) {
        if (result) {
            /* Do the deletion */
            jQuery.ajax({
                url: magic.config.paths.baseurl + "/embedded_maps/delete/" + id,
                method: "DELETE",
                beforeSend: function (xhr) {                        
                    xhr.setRequestHeader(
                        jQuery("meta[name='_csrf_header']").attr("content"), 
                        jQuery("meta[name='_csrf']").attr("content")
                    );
                }
            })
            .done(function() {
                window.location = magic.config.paths.baseurl + "/embedded_creatord";
            })
            .fail(function (xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to delete user map view - details below:</p>' + 
                        '<p>' + msg + '</p>' + 
                    '</div>'
                );
            });                   
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }                            
    }, this));  
};