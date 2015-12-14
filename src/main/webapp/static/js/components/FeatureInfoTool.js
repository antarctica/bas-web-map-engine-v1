/* Get information about features */

magic.classes.FeatureInfoTool = function(name) {

    /* API property */
    this.name = name;

    /* Internal properties */
    this.active = false;   

};

magic.classes.FeatureInfoTool.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.FeatureInfoTool.prototype.activate = function () {
    
    /* Trigger mapinteractionactivated event */
    $(document).trigger("mapinteractionactivated", this);  
    
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
    var gfiLayer = null, gfiParams = [];// TODO - array of ajax calls
    magic.runtime.map.getLayers().forEach(function(layer) {
        /* Find the WMS interactive layers */
        if (layer.getVisible() === true) {
            var md = layer.get("metadata");
            if (md && md.source.wms_source && md.is_interactive === true) {
                if (!gfiLayer) {
                    gfiLayer = layer;
                }
                gfiParams.push(layer.getSource().getParams()["LAYERS"]);
            }
        }        
    });
    /* Get the vector features first */
    var px = evt.pixel;
    var fprops = this.featuresAtPixel(px);
    if (gfiLayer) {        
        $.getJSON(magic.config.paths.baseurl + "/proxy/gs/gfi?url=" + encodeURIComponent(gfiLayer.getSource().getGetFeatureInfoUrl(
            evt.coordinate, 
            magic.runtime.map.getView().getResolution(), 
            magic.runtime.map.getView().getProjection(),
            {
                "LAYERS": gfiParams.join(","),
                "QUERY_LAYERS": gfiParams.join(","),
                "INFO_FORMAT": "application/json", 
                "FEATURE_COUNT": 10,
                "buffer": 10
            }
        ))).done($.proxy(function(data) {            
            if ($.isArray(data.features) && data.features.length > 0) {
                $.each(data.features, function(idx, f) {
                    if (f.geometry) {
                        var capBits = f.id.split(/[^A-Za-z0-9]/);
                        capBits = capBits.slice(0, capBits.length-1);
                        var caption = magic.modules.Common.initCap(capBits.join(" "));                        
                        fprops.push($.extend({}, f.properties, {
                            "__geomtype": f.geometry.type.toLowerCase(),
                            "__title": caption
                        }));
                    }
                });
            }
            magic.runtime.featureinfo.show(evt.coordinate, fprops);
        }, this));
    } else {
        magic.runtime.featureinfo.show(evt.coordinate, fprops);
    }
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
                        fprops.push($.extend({}, exProps, {
                            "__geomtype": exProps["__title"] || layer.get("metadata")["geom_type"],
                            "__title": exProps["__title"] || layer.get("name")
                        }));
                    }                    
                });
            } else {
                if (feature.getGeometry()) {
                    var exProps = feature.getProperties();
                    fprops.push($.extend({}, exProps, {
                        "__geomtype": exProps["__title"] || layer.get("metadata")["geom_type"],
                        "__title": exProps["__title"] || layer.get("name")
                    }));
                }          
            }
        }
    }, this, function(candidate) {
        return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
    }, this);
    return(fprops);
};

    