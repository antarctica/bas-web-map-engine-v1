/* Map Creator map layer selector class */

magic.classes.creator.MapLayerSelector = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "layer-selector";
   
    /* Internal properties */
    this.layerDataEditor = null;
    
    this.DEFAULT_LAYERS = {
        "antarctic": [
            {
                "id": null,
                "name": "Hillshade and bathymetry",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                "feature_name": "add:antarctic_hillshade_and_bathymetry"
            },
            {
                "id": null,
                "name": "Coastline",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                "feature_name": "add:antarctic_coastline"
            },
            {
                "id": null,
                "name": "Sub-Antarctic coastline",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                "feature_name": "add:sub_antarctic_coastline"
            },
            {
                "id": null,
                "name": "Graticule",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                "feature_name": "add:antarctic_graticule",
                "is_singletile": true
            }
        ],
        "antarctic_laea": [
            {
                "id": null,
                "name": "Hillshade and bathymetry",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                "feature_name": "gis:hillshade_and_bathymetry"
            },
            {
                "id": null,
                "name": "Coastline",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                "feature_name": "gis:coastline"
            },            
            {
                "id": null,
                "name": "Graticule",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                "feature_name": "gis:graticule",
                "is_singletile": true
            }
        ],
        "arctic": [
            {
                "id": null,
                "name": "Hillshade and bathymetry",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                "feature_name": "arctic:arctic_hillshade_and_bathymetry"
            },
            {
                "id": null,
                "name": "Coastline",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                "feature_name": "arctic:arctic_coastline"
            },
            {
                "id": null,
                "name": "Graticule",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                "feature_name": "arctic:arctic_graticule",
                "is_singletile": true
            }
        ],
        "southgeorgia": [
            {
                "id": null,
                "name": "Hillshade and bathymetry",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                "feature_name": "sggis:sg_hillshade_and_bathymetry"
            },
            {
                "id": null,
                "name": "Coastline",
                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                "feature_name": "sggis:sg_coastline"
            }
        ],
        "midlatitudes": magic.modules.Endpoints.getMidLatitudeCoastSource()
    };
};

/**
 * Populate the layer table according to the given data
 * @param {Object} data
 * @param {String} region
 */
magic.classes.creator.MapLayerSelector.prototype.loadContext = function(data, region) {
    jQuery("#map-layer-selector").closest("div.row").removeClass("hidden");
    this.mapRegion = region;
    var table = jQuery("#" + this.prefix + "-list");
    if (!data || !jQuery.isArray(data.layers) || data.layers.length == 0) {
        data = {
            layers: this.DEFAULT_LAYERS[region]
        };
    }
    var layers = data.layers;        
    var rows = table.find("tbody tr");
    if (rows.length > 0) {
        rows.remove();
    }
    if (layers.length > 0) {                    
        table.removeClass("hidden");                    
        for (var i = 0; i < layers.length; i++) {
            this.layerMarkup(table, layers[i]);
        }
        /* Enable sortable layers table */
        jQuery(".table-sortable tbody").sortable();
    } else {
        table.addClass("hidden");
    }
    
    /* Assign add layer button handler */
    jQuery("#" + this.prefix + "-layer-add").click(jQuery.proxy(function(evt) {     
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            mapRegion: this.mapRegion,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate({});
    }, this));
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
    table.find("tbody").append( 
        '<tr>' + 
            '<input type="hidden" id="'+ this.prefix + '-' + layerData.id + '-layer-data" value="' + magic.modules.Common.JsonEscape(JSON.stringify(layerData)) + '"></input>' + 
            '<td>' + 
                '<a href="Javascript:void(0)" data-toggle="tooltip" data-placement="top" title="Click and drag to re-order layer stack">' + 
                    '<span class="glyphicon glyphicon-move"></span>' + 
                '</a>' + 
            '</td>' + 
            '<td>' + serviceName + '</td>' + 
            '<td>' + layerData.name + '</td>' +                     
            '<td>' + 
                '<div class="btn-group" role="group">' + 
                    '<button type="button" class="btn btn-sm btn-warning" id="' + this.prefix + '-' + layerData.id + '-layer-edit" ' + 
                        'data-toggle="popover" data-trigger="manual" data-placement="bottom">' + 
                        '<i style="font-size:14px" data-toggle="tooltip" data-placement="top" title="Edit/view selected layer data" class="fa fa-pencil"></i>' + 
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" id="' + this.prefix + '-' + layerData.id + '-layer-del">' +
                        '<i data-toggle="tooltip" data-placement="top" title="Delete selected layer" class="fa fa-trash"></i>' + 
                    '</button>' + 
                '</div>' + 
            '</td>' + 
        '</tr>'
    );
    
    /* Assign edit layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-edit").click(jQuery.proxy(function(evt) {
        var storedData = jQuery("#" + evt.currentTarget.id.replace(/-edit$/, "-data")).val();
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        this.layerDataEditor = new magic.classes.creator.EmbeddedLayerEditorPopup({
            target: evt.currentTarget.id,
            mapRegion: this.mapRegion,
            onSave: jQuery.proxy(this.updateLayerData, this)
        });
        this.layerDataEditor.activate(JSON.parse(storedData));
    }, this));
    
    /* Assign delete layer button handler */
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-del").click(function(evt) {
        if (this.layerDataEditor && this.layerDataEditor.isActive()) {
            /* If the edit dialog is already open somewhere else, close it */
            this.layerDataEditor.deactivate();
        }
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Ok to remove this layer?</div>', function(result) {
            if (result) {
                /* Do the deletion */
                jQuery(evt.currentTarget).closest("tr").remove();
            }
            bootbox.hideAll();
        });                       
    });
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
    jQuery("#" + this.prefix + "-" + layerData.id + "-layer-data").val(magic.modules.Common.JsonEscape(JSON.stringify(layerData)));
};