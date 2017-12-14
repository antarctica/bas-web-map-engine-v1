/* Map Creator map layer selector class */

magic.classes.creator.MapLayerSelector = function(endpoints) {
    
    /* Unpack API properties from options */
    
    /* Data service endpoints */
    this.endpoints = options.endpoints;
    
    /* ID prefix */
    this.prefix = options.prefix || "layer-selector";
   
};

/**
 * Populate the layer table according to the given data
 * @param {Object} data
 * @param {String} region
 */
magic.classes.creator.MapLayerSelector.prototype.loadContext = function(data, region) {
    if (jQuery.isArray(data.layers)) {
        var layers = data.layers;
        var table = jQuery("#" + this.prefix + "-list");
        var rows = table.find("tbody tr");
        if (rows.length > 0) {
            rows.remove();
        }
        if (layers.length > 0) {                    
            table.removeClass("hidden");                    
            for (var i = 0; i < layers.length; i++) {
                this.appendLayer(table, layers[i]);
            }
            /* Enable sortable layers table */
            jQuery(".table-sortable tbody").sortable();
        } else {
            table.addClass("hidden");
        }
    }
};

/**
 * Append data for a map layer to the given table
 * @param {jQuery.object} table
 * @param {object} data
 */
magic.classes.creator.MapLayerSelector.prototype.appendLayer = function(table, data) {
    var service = this.endpoints.getEndpointBy("url", data.wms_source);
    var serviceName = service ? service.name : data.wms_source;    
    data.id = data.id || magic.modules.Common.uuid(); 
    var tbody = table.find("tbody");
    tbody.append( 
        '<tr id="' + this.prefix + '-row-' + data.id + '">' + 
            '<td>' + 
                '<a href="Javascript:void(0)" data-toggle="tooltip" data-placement="top" title="Click and drag to re-order layer stack">' + 
                    '<span class="glyphicon glyphicon-move"></span>' + 
                '</a>' + 
            '</td>' + 
            '<td>' + serviceName + '</td>' + 
            '<td>' + data.name + '</td>' +                     
            '<td>' + 
                '<div class="btn-group" role="group">' +
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.prefix + '-' + layerId + '-layer-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit/view selected layer data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.id + '-' + layerId + '-layer-del">' +
                        '<i data-toggle="tooltip" data-placement="top" title="Delete selected layer" class="fa fa-trash"></i>' + 
                    '</button>' + 
                '</div>' + 
            '</td>' + 
        '</tr>';
    );
    var buttons = jQuery("#" + this.prefix + "-row-" + data.id).find("button");
    if (buttons.length == 3) {
        //TODO
        /* Assign edit layer button handler */
        jQuery(buttons[1]).click(jQuery.proxy(function(evt) {     
            //TODO - need popup form for editing
        }, this));
        /* Assign delete layer button handler */
        jQuery(buttons[2]).click(function(evt) {
            bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Ok to remove this layer?</div>', function(result) {
                if (result) {
                    /* Do the deletion */
                    jQuery(evt.currentTarget).closest("tr").remove();
                    bootbox.hideAll();
                } else {
                    bootbox.hideAll();
                }                            
            });                       
        });
    }
};