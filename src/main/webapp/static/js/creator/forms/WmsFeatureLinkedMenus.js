/* Linked menus for WMS source, feature name and style */

magic.classes.creator.WmsFeatureLinkedMenus = function(options) {
    
    this.id = options.id || "wms-linked-menus";
    
    /* WMS service endpoints available */
    this.endpoints = options.endpoints;
    
    /* Map projection */
    this.projection = magic.modules.GeoUtils.DEFAULT_MAP_PARAMS[options.mapRegion || "antarctic"];
    
    /* Controls */
    this.dropdowns = {};
    
};

magic.classes.creator.WmsFeatureLinkedMenus.prototype.markup = function() {
    return(
        '<div class="form-group">' +
            '<label class="col-sm-4 control-label" for="' + this.id + '-wms_source">WMS source</label>' +
            '<div class="col-sm-8">' +
                '<select class="form-control" id="' + this.id + '-wms_source" '
                    'data-toggle="tooltip" data-placement="left" title="Choose a WMS service from which to fetch data" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="col-sm-4 control-label" for="' + this.id + '-feature_name">Feature</label>' +
            '<div class="col-sm-8">' +
                '<select class="form-control" id="' + this.id + '-feature_name" '
                    'data-toggle="tooltip" data-placement="left" title="Choose a dataset served by above WMS" required="required">' +
                '</select>' +
            '</div>' +
        '</div>' +  
        '<div class="form-group">' +
            '<label class="col-sm-3 control-label" for="' + this.id + '-style_name">Style</label>' +
            '<div class="col-sm-9">' +
                '<select class="form-control" id="' + this.id + '-style_name" '
                    'data-toggle="tooltip" data-placement="left" title="Choose a style to be used with the feature" required="required">' +
                '</select>' +
            '</div>' +
        '</div>'
    );          
};

/**
 * Initialise the menus
 * @param {Object} data with fields wms_source, feature_name, style_name
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.init = function(data) {
    
    this.dropdowns.wms_source = jQuery("#" + this.id + "-wms_source");
    this.dropdowns.feature_name = jQuery("#" + this.id + "-feature_name");
    this.dropdowns.style_name = jQuery("#" + this.id + "-style_name");    
    
    /* Populate the WMS endpoint dropdown with all those endpoints valid for this region */
    magic.modules.Common.populateSelect(
        this.dropdowns.wms_source, 
        magic.modules.Endpoints.getEndpointsBy("srs", this.projection), 
        "url", "name", "", true
    );
    
    /* Assign handler for endpoint selection */
    this.dropdowns.wms_source.on("change", jQuery.proxy(function(evt, populator) {
        populator = populator || {};
        if (populator && !jQuery.isEmptyObject(populator)) {
            /* Initialising the menu cascade programmatically (this does *not* fire the change event) */
            this.dropdowns.wms_source.val(populator.wms_source || "");
        } 
        var value = this.dropdowns.wms_source.val();
        if (!value || value == "osm") {
            /* No WMS selection, or OpenStreetMap */
            this.dropdowns.feature_name.addClass("disabled").empty();
            this.dropdowns.style_name.addClass("disabled").empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.feature_name.removeClass("disabled");
            this.loadFeaturesFromService(value, populator);
            this.dropdowns.style_name.addClass("disabled").empty();
        }        
    }, this));
    
    /* Assign handler for feature selection */
    this.dropdowns.feature_name.on("change", jQuery.proxy(function(evt, populator) {
        populator = populator || {};
        if (populator && !jQuery.isEmptyObject(populator)) {
            /* Initialising the menu cascade programmatically (this does *not* fire the change event) */
            this.dropdowns.feature_name.val(populator.feature_name || "");
        } 
        var value = this.dropdowns.feature_name.val();
        if (!value) {
            /* No feature selection */
            this.dropdowns.style_name.addClass("disabled").empty();
        } else {
            /* Selected a new WMS */
            this.dropdowns.style_name.removeClass("disabled");
            this.loadStylesForFeature(value, populator);
        }        
    }, this));
    
    this.dropdowns.wms_source.trigger("change", data);
};

/**
 * Load WMS features from a service endpoint whose URL is given
 * @param {String} serviceUrl
 * @param {Object} populator
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadFeaturesFromService = function(serviceUrl, populator) {
    
    this.dropdowns.feature_name.removeClass("disabled");
    
    /* Examine GetCapabilities list of features */
    var fopts = magic.runtime.creator.catalogues[serviceUrl];    
    if (fopts && fopts.length > 0) {
        /* Have previously read the GetCapabilities document - read stored feature data into select list */
        magic.modules.Common.populateSelect(this.dropdowns.feature_name, fopts, "value", "name", "", true);        
    } else {
        /* Read available layer data from the service GetCapabilities document */
        jQuery.get(magic.modules.Common.getWxsRequestUrl(serviceUrl, "GetCapabilities"), jQuery.proxy(function(response) {
            try {
                var capsJson = jQuery.parseJSON(JSON.stringify(new ol.format.WMSCapabilities().read(response)));
                if (capsJson) {
                    magic.runtime.creator.catalogues[serviceUrl] = this.extractFeatureTypes(capsJson);
                    magic.modules.Common.populateSelect(this.dropdowns.feature_name, magic.runtime.creator.catalogues[serviceUrl], "value", "name", "", true);
                    this.dropdowns.feature_name.trigger("change", populator);
                } else {
                    bootbox.alert(
                        '<div class="alert alert-danger" style="margin-top:10px">' + 
                            'Failed to parse capabilities for WMS ' + serviceUrl + 
                        '</div>'
                    );
                    this.dropdowns.feature_name.addClass("disabled").empty();
                    this.dropdowns.style_name.addClass("disabled").empty();
                }
            } catch(e) {
                bootbox.alert(
                    '<div class="alert alert-danger" style="margin-top:10px">' + 
                        'Failed to parse capabilities for WMS ' + serviceUrl + 
                    '</div>'
                );
                this.dropdowns.feature_name.addClass("disabled").empty();
                this.dropdowns.style_name.addClass("disabled").empty();
            }
        }, this)).fail(jQuery.proxy(function() {                
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-top:10px">' + 
                    'Failed to read capabilities for WMS ' + serviceUrl + 
                '</div>'
            );
            this.dropdowns.feature_name.addClass("disabled").empty();
            this.dropdowns.style_name.addClass("disabled").empty();
        }, this));
    }
};

/**
 * Populate list with the available styles for this feature 
 * @param {String} featName
 * @param {Object} populator
 */
magic.classes.creator.WmsFeatureLinkedMenus.prototype.loadStylesForFeature = function(featName, populator) {    
    if (featName && jQuery.isArray(magic.runtime.creator.catalogues[populator.wms_source])) {
        jQuery.each(magic.runtime.creator.catalogues[populator.wms_source], jQuery.proxy(function(idx, lyr) {
            var fnNoWs = featName.toLowerCase().split(":").pop();
            var lvNoWs = lyr.value.toLowerCase().split(":").pop();
            if (lvNoWs == fnNoWs) {
                if (jQuery.isArray(lyr.styles) && lyr.styles.length > 1) {
                    /* There's a choice here */
                    magic.modules.Common.populateSelect(this.dropdowns.style_name, lyr.styles, "Name", "Title", populator.style_name || lyr.styles[0].Name, false);
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
