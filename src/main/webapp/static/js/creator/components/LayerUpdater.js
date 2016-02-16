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
    
    /* Layer data object */
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
        this.data.source = evt.target.innerHTML.toLowerCase();
        this.loadContext(this.data);
        var symbologyPanel = $("#" + this.prefix + "-symbology-panel");
        if (this.data.source == "wms") {
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
            
    /* Load data into common non-source specific fields */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix);
    /* Load data into source specific fields */
    magic.modules.creator.Common.dictToForm(this.source_form_fields[activeTab], this.data.source, this.prefix + "-" + activeTab);
    if (activeTab == "wms") {
        this.populateWmsSourceSelector();
    }
    this.attribute_map.loadContext(this.data, activeTab); 
    this.style_definition.loadContext(this.data.source.style_definition);    
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
        this.getFeatures(ftypes, layers);        
    } else {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Malformed GetCapabilities response received from remote WMS</div>');
    }
    return(ftypes);
};

/**
 * Recursive trawl through the GetCapabilities document for named layers
 * @param {Array} ftypes
 * @param {Array} layers
 */
magic.classes.creator.LayerUpdater.prototype.getFeatures = function(ftypes, layers) {
    $.each(layers, $.proxy(function(idx, layer) {
        if ("Name" in layer) {
            /* Leaf node - a named layer */
            ftypes.push({
                name: layer.Title,
                value: layer.Name,
                styles: layer.Style
            });
        } else if ("Layer" in layer && $.isArray(layer["Layer"])) {
            /* More trawling to do */
            this.getFeatures(ftypes, layer["Layer"]);
        }        
    }, this));
};

/**
 * Populate the WMS sources selection drop-down
 * @param {Element} select
 * @param {string} defval
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsSourceSelector = function(defval) {    
    var proj = magic.modules.creator.Common.map_context.getProjection();
    if (proj) {
        /* Get the WMS endpoints available for this projection on this server platform */
        var eps = magic.modules.Endpoints.getWmsEndpoints(proj).slice(0);
        eps.unshift(magic.modules.Endpoints.default_wms);
        var currentSource = this.data.source.wms_source;
        var sourceSelect = $("select[name='" + this.prefix + "-wms-wms_source']");        
        magic.modules.Common.populateSelect(sourceSelect, eps, "wms", "name", currentSource, true);
        this.populateWmsFeatureSelector(currentSource);       
        sourceSelect.off("change").on("change", $.proxy(function(evt) {
            /* WMS source selector has changed, update the features available */
            this.populateWmsFeatureSelector($(evt.currentTarget).val());
        }, this));
    } else {
        /* No projection defined - abort */
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No projection defined for map</div>');
    }      
};

/**
 * Populate the WMS feature type selection drop-down
 * @param {string} wmsUrl
 * @param {Element} select
 * @param {string} defval
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsFeatureSelector = function(wmsUrl) {
    var featureSelect = $("select[name='" + this.prefix + "-wms-feature_name']");
    var styleSelect = $("select[name='" + this.prefix + "-wms-style_name']");
    featureSelect.off("change").on("change", $.proxy(function(evt) {
        this.populateWmsStyleSelector(wmsUrl, null);
        this.attribute_map.ogcLoadContext(wmsUrl, $(evt.currentTarget).val(), this.data["attribute_map"], this.data["id"]);
    }, this));
    if (wmsUrl) {
        /* Examine GetCapabilities list of features */
        var fopts = magic.runtime.creator.catalogues[wmsUrl];
        var currentFeature = this.data.source.feature_name;        
        if (fopts && fopts.length > 0) {
            /* Have previously read the GetCapabilities document - read stored feature data into select list */
            magic.modules.Common.populateSelect(featureSelect, fopts, "value", "name", currentFeature, true);
            this.populateWmsStyleSelector(wmsUrl, currentFeature);            
        } else {
            /* Read available layer data from the service GetCapabilities document */
            var parser = new ol.format.WMSCapabilities();
            var url = wmsUrl + "?request=GetCapabilities&service=wms";
            if (magic.modules.Endpoints.proxy[wmsUrl]) {
                url = magic.config.paths.baseurl + "/proxy?url=" + url;
            }
            var jqXhr = $.get(url, $.proxy(function(response) {
                try {
                    var capsJson = $.parseJSON(JSON.stringify(parser.read(response)));
                    if (capsJson) {
                        magic.runtime.creator.catalogues[wmsUrl] = this.extractFeatureTypes(capsJson);
                        magic.modules.Common.populateSelect(featureSelect, magic.runtime.creator.catalogues[wmsUrl], "value", "name", currentFeature, true);
                        this.populateWmsStyleSelector(wmsUrl, currentFeature);                                          
                    } else {
                        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to parse capabilities for WMS ' + wmsUrl + '</div>');
                        magic.modules.Common.populateSelect(featureSelect, [{name: currentFeature, value: currentFeature}], "value", "name", currentFeature, true);
                        this.populateWmsStyleSelector(wmsUrl, currentFeature);
                    }
                } catch(e) {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to parse capabilities for WMS ' + wmsUrl + '</div>');
                    magic.modules.Common.populateSelect(featureSelect, [{name: currentFeature, value: currentFeature}], "value", "name", currentFeature, true);
                    this.populateWmsStyleSelector(wmsUrl, currentFeature);
                }
            }, this)).fail($.proxy(function() {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to read capabilities for WMS ' + wmsUrl + '</div>');
                magic.modules.Common.populateSelect(featureSelect, [{name: currentFeature, value: currentFeature}], "value", "name", currentFeature, true);
                this.populateWmsStyleSelector(wmsUrl, currentFeature);
            }, this));
        } 
    } else {
        /* No WMS yet selected - empty the feature and style lists */
        magic.modules.Common.populateSelect(featureSelect, [], "", "", "", false);
        magic.modules.Common.populateSelect(styleSelect, [], "", "", "", false);        
    }
};

/**
 * Populate list with the available styles for this feature
 * @param {type} wmsUrl
 * @param {type} select
 * @param {type} featName
 * @param {type} styleName
 */
magic.classes.creator.LayerUpdater.prototype.populateWmsStyleSelector = function(wmsUrl, featName) {
    var styleSelect = $("select[name='" + this.prefix + "-wms-style_name']");
    var currentStyle = this.data.source.style_name;
    if (featName && $.isArray(magic.runtime.creator.catalogues[wmsUrl])) {
        $.each(magic.runtime.creator.catalogues[wmsUrl], $.proxy(function(idx, lyr) {
            var fnNoWs = featName.toLowerCase().split(":").pop();
            var lvNoWs = lyr.value.toLowerCase().split(":").pop();
            if (lvNoWs == fnNoWs) {
                styleSelect.find("option").remove();
                if ($.isArray(lyr.styles) && lyr.styles.length > 1) {
                    /* There's a choice here */
                    magic.modules.Common.populateSelect(styleSelect, lyr.styles, "Name", "Title", currentStyle || lyr.styles[0].Name, false);
                } else {
                    magic.modules.Common.populateSelect(styleSelect, [{Name: "", Title: "Default style"}], "Name", "Title", "", false);                    
                }
                return(false);
            }
            return(true);
        }, this));        
    } else {
        magic.modules.Common.populateSelect(styleSelect, [{Name: "", Title: "Default style"}], "Name", "Title", "", false); 
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
