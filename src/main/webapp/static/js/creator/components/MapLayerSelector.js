/* Map Creator map layer selector class */

magic.classes.creator.MapLayerSelector = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "layer-selector";
   
    /* Internal properties */
    this.layerDataEditor = null;        
    
    /* Repository (keyed by layer id) of saved edits to data layers */
    this.layerEdits = {};
};

/**
 * Default layer specifications for given region
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 * @return {Object}
 */
magic.classes.creator.MapLayerSelector.prototype.defaultData = function(region) {
    return({
        layers: {
            "type": "json",
            "value": JSON.stringify(magic.modules.GeoUtils.DEFAULT_LAYERS[region])
        }
    });
};

/**
 * Populate the layer table according to the given data
 * @param {Object} data
 */
magic.classes.creator.MapLayerSelector.prototype.loadContext = function(data) {
    jQuery("#map-layer-selector").closest("div.row").removeClass("hidden");
    var layers = null;
    var table = jQuery("#" + this.prefix + "-list");
    if (data.layers && data.layers.type == "json" && data.layers.value) {
        layers = JSON.parse(data.layers.value);
    }
    var rows = table.find("tbody tr");
    if (rows.length > 0) {
        rows.remove();
    }
    if (layers && layers.length > 0) {                    
        table.removeClass("hidden");                    
        for (var i = 0; i < layers.length; i++) {            
            this.layerMarkup(table, layers[i]);
        }
        /* Enable sortable layers table */
        jQuery(".table-sortable tbody").sortable({
            handle: "td.service-name",
            placeholderClass: "fa fa-caret-right"
        });
    } else {
        table.addClass("hidden");
    }
    
    /* Assign add layer button handler */
    jQuery("#" + this.prefix + "-layer-add").off("click").on("click", jQuery.proxy(function(evt) {     
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate({});
    }, this));
};

magic.classes.creator.MapLayerSelector.prototype.getContext = function() {
    var layers = jQuery("#" + this.prefix + "-list").find("tr").map(jQuery.proxy(function(idx, tr) {
        return(this.layerEdits[jQuery(tr).data("id")]);
    }, this));
    return({
       layers: layers.get() 
    });
};

magic.classes.creator.MapLayerSelector.prototype.validate = function() {
    return(true);
};

/**
 * Append data for a map layer to the given table
 * @param {jQuery.object} table
 * @param {object} layerData
 */
magic.classes.creator.MapLayerSelector.prototype.layerMarkup = function(table, layerData) {
    var service = magic.modules.Endpoints.getEndpointBy("url", layerData.wms_source);
    var serviceName = service ? service.name : layerData.wms_source;    
    layerData.id = layerData.id || magic.modules.Common.uuid(); 
    this.layerEdits[layerData.id] = layerData;
    table.find("tbody").append( 
        '<tr data-id="' + layerData.id + '">' +             
            '<td class="service-name">' + 
                '<a style="margin-right:5px" href="Javascript:void(0)" data-toggle="tooltip" data-placement="top" title="Click and drag to re-order layer stack">' + 
                    '<span class="fa fa-arrows"></span>' + 
                '</a>' + 
                serviceName + 
            '</td>' + 
            '<td>' + layerData.name + '</td>' +                     
            '<td>' + 
                '<div class="btn-toolbar" role="toolbar">' + 
                    '<div class="btn-group" role="group">' + 
                        '<button type="button" class="btn btn-sm btn-warning" id="' + this.prefix + '-' + layerData.id + '-layer-edit" ' + 
                            'data-toggle="popover" data-trigger="manual" data-placement="left">' + 
                            '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit/view selected layer data" class="fa fa-pencil"></i>' + 
                        '</button>' +
                        '<button type="button" class="btn btn-sm btn-danger" id="' + this.prefix + '-' + layerData.id + '-layer-del">' +
                            '<i data-toggle="tooltip" data-placement="top" title="Delete selected layer" class="fa fa-trash"></i>' + 
                        '</button>' + 
                    '</div>' + 
                '</div>' + 
            '</td>' + 
        '</tr>'
    );
    
    /* Assign edit layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-edit").off("click").on("click", jQuery.proxy(function(evt) {
        var layerId = evt.currentTarget.id.replace(this.prefix + "-", "").replace("-layer-edit", "");
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate(this.layerEdits[layerId]);
    }, this));
    
    /* Assign delete layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-del").off("click").on("click", jQuery.proxy(function(evt) {
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Ok to remove this layer?</div>', jQuery.proxy(function(result) {
            if (result) {
                /* Do the deletion */
                delete this.layerEdits[layerData.id];
                jQuery(evt.currentTarget).closest("tr").remove();
            }
            bootbox.hideAll();
        }, this));                       
    }, this));
};

/**
 * Update the stored and displayed layer data after an edit
 * @param {Object} layerData
 */
magic.classes.creator.MapLayerSelector.prototype.updateLayerData = function(layerData) {
    if (!layerData.id) {
        /* New data added */
        layerData.id = magic.modules.Common.uuid();
        var table = jQuery("#" + this.prefix + "-list");
        this.layerMarkup(table, layerData);
    }
    this.layerEdits[layerData.id] = layerData;
    /* Enable sortable layers table - now includes the new layer */
    jQuery(".table-sortable tbody").sortable({
        handle: "td.service-name",
        placeholderClass: "fa fa-caret-right"
    });
};