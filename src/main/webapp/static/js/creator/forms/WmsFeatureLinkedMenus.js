/* Linked menus for WMS source, feature name and style */

magic.classes.creator.WmsFeatureLinkedMenus = function(options) {
    
    this.id = options.id || "wms-linked-menus";
        
    /* Map projection */
    this.projection = magic.runtime.projection;
    
    /* Controls */
    this.dropdowns = {};
    
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.getValue = function(key) {
    return(this.dropdowns[key].val());
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.formToPayload = function() {
    return({
        "wms_source": this.dropdowns.wms_source.val(),
        "feature_name": this.dropdowns.feature_name.val(),
        "style_name": this.dropdowns.style_name.val() || null
    });
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.markup = function() {
    return(
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-wms_source"><span class="label label-danger">WMS</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-wms_source" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a WMS service from which to fetch data" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-feature_name"><span class="label label-danger">Feature</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-feature_name" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a dataset served by above WMS" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +  
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-style_name"><span class="label label-danger">Style</span></label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-style_name" ' +
                    'data-toggle="tooltip" data-placement="left" title="Choose a style to be used with the feature" required="required">' +
                '</select>' +
            '</div>' +
        '</div>'
    );          
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.sourceSpecified = function() {
    return(this.dropdowns.wms_source.val() != "" && this.dropdowns.feature_name.val() != "");
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.validate = function() {
    var ok = this.sourceSpecified();
    if (!this.dropdowns.wms_source.val()) {
        magic.modules.Common.flagInputError(this.dropdowns.wms_source);
    }
    if (!this.dropdowns.wms_source.val()) {
        magic.modules.Common.flagInputError(this.dropdowns.feature_name);
    }    
    return(ok);
};

/**
 * Initialise the menus
 * @param {Object} data with fields wms_source, feature_name, style_name
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.init = function(data) {
        
    this.dropdowns.wms_source = jQuery("#" + this.id + "-wms_source");
    this.dropdowns.feature_name = jQuery("#" + this.id + "-feature_name");
    this.dropdowns.style_name = jQuery("#" + this.id + "-style_name"); 
    
    /* Need to apply URL aliases here - fix David 2018-10-11 */
    var wmsSource = data.wms_source;
    var equivalentEndpoint = magic.modules.Endpoints.getEndpointsBy("url", wmsSource);
    if (jQuery.isArray(equivalentEndpoint) && equivalentEndpoint[0].url) {
        wmsSource = equivalentEndpoint[0].url;
    }
        
    /* Populate the WMS endpoint dropdown with all those endpoints valid for this projection */
    magic.modules.Common.populateSelect(
        this.dropdowns.wms_source, 
        magic.modules.Endpoints.getEndpointsBy("srs", this.projection), 
        "url", "name", wmsSource, true
    );    
    if (data.feature_name) {
        this.loadFeaturesFromService(wmsSource, data.feature_name, data.style_name);
    }
    
    /* Assign handler for endpoint selection */    
    this.dropdowns.wms_source.off("change").on("change", jQuery.proxy(function() {    
        var wms = this.dropdowns.wms_source.val();
        if (!wms || wms == "osm") {
            /* No WMS selection, or OpenStreetMap */
            this.dropdowns.feature_name.prop("disabled", true).empty();
            this.dropdowns.style_name.prop("disabled", true).empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.feature_name.prop("disabled", false);
            this.loadFeaturesFromService(wms, "", "");
            this.dropdowns.style_name.prop("disabled", true).empty();
        }        
    }, this));
    
    /* Assign handler for feature selection */
    this.dropdowns.feature_name.off("change").on("change", jQuery.proxy(function() {  
        var wms = this.dropdowns.wms_source.val();
        var fname = this.dropdowns.feature_name.val();
        if (!fname) {
            /* No feature selection */
            this.dropdowns.style_name.prop("disabled", true).empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.style_name.prop("disabled", false);
            this.loadStylesForFeature(wms, fname, "");
        }        
    }, this));
        
};

/**
 * Load WMS features from a service endpoint whose URL is given
 * @param {String} serviceUrl
 * @param {Object} selectedFeat
 * @param {String} selectedStyle
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadFeaturesFromService = function(serviceUrl, selectedFeat, selectedStyle) {
    
    if (serviceUrl != "osm") {
        
        selectedStyle = selectedStyle || "";    
        this.dropdowns.feature_name.prop("disabled", false);

        /* Strip namespace if present - removed 2018-02-16 David - caused confusion as things failed through lack of the <namespace>: at the beginning */
        //var selectedFeatNoNs = selectedFeat.split(":").pop();

        /* Examine GetCapabilities list of features */
        var fopts = magic.runtime.creator.catalogues[serviceUrl];    
        if (fopts && fopts.length > 0) {
            /* Have previously read the GetCapabilities document - read stored feature data into select list */
            magic.modules.Common.populateSelect(this.dropdowns.feature_name, fopts, "value", "name", selectedFeat, true);
            this.loadStylesForFeature(serviceUrl, selectedFeat, selectedStyle);
        } else {
            /* Read available layer data from the service GetCapabilities document */
            jQuery.get(magic.modules.Common.getWxsRequestUrl(serviceUrl, "GetCapabilities"), jQuery.proxy(function(response) {
                try {
                    var capsJson = jQuery.parseJSON(JSON.stringify(new ol.format.WMSCapabilities().read(response)));
                    if (capsJson) {
                        magic.runtime.creator.catalogues[serviceUrl] = this.extractFeatureTypes(capsJson);
                        magic.modules.Common.populateSelect(this.dropdowns.feature_name, magic.runtime.creator.catalogues[serviceUrl], "value", "name", selectedFeat, true);
                        this.loadStylesForFeature(serviceUrl, selectedFeat, selectedStyle);
                    } else {
                        magic.modules.Common.showAlertModal("Failed to parse capabilities for WMS " + serviceUrl, "error");                       
                        this.dropdowns.feature_name.prop("disabled", true).empty();
                        this.dropdowns.style_name.prop("disabled", true).empty();
                    }
                } catch(e) {
                    magic.modules.Common.showAlertModal("Failed to parse capabilities for WMS " + serviceUrl, "error");                   
                    this.dropdowns.feature_name.prop("disabled", true).empty();
                    this.dropdowns.style_name.prop("disabled", true).empty();
                }
            }, this)).fail(jQuery.proxy(function() {                
                magic.modules.Common.showAlertModal("Failed to read capabilities for WMS " + serviceUrl, "error");                 
                this.dropdowns.feature_name.prop("disabled", true).empty();
                this.dropdowns.style_name.prop("disabled", true).empty();
            }, this));
        }
    }
};

/**
 * Populate list with the available styles for this feature
 * @param {String} serviceUrl 
 * @param {String} featName
 * @param {Object} selectedStyle
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadStylesForFeature = function(serviceUrl, featName, selectedStyle) {    
    if (featName && jQuery.isArray(magic.runtime.creator.catalogues[serviceUrl])) {
        jQuery.each(magic.runtime.creator.catalogues[serviceUrl], jQuery.proxy(function(idx, lyr) {
            var fnNoWs = featName.toLowerCase().split(":").pop();
            var lvNoWs = lyr.value.toLowerCase().split(":").pop();
            if (lvNoWs == fnNoWs) {
                if (jQuery.isArray(lyr.styles) && lyr.styles.length > 1) {
                    /* There's a choice here */
                    magic.modules.Common.populateSelect(this.dropdowns.style_name, lyr.styles, "Name", "Title", selectedStyle, false);
                } else {
                    magic.modules.Common.populateSelect(this.dropdowns.style_name, [{Name: "", Title: "Default style"}], "Name", "Title", "", false);                    
                }
                return(false);
            }
            return(true);
        }, this));        
    } else {
        magic.modules.Common.populateSelect(this.dropdowns.style_name, [{Name: "", Title: "Default style"}], "Name", "Title", "", false); 
    }
};

/**
 * Extract feature types from GetCapabilities response
 * @param {object} getCaps
 * @returns {Array}
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.extractFeatureTypes = function(getCaps) {
    var ftypes = [], uniqueDict = {};    
    if ("Capability" in getCaps && "Layer" in getCaps.Capability && "Layer" in getCaps.Capability.Layer && jQuery.isArray(getCaps.Capability.Layer.Layer)) {
        var layers = getCaps.Capability.Layer.Layer;
        this.getFeatures(ftypes, uniqueDict, layers);        
    } else {
        magic.modules.Common.showAlertModal("Malformed GetCapabilities response received from remote WMS", "error");
    }
    return(ftypes);
};

/**
 * Recursive trawl through the GetCapabilities document for named layers
 * @param {Array} ftypes
 * @param {Object} uniqueDict
 * @param {Array} layers
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.getFeatures = function(ftypes, uniqueDict, layers) {
    jQuery.each(layers, jQuery.proxy(function(idx, layer) {
        if ("Name" in layer) {
            /* Leaf node - a named layer */
            //console.log("=== Layer data ===");
            //console.log("Name : " + layer.Name);
            //console.log("Title : " + layer.Title);
            if (!(layer.Title in uniqueDict)) {
                //console.log("Not seen this one yet");
                ftypes.push({
                    name: layer.Title,
                    value: layer.Name,
                    styles: layer.Style
                });
                uniqueDict[layer.Title] = 1;
            } //else {
                //console.log("Seen before - skipping");
            //}
            //console.log("=== End ===");
        }
        if ("Layer" in layer && jQuery.isArray(layer["Layer"])) {
            /* More trawling to do */
            this.getFeatures(ftypes, uniqueDict, layer["Layer"]);
        }        
    }, this));
};
