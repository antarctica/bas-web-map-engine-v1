/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerUpdater = function(prefix) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Sub-tabs */
    this.style_definition = null;
    this.attribute_map = null;
    
    /* Common form inputs */
    this.form_fields = [
        {"field": "id", "default": ""}, 
        {"field": "name", "default": ""}, 
        {"field": "legend_graphic", "default": ""},
        {"field": "geom_type", "default": "unknown"},
        {"field": "min_scale", "default": 1000}, 
        {"field": "max_scale", "default": 100000000}, 
        {"field": "opacity", "default": 1.0}, 
        {"field": "is_visible", "default": false}, 
        {"field": "is_interactive", "default": false}, 
        {"field": "is_filterable", "default": false}
    ];
    
    /* Form inputs, per tab */
    this.source_form_fields = {
        "wms": [
            {"field": "wms_source", "default": ""}, 
            {"field": "feature_name", "default": ""}, 
            {"field": "style_name", "default": ""}, 
            {"field": "is_base", "default": false}, 
            {"field": "is_singletile", "default": false}, 
            {"field": "is_dem", "default": false}, 
            {"field": "is_time_dependent", "default": false}
        ],
        "geojson": [
            {"field": "geojson_source", "default": ""},
            {"field": "feature_name", "default": ""}
        ],
        "gpx": [
            {"field": "gpx_source", "default": ""}
        ],
        "kml": [
            {"field": "kml_source", "default": ""}
        ]                
    };    
    
    /* Layer group data object */
    this.data = null;    
       
    /* Add update layer group button handler */    
    var btnUpdateLayer = $("#" + this.prefix + "-save");
    btnUpdateLayer.click($.proxy(function(evt) {
        if (this.data && this.validate()) {
            /* Update dictionary entry */
            this.saveContext();
            /* Update the tree button caption as we have updated the name */
            $("#" + this.data.id).find("button").html(this.data.name);
            magic.modules.creator.Common.resetFormIndicators();
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
    $("a[href^='#" + this.prefix + "'][data-toggle='tab']").on("shown.bs.tab", $.proxy(function(evt) {
        var sourceType = evt.target.innerHTML.toLowerCase();
        if ($.isFunction(this[sourceType + "LoadContext"])) {
            this[sourceType + "LoadContext"]();
        }
        var symbologyPanel = $("#" + this.prefix + "-symbology-panel");
        if (sourceType == "wms") {
            symbologyPanel.hide();
        } else {
            symbologyPanel.show();
        }
    }, this));
};

/**
 * Populate form with saved or new data
 * @param {object} context
 */
magic.classes.creator.LayerUpdater.prototype.loadContext = function(context) {
    
    this.data = context;
   
    var activeTab = this.setActiveSourceTab(context.source);
    
    /* Style definition sub-tab */
    this.style_definition = new magic.classes.creator.LayerStyler(this.prefix);
    
    /* Attribute map sub-tab */
    this.attribute_map = new magic.classes.creator.LayerAttributeMap($("#" + this.prefix + "-attributes-div"));
            
    /* Common non-source specific fields */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix);
    if (activeTab == "wms") {
        this.wmsLoadContext();
    } else {
        magic.modules.creator.Common.dictToForm(this.source_form_fields[activeTab], this.data.source, this.prefix + "-" + activeTab);
    }   
    this.attribute_map.loadContext(this.data, activeTab); 
    this.style_definition.loadContext(this.data.source.style_definition);    
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
        this.resetStyleSelector($("select[name='" + this.prefix + "-wms-style_name']"));
    }, this));
    magic.modules.creator.Common.dictToForm(this.source_form_fields["wms"], this.data.source, this.prefix + "-wms"); 
    this.populateWmsSourceSelector(sourceSelect, this.data.source.wms_source);
    this.populateWmsDataSources(this.data.source.wms_source);   
};

/**
 * Populate data object with changed form inputs
 */
magic.classes.creator.LayerUpdater.prototype.saveContext = function() {    
    /* Common non-source specific fields */    
    magic.modules.creator.Common.formToDict(this.form_fields, this.data, this.prefix);
    var activeTab = this.getActiveSourceTab();
    /* Delete currently specified source data pending replacement with new */
    this.data.source = {};
    magic.modules.creator.Common.formToDict(this.source_form_fields[activeTab], this.data.source, this.prefix + "-" + activeTab);
    this.attribute_map.saveContext(this.data, activeTab);
    if (activeTab != "wms") {
        if (!("style_definition" in this.data.source)) {
            this.data.source.style_definition = {};
        }
        this.style_definition.saveContext(this.data.source.style_definition);
    }    
};

/**
 * Validate form inputs
 */
magic.classes.creator.LayerUpdater.prototype.validate = function() {    
    var ok = true;
    $("#t2-layer-form")[0].checkValidity();
    var checks = ["name", "min_scale", "max_scale", "opacity"];
    $.each(checks, function(idx, chk) {
        var input = $("#t2-layer-" + chk);
        var vState = input.prop("validity");
        var fg = input.closest("div.form-group");
        if (vState.valid) {
            fg.removeClass("has-error").addClass("has-success");
        } else {
            ok = false;
            fg.removeClass("has-success").addClass("has-error");
        }
    });    
    if (ok) {
        /* Check max/min scale inputs */
        var minInput = $("#t2-layer-min_scale");
        var maxInput = $("#t2-layer-max_scale");       
        if (minInput.val() >= maxInput.val()) {
            maxInput.closest("div.form-group").removeClass("has-success").addClass("has-error");
            ok = false;
        } else {
            maxInput.closest("div.form-group").removeClass("has-error").addClass("has-success");
        }
    }
    return(ok);
};

/**
 * Find out which source data tab is currently active
 * @returns {string}
 */
magic.classes.creator.LayerUpdater.prototype.getActiveSourceTab = function() {
    var tab = $("div.active[id^='t2-layer'][role='tabpanel']");
    var tabName = tab.attr("id").replace(this.prefix + "-", "").replace("-tab", "");
    return(tabName);
};

/**
 * Set the currently active source tab
 * @param {object} source
 * @returns {string}
 */
magic.classes.creator.LayerUpdater.prototype.setActiveSourceTab = function(source) {    
    var activeTab = null;
    var symbologyPanel = $("#" + this.prefix + "-symbology-panel");  
    $.each($("a[role='tab'][href^='#" + this.prefix + "']"), $.proxy(function(i, a) {
        var tabName = $(a).attr("href").replace("#" + this.prefix + "-", "").replace("-tab", "");
        if (source[tabName + "_source"] && source[tabName + "_source"].indexOf("http") == 0) {
            $(a).tab("show");
            activeTab = tabName;
            if (tabName == "wms") {
                symbologyPanel.hide();
            } else {
                symbologyPanel.show();
            }
            return(false)
        }        
        return(true);
    }, this));
    if (activeTab == null) {
        $("a[href='#" + this.prefix + "-wms-tab']").tab("show");
        activeTab = "wms";
        symbologyPanel.hide();
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
                value: layer.Name,
                styles: layer.Style
            });
        });
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Malformed GetCapabilities response received from remote WMS</div>');
    }
    return(ftypes);
};

/**
 * Populate the feature type selector from given WMS
 * @param {string} wmsUrl
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsDataSources = function(wmsUrl) {
    var featSelect = $("select[name='" + this.prefix + "-wms-feature_name']");
    if (!magic.runtime.creator.catalogues[wmsUrl]) {
        var parser = new ol.format.WMSCapabilities();
        var url = wmsUrl + "?request=GetCapabilities";
        if (magic.modules.Endpoints.proxy[wmsUrl]) {
            url = magic.config.paths.baseurl + "/proxy?url=" + url;
        }
        var jqXhr = $.get(url, $.proxy(function(response) {
            try {
                var capsJson = $.parseJSON(JSON.stringify(parser.read(response)));
                if (capsJson) {
                    magic.runtime.creator.catalogues[wmsUrl] = this.extractFeatureTypes(capsJson);
                    this.populateWmsFeatureSelector(wmsUrl, featSelect, this.data.source.feature_name);
                } else {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to parse capabilities for WMS ' + wmsUrl + '</div>');
                }
            } catch(e) {
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

/**
 * Populate list with the available styles for this feature
 * @param {type} wmsUrl
 * @param {type} select
 * @param {type} featName
 * @param {type} styleName
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsStyleSelector = function(wmsUrl, select, featName, styleName) {
    if ($.isArray(magic.runtime.creator.catalogues[wmsUrl])) {
        $.each(magic.runtime.creator.catalogues[wmsUrl], $.proxy(function(idx, lyr) {
            var fnNoWs = featName.split(":").pop();
            var lvNoWs = lyr.value.split(":").pop();
            if (lvNoWs == fnNoWs) {
                select.find("option").remove();
                if ($.isArray(lyr.styles)) {
                    /* There's a choice here */
                    magic.modules.Common.populateSelect(select, lyr.styles, "Name", "Title", styleName || lyr.styles[0].Name);
                } else {
                    this.resetStyleSelector(select);                    
                }
                return(false);
            }
            return(true);
        }, this));        
    } else {
        this.resetStyleSelector(select);
    }
};

/**
 * Reset style selection list 
 * @param {type} select
 */
magic.classes.creator.LayerUpdater.prototype.resetStyleSelector = function(select) {
    select.find("option").remove();
     magic.modules.Common.populateSelect(select, [
        {
            name: "Default style",
            value: ""
        }
    ], "value", "name", "default");    
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
    if (fopts && fopts.length > 0) {
        magic.modules.Common.populateSelect(select, fopts, "value", "name", defval);
        select.off("change").on("change", $.proxy(function(evt) {
            var styleSelect = $("select[name='" + this.prefix + "-wms-style_name']");
            this.populateWmsStyleSelector(wmsUrl, styleSelect, $(evt.currentTarget).val(), this.data.source.style_name);
            this.attribute_map.ogcLoadContext(wmsUrl, $(evt.currentTarget).val(), this.data["attribute_map"], this.data["id"]);
        }, this));
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No feature types found for ' + wmsUrl + '</div>');
        /* Cobble together a dummy select including just the feature type, otherwise this gets overwritten with empty in the eventual data payload! */
        magic.modules.Common.populateSelect(select, [
            {
                name: defval,
                value: defval
            }
        ], "value", "name", defval);
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
        var eps = magic.modules.Endpoints.getWmsEndpoints(proj).slice(0);
        eps.unshift(magic.modules.Endpoints.default_wms);
        magic.modules.Common.populateSelect(select, eps, "wms", "name", defval);
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
