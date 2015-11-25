/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerUpdater = function(prefix, data) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Layer group data object */
    this.data = data;
    
    /* Active layer specification tab */
    this.activeTab = this.getActiveTab();
    
    /* Source-specific name prefix */
    this.ssPrefix = this.prefix + "-" + this.activeTab;
       
    /* Add update layer group button handler */    
    var btnUpdateLayer = $("#" + this.prefix + "-save");
    btnUpdateLayer.prop("disabled", true);     
    $("[id^='" + this.prefix + "']").filter(":input").on("change keyup", function() {
        /* Update button enabled when anything in the form changes */
        btnUpdateLayer.prop("disabled", false);
    });                                
    btnUpdateLayer.click($.proxy(function(evt) {
        /* Update dictionary entry */
        magic.modules.creator.Common.formToDict(this.prefix + "-form", this.data);
        /* Update the tree button caption as we have updated the name */
        $("#" + this.data.id).find("button").html(this.data.name);
        $("[id$='-update-panel']").fadeOut("slow");
    }, this));
     
    /* Add delete layer group button handler */            
    var btnDeleteLayer = $("#" + this.prefix + "-delete");
    btnDeleteLayer.prop("disabled", $("#" + this.data.id).find("ul").find("li").length > 0);
    btnDeleteLayer.click($.proxy(function(evt) {
        this.confirmDeleteEntry(this.data.id, "Really delete group : " + this.data.name + "?");                                                       
    }, this));
    
    /* Populate form snippet from data */
    if (this.activeTab == "wms") {
        /* Populate the list of known WMS sources and the feature name choices */
        var currentWms = this.getWmsSourceUrl();            
        this.populateWmsSourceSelector($("select[name='" + this.ssPrefix + "-source-wms_source']"), currentWms);
        if (!magic.runtime.creator.catalogues[currentWms]) {
            var parser = new ol.format.WMSCapabilities();
            $.ajax(currentWms + "?request=GetCapabilities").then($.proxy(function(response) {
                var data = $.parseJSON(JSON.stringify(parser.read(response)));
                if (data) {
                    magic.runtime.creator.catalogues[currentWms] = this.extractFeatureTypes(data);
                    this.populateWmsFeatureSelector(currentWms, $("select[name='" + this.ssPrefix + "-wms-source-feature_name']"), this.data.source.feature_name);
                    magic.modules.creator.Common.dictToForm(this.prefix + "-form", this.data); 
                } else {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to read capabilities for WMS ' + currentWms + '</div>');
                }
            }, this));
        } else {
            this.populateWmsFeatureSelector(currentWms, $("select[name='" + this.ssPrefix + "-wms-source-feature_name']"), this.data.source.feature_name);
            magic.modules.creator.Common.dictToForm(this.prefix + "-form", this.data); 
        }
    } else {
        magic.modules.creator.Common.dictToForm(this.prefix + "-form", this.data);            
    }
};

magic.classes.creator.LayerUpdater.prototype.getWmsSourceUrl = function() {
    if (this.data.source && this.data.source.wms_source) {
        return(this.data.source.wms_source);
    } else {
        return(magic.modules.creator.Data.DEFAULT_GEOSERVER_WMS.value);
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
        var selOpt = null;
        $.each(fopts, function(idx, fopt) {
            var opt = $("<option>", {value: fopt.value});
            opt.text(fopt.name);
            select.append(opt);
            if (fopt.value == defval) {
                selOpt = opt;
            }
        }); 
        if (selOpt != null) {
            selOpt.prop("selected", "selected");
        }
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
        var selOpt = null;
        $.each(eps, function(idx, ep) {
            var opt = $("<option>", {value: ep.value});
            opt.text(ep.name);            
            select.append(opt);
            if (ep.value == defval) {
                selOpt = opt;
            }
        });
        if (selOpt != null) {
            selOpt.prop("selected", "selected");
        }
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
