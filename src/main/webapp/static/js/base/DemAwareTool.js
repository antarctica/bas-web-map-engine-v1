/* Prototype class for map DEM aware tools */

magic.classes.DemAwareTool = function (options) {

    /* === API properties === */

    /* Identifier */
    this.id = options.id;

    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* === End of API properties === */
    
    /* List of DEMs in current map */
    this.demLayers = this.getDemLayers();
    
    /* Units in which to express elevations */
    this.units = "m";
    
};

magic.classes.DemAwareTool.prototype.getUnits = function() {
    return(this.units);
};

magic.classes.DemAwareTool.prototype.setUnits = function(units) {
    this.units = units;
};

/**
 * Get DEM layers within the current map
 * @returns {Array<ol.Layer>}
 */
magic.classes.DemAwareTool.prototype.getDemLayers = function() {
    var dems = [];
    if (this.map) {
        this.map.getLayers().forEach(function (layer) {
            var md = layer.get("metadata");
            if (md && md.source) {
                if (md.source.is_dem === true) {
                    dems.push(layer);
                }
            }
        });
    }
    return(dems);
};

/**
 * Get WMS feature names for all visible DEM layers
 * @return {Array} feature types
 */
magic.classes.DemAwareTool.prototype.currentlyVisibleDems = function() {
    var visibleDems = [];
    if (this.demLayers.length > 0) {                
        visibleDems = jQuery.map(this.demLayers, function(l, idx) {
            if (l.getVisible()) {
                return(l.get("metadata").source.feature_name);
            }
        });       
    }
    return(visibleDems);
};

/**
 * Map click handler to query DEM elevation at a point
 * @param {jQuery.Event} evt
 * @param {Function} successCb - callback on success of the query
 * @param {Function} failCb
 */
magic.classes.DemAwareTool.prototype.queryElevation = function(evt, successCb, failCb) {    
    var demFeats = this.currentlyVisibleDems();    
    if (demFeats.length > 0) {
        /* May need a proxy in some cases */
        var clickPoint = evt.coordinate;
        var url = this.demLayers[0].getSource().getGetFeatureInfoUrl(
            clickPoint, this.map.getView().getResolution(), this.map.getView().getProjection().getCode(),
            {
                "LAYERS": demFeats.join(","),
                "QUERY_LAYERS": demFeats.join(","),
                "INFO_FORMAT": "application/json",
                "FEATURE_COUNT": this.demLayers.length
            });
        if (url) {            
            jQuery.ajax({
                url: magic.modules.Common.proxyUrl(url),
                method: "GET"
            })
            .done(jQuery.proxy(function(data) {
                /* Expect a feature collection with one feature containing a properties object */
                var clickPointWgs84 = ol.proj.transform(clickPoint, this.map.getView().getProjection().getCode(), "EPSG:4326");
                var lon = magic.modules.GeoUtils.applyPref("coordinates", parseFloat(clickPointWgs84[0]).toFixed(2), "lon");
                var lat = magic.modules.GeoUtils.applyPref("coordinates", parseFloat(clickPointWgs84[1]).toFixed(2), "lat");
                var elevation = this.getDemValue(data);
                successCb(clickPoint, lon, lat, elevation);                
            }, this))
            .fail(jQuery.proxy(function(xhr) {
                failCb(clickPoint, xhr);                
            }, this));
        }
    }
};

/**
 * Extract the DEM value from the GFI feature collection
 * @param {Object} json FeatureCollection
 * @returns {number|NaN}
 */
magic.classes.DemAwareTool.prototype.getDemValue = function(json) {
    var demValue = Number.NaN;
    if (jQuery.isArray(json.features) && json.features.length > 0) {
        /* Look for a sensible number */    
        jQuery.each(json.features, function(idx, f) {
            if (f.properties) {
                jQuery.each(f.properties, function(key, value) {
                    var fval = parseFloat(value);
                    if (!isNaN(fval) && Math.abs(fval) < 9000 && fval > fdem) {
                        demValue = Math.ceil(fval);
                    }
                });
            }
        });        
    }
    return(demValue);
};