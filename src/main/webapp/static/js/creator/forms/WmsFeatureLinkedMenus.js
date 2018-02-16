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
            '<label class="col-md-3 control-label" for="' + this.id + '-wms_source">WMS source</label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-wms_source" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a WMS service from which to fetch data" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-feature_name">Feature</label>' +
            '<div class="col-md-9">' +
                '<select class="form-control" id="' + this.id + '-feature_name" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Choose a dataset served by above WMS" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +  
        '<div class="form-group form-group-md col-md-12">' +
            '<label class="col-md-3 control-label" for="' + this.id + '-style_name">Style</label>' +
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
        
    /* Populate the WMS endpoint dropdown with all those endpoints valid for this projection */
    magic.modules.Common.populateSelect(
        this.dropdowns.wms_source, 
        magic.modules.Endpoints.getEndpointsBy("srs", this.projection), 
        "url", "name", data.wms_source, true
    );
    if (data.feature_name) {
        this.loadFeaturesFromService(data.wms_source, data.feature_name);
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
            this.loadFeaturesFromService(wms, "");
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
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadFeaturesFromService = function(serviceUrl, selectedFeat) {
    
    this.dropdowns.feature_name.prop("disabled", false);
    
    /* Strip namespace if present - removed 2018-02-16 David - caused confusion as things failed through lack of the <namespace>: at the beginning */
    //var selectedFeatNoNs = selectedFeat.split(":").pop();
    
    /* Examine GetCapabilities list of features */
    var fopts = magic.runtime.creator.catalogues[serviceUrl];    
    if (fopts && fopts.length > 0) {
        /* Have previously read the GetCapabilities document - read stored feature data into select list */
        magic.modules.Common.populateSelect(this.dropdowns.feature_name, fopts, "value", "name", selectedFeat, true);
        this.loadStylesForFeature(selectedFeat, "");
    } else {
        /* Read available layer data from the service GetCapabilities document */
        jQuery.get(magic.modules.Common.getWxsRequestUrl(serviceUrl, "GetCapabilities"), jQuery.proxy(function(response) {
            try {
                var capsJson = jQuery.parseJSON(JSON.stringify(new ol.format.WMSCapabilities().read(response)));
                if (capsJson) {
                    magic.runtime.creator.catalogues[serviceUrl] = this.extractFeatureTypes(capsJson);
                    magic.modules.Common.populateSelect(this.dropdowns.feature_name, magic.runtime.creator.catalogues[serviceUrl], "value", "name", selectedFeat, true);
                    this.loadStylesForFeature(selectedFeat, "");
                } else {
                    bootbox.alert(
                        '<div class="alert alert-danger" style="margin-top:10px">' + 
                            'Failed to parse capabilities for WMS ' + serviceUrl + 
                        '</div>'
                    );
                    this.dropdowns.feature_name.prop("disabled", true).empty();
                    this.dropdowns.style_name.prop("disabled", true).empty();
                }
            } catch(e) {
                bootbox.alert(
                    '<div class="alert alert-danger" style="margin-top:10px">' + 
                        'Failed to parse capabilities for WMS ' + serviceUrl + 
                    '</div>'
                );
                this.dropdowns.feature_name.prop("disabled", true).empty();
                this.dropdowns.style_name.prop("disabled", true).empty();
            }
        }, this)).fail(jQuery.proxy(function() {                
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-top:10px">' + 
                    'Failed to read capabilities for WMS ' + serviceUrl + 
                '</div>'
            );
            this.dropdowns.feature_name.prop("disabled", true).empty();
            this.dropdowns.style_name.prop("disabled", true).empty();
        }, this));
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
    var ftypes = [];
    if ("Capability" in getCaps && "Layer" in getCaps.Capability && "Layer" in getCaps.Capability.Layer && jQuery.isArray(getCaps.Capability.Layer.Layer)) {
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
magic.classes.creator.WmsFeatureLinkedMenus.prototype.getFeatures = function(ftypes, layers) {
    jQuery.each(layers, jQuery.proxy(function(idx, layer) {
        if ("Name" in layer) {
            /* Leaf node - a named layer */
            ftypes.push({
                name: layer.Title,
                value: layer.Name,
                styles: layer.Style
            });
        } else if ("Layer" in layer && jQuery.isArray(layer["Layer"])) {
            /* More trawling to do */
            this.getFeatures(ftypes, layer["Layer"]);
        }        
    }, this));
};
