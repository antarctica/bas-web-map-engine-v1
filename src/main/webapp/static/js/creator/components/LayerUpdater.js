/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerUpdater = function(prefix) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Sub-tabs */
    this.style_definition = null;
    this.attribute_map = null;
    
    /* Common form inputs */
    this.form_fields = ["id", "name", "legend_graphic", "min_scale", "max_scale", "opacity", "is_visible", "is_interactive", "is_filterable"]
    
    /* Form inputs, per tab */
    this.source_form_fields = {
        "wms": ["wms_source", "feature_name", "style_name", "is_base", "is_singletile", "is_dem", "is_time_dependent"],
        "geojson": ["geojson_source", "feature_name", "style_definition"],
        "gpx": ["gpx_source", "style_definition"],
        "kml": ["kml_source", "style_definition"]                
    };    
    
    /* Layer group data object */
    this.data = null;    
       
    /* Add update layer group button handler */    
    var btnUpdateLayer = $("#" + this.prefix + "-save");
    btnUpdateLayer.prop("disabled", true);     
    $("[id^='" + this.prefix + "']").filter(":input").on("change keyup", function() {
        /* Update button enabled when anything in the form changes */
        btnUpdateLayer.prop("disabled", false);
    });                                
    btnUpdateLayer.click($.proxy(function(evt) {
        if (this.data) {
            /* Update dictionary entry */
            this.saveContext();
            /* Update the tree button caption as we have updated the name */
            $("#" + this.data.id).find("button").html(this.data.name);
            $("[id$='-update-panel']").fadeOut("slow");
        }
    }, this));
     
    /* Add delete layer group button handler */            
    var btnDeleteLayer = $("#" + this.prefix + "-delete");
    btnDeleteLayer.click($.proxy(function(evt) {
        if (this.data) {
            this.confirmDeleteEntry(this.data.id, "Really delete layer : " + this.data.name + "?");                                                       
        }
    }, this));
    /* Layer source tab change handler */
    $("a[href^='" + this.prefix + "'][data-toggle='tab']").on("shown.bs.tab", $.proxy(function(evt) {
        var sourceType = evt.target.innerHTML.toLowerCase();
        if ($.isFunction(this[sourceType + "LoadContext"])) {
            this[sourceType + "LoadContext"]();
        } 
    }, this));
};

/**
 * Populate form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.loadContext = function(context) {
    
    this.data = context;
   
    var activeTab = this.getActiveTab();
    
    /* Style definition sub-tab */
    this.style_definition = new magic.classes.creator.LayerStyler(this.prefix);
    
    /* Attribute map sub-tab */
    this.attribute_map = new magic.classes.creator.LayerAttributeMap($("#" + this.prefix + "-attributes-div"));
            
    /* Common non-source specific fields */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix);
    if ($.isFunction(this[activeTab + "LoadContext"])) {
        this[activeTab + "LoadContext"]();
    }
    this.attribute_map.loadContext(this.data.source, activeTab); 
    this.style_definition.loadContext(this.data.source, activeTab);
};

/**
 * Populate WMS form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.wmsLoadContext = function() {
    /* Add change handler for WMS selector */
    var sourceSelect = $("select[name='" + this.prefix + "-wms-wms_source']");                        
    sourceSelect.off("change").on("change", $.proxy(function(evt) {
        var selWms = $(evt.currentTarget).val();
        this.populateWmsDataSources(selWms);
    }, this));
    magic.modules.creator.Common.dictToForm(this.source_form_fields["wms"], this.data.source, this.prefix + "-wms"); 
    this.populateWmsSourceSelector(sourceSelect, this.data.source.wms_source);
    this.populateWmsDataSources(this.data.source.wms_source);   
};

/**
 * Populate GeoJSON form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.geojsonLoadContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["geojson"], this.data.source, this.prefix + "-geojson");
};

/**
 * Populate GPX form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.gpxLoadContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["gpx"], this.data.source, this.prefix + "-gpx");
};

/**
 * Populate KML form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.kmlLoadContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["kml"], this.data.source, this.prefix + "-kml");    
};

/**
 * Populate data object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.saveContext = function() {    
    /* Common non-source specific fields */
    magic.modules.creator.Common.formToDict(this.form_fields, this.data, this.prefix);
    var activeTab = this.getActiveTab();
    if ($.isFunction(this[activeTab + "SaveContext"])) {
        this[activeTab + "SaveContext"]();
    }            
};

/**
 * Populate WMS data source object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.wmsSaveContext = function() {
    magic.modules.creator.Common.formToDict(this.source_form_fields["wms"], this.data.source, this.prefix + "-wms");
    this.attribute_map.saveContext(this.data, "wms");
    console.log(this.data);
};

/**
 * Populate GeoJSON data source object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.geojsonSaveContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["geojson"], this.data.source, this.prefix + "-geojson"); 
    this.attribute_map.saveContext(this.data, "wms");
};

/**
 * Populate GPX data source object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.gpxSaveContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["gpx"], this.data.source, this.prefix + "-gpx");    
    this.style_definition.saveContext(this.data.source);
};

/**
 * Populate KML data source object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.kmlSaveContext = function() {    
    magic.modules.creator.Common.dictToForm(this.source_form_fields["kml"], this.data.source, this.prefix + "-kml");    
};

/**
 * Populate the feature type selector from given WMS
 * @param {string} wmsUrl
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsDataSources = function(wmsUrl) {
    var featSelect = $("select[name='" + this.prefix + "-wms-feature_name']");
    if (!magic.runtime.creator.catalogues[wmsUrl]) {
        var parser = new ol.format.WMSCapabilities();
        var jqXhr = $.get(wmsUrl + "?request=GetCapabilities", $.proxy(function(response) {
            var capsJson = $.parseJSON(JSON.stringify(parser.read(response)));
            if (capsJson) {
                magic.runtime.creator.catalogues[wmsUrl] = this.extractFeatureTypes(capsJson);
                this.populateWmsFeatureSelector(wmsUrl, featSelect, this.data.source.feature_name);
            } else {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to parse capabilities for WMS ' + wmsUrl + '</div>');
            }
        }, this)).fail(function() {
            bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to read capabilities for WMS ' + wmsUrl + '</div>');
            featSelect.find("option").remove();
        });                    
    } else {
        this.populateWmsFeatureSelector(wmsUrl, featSelect, this.data.source.feature_name);
    }            
};

magic.classes.creator.LayerUpdater.prototype.populateAttributeDiv = function(show, div, sourceType) {
    if (show) {
        div.show();
        this.attribute_map.loadContext(this.data, sourceType, div);
    } else {
        div.hide();
    }
};

magic.classes.creator.LayerUpdater.prototype.getActiveTab = function() {
    var activeTab = "wms";
    var div = $("div[id^='" + this.prefix + "'][role='tabpanel'].active");
    if (div.length > 0) {
        activeTab = div.attr("id").replace(this.prefix + "-", "").replace("-tab", "");
    }
    return(activeTab);
};

/**
 * Extract feature types from GetCapabilities response
 * @param {object} getCaps
 * @returns {Array}
 */
magic.classes.creator.LayerUpdater.prototype.extractFeatureTypes = function(getCaps) {
    var ftypes = [];
    if ("Capability" in getCaps && "Layer" in getCaps.Capability && "Layer" in getCaps.Capability.Layer && $.isArray(getCaps.Capability.Layer.Layer)) {
        var layers = getCaps.Capability.Layer.Layer;
        $.each(layers, function(idx, layer) {
            ftypes.push({
                name: layer.Title,
                value: layer.Name
            });
        });
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Malformed GetCapabilities response received from remote WMS</div>');
    }
    return(ftypes);
};

/**
 * Populate the WMS feature type selection drop-down
 * @param {string} wmsUrl
 * @param {Element} select
 * @param {string} defval
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsFeatureSelector = function(wmsUrl, select, defval) {
    select.find("option").remove();   
    var fopts = magic.runtime.creator.catalogues[wmsUrl];
    if (fopts) {
        magic.modules.creator.Common.populateSelect(select, fopts, "value", "name", defval);
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No feature types found for ' + wmsUrl + '</div>');
    }
};

/**
 * Populate the WMS sources selection drop-down
 * @param {Element} select
 * @param {string} defval
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsSourceSelector = function(select, defval) {
    select.find("option").remove();
    var proj = magic.modules.creator.Common.map_context.getProjection();
    if (proj) {
        var eps = magic.modules.creator.Data.WMS_ENDPOINTS[proj].slice(0);
        eps.unshift(magic.modules.creator.Data.DEFAULT_GEOSERVER_WMS);
        magic.modules.creator.Common.populateSelect(select, eps, "value", "name", defval);
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No projection defined for map</div>');
    }   
};

/**
 * Delete with confirm on a layer tree entry
 * @param {string} id
 * @param {string} msg
 */
magic.classes.creator.LayerUpdater.prototype.confirmDeleteEntry = function(id, msg) {            
    bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">' + msg + '</div>', function(result) {
        if (result) {
            /* Do the deletion */
            $("#" + id).remove();
            magic.modules.creator.Common.layer_dictionary.del(id);
            $("[id$='-update-panel']").fadeOut("slow");
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }                            
    });                                                
};
