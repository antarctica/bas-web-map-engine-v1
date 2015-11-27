/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerUpdater = function(prefix) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Sub-tabs */
    this.style_definition = null;   //TODO
    this.attribute_map = null;
    
    /* Common form inputs */
    this.form_fields = ["id", "name", "legend_graphic", "min_scale", "max_scale", "opacity", "is_visible", "is_interactive", "is_filterable"]
    
    /* Form inputs, per tab */
    this.source_form_fields = {
        "wms": ["wms_source", "feature_name", "style_name", "is_base", "is_singletile", "is_dem", "is_time_dependent"],
        "geojson": ["geojson_source", "feature_name"],
        "gpx": ["gpx_source"],
        "kml": ["kml_source"]                
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
};

magic.classes.creator.LayerUpdater.prototype.loadContext = function(context) {
    
    this.data = context;
   
    var activeTab = this.getActiveTab();
    var sourcePrefix = this.prefix + "-" + activeTab;
    
    /* Attribute map sub-tab */
    var attributeDiv = $("#" + this.prefix + "-attributes-div");
    this.attribute_map = new magic.classes.creator.LayerAttributeMap(attributeDiv);
    this.populateAttributeDiv(this.data.is_filterable === true || this.data.is_interactive === true, attributeDiv, activeTab);
    
    /* Add change handlers for filter/popup checkboxes */
    $("#" + this.prefix + "-int-props-div").find("input[type='checkbox']").change($.proxy(function(evt) {        
        var id = $(evt.currentTarget).attr("id");
        var partnerId = id.indexOf("interactive") != -1 ? id.replace("interactive", "filterable") : id.replace("filterable", "interactive");
        var show = ($(evt.currentTarget).prop("checked") === true) || ($("#" + partnerId).prop("checked") === true);
        this.populateAttributeDiv(show, attributeDiv, activeTab);            
    }, this));
            
    /* Common non-source specific fields */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix); 
                            
    switch(activeTab) {
        case "geojson":
            //TODO
            break;
        case "gpx":
            //TODO
            break;
        case "kml":
            //TODO
            break;
        default: 
            /* Add change handler for WMS selector */
            var sourceSelect = $("select[name='" + sourcePrefix + "-wms_source']");                        
            sourceSelect.off("change").on("change", $.proxy(function(evt) {
                var selWms = $(evt.currentTarget).val();
                this.populateWmsDataSources(selWms);
            }, this));
            magic.modules.creator.Common.dictToForm(this.source_form_fields[activeTab], this.data.source, sourcePrefix); 
            this.populateWmsSourceSelector(sourceSelect, this.data.source.wms_source);
            this.populateWmsDataSources(this.data.source.wms_source);             
            break;
    }                       
};

magic.classes.creator.LayerUpdater.prototype.saveContext = function() {
    
    /* Common non-source specific fields */
    magic.modules.creator.Common.formToDict(this.form_fields, this.data, this.prefix);
    
    /* Source-specific fields */
    var activeTab = this.getActiveTab();
    var sourcePrefix = this.prefix + "-" + activeTab;
    switch(activeTab) {
        case "geojson":
            //TODO
            break;
        case "gpx":
            //TODO
            break;
        case "kml":
            //TODO
            break;
        default: 
            /* Update the data source fields from form */           
            magic.modules.creator.Common.formToDict(this.source_form_fields[activeTab], this.data.source, sourcePrefix);
            this.attribute_map.saveContext(this.data, "wms");
            console.log(this.data);
            break;
    }                       
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

magic.classes.creator.LayerUpdater.prototype.getActiveTab = function() {
    var activeTab = "wms";
    var div = $("div[id^='" + this.prefix + "'][role='tabpanel'].active");
    if (div.length > 0) {
        activeTab = div.attr("id").replace(this.prefix + "-", "").replace("-tab", "");
    }
    return(activeTab);
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
