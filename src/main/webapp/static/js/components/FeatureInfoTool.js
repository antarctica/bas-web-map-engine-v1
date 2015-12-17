/* Get information about features */

magic.classes.FeatureInfoTool = function(name) {

    /* API property */
    this.name = name || "feature-info-tool";

    /* Internal properties */
    this.active = false;   
    
    /* Feature popup */
    this.featureinfo = new magic.classes.FeaturePopup();

};

magic.classes.FeatureInfoTool.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.FeatureInfoTool.prototype.activate = function () {    
    this.active = true;       
    $("#map-container").css("cursor", "help");
    magic.runtime.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoTool.prototype.deactivate = function () {
    this.active = false;        
    /* Remove map click handler */
    magic.runtime.featureinfo.hide();
    $("#map-container").css("cursor", "default");
    magic.runtime.map.un("singleclick", this.queryFeatures, this);        
};

/**
 * Send a GetFeatureInfo request to all point layers
 * @param {jQuery.Event} evt
 */
magic.classes.FeatureInfoTool.prototype.queryFeatures = function(evt) {
    
    /* Get the vector features first */
    var px = evt.pixel;
    var fprops = this.featuresAtPixel(px);
        
    var deferreds = [];
     magic.runtime.map.getLayers().forEach(function(layer) {
        /* Find the WMS interactive layers */
        if (layer.getVisible() === true) {
            var md = layer.get("metadata");
            if (md && md.source && md.source.wms_source && md.is_interactive === true) {
                var url = layer.getSource().getGetFeatureInfoUrl(
                    evt.coordinate, 
                    magic.runtime.map.getView().getResolution(), 
                    magic.runtime.map.getView().getProjection(),
                    {
                        "LAYERS": md.source.feature_name,
                        "QUERY_LAYERS": md.source.feature_name,
                        "INFO_FORMAT": "application/json", 
                        "FEATURE_COUNT": 10,
                        "BUFFER": 10
                    }
                );
                if (magic.modules.Common.proxy_endpoints[md.source.wms_source] === true) {
                    url = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url);
                }
                if (url) {
                    deferreds.push($.get(url).success(function(data) {
                        if ($.isArray(data.features) && data.features.length > 0) {
                            $.each(data.features, function(idx, f) {
                                if (f.geometry) {
                                    var capBits = f.id.split(/[^A-Za-z0-9]/);
                                    capBits = capBits.slice(0, capBits.length-1);
                                    var caption = magic.modules.Common.initCap(capBits.join(" "));                        
                                    fprops.push($.extend({}, f.properties, {"layer": layer}));                                       
                                }
                            });
                        }
                    }));
                }
            }
        }
    });
    $.when.apply($, deferreds).done($.proxy(function() {
        this.featureinfo.show(evt.coordinate, fprops)
    }, this));
};

/**
 * Get all vector features at the given pixel (e.g. from Geosearch or user GPX/KML layers)
 * @param {ol.coordinate} px pixel coordinate
 */
magic.classes.FeatureInfoTool.prototype.featuresAtPixel = function(px) {
    var fprops = [];
    magic.runtime.map.forEachFeatureAtPixel(px, function(feature, layer) {
        if (layer != null) {
            /* This is not a feature overlay i.e. an artefact of presentation not real data */
            var clusterMembers = feature.get("features");
            if (clusterMembers && $.isArray(clusterMembers)) {
                /* Unpack cluster features */
                $.each(clusterMembers, function(fi, f) {
                    if (f.getGeometry()) {
                        var exProps = f.getProperties();
                        fprops.push($.extend({}, exProps, {"layer": layer}));                           
                    }                    
                });
            } else {
                if (feature.getGeometry()) {
                    var exProps = feature.getProperties();
                    fprops.push($.extend({}, exProps, {"layer": layer}));
                }          
            }
        }
    }, this, function(candidate) {
        return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
    }, this);
    return(fprops);
};

    