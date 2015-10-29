/* Get information about features */

magic.classes.FeatureInfoButton = function(name) {

    /* API property */
    this.name = name;

    /* Internal properties */
    this.active = false;

    this.inactiveTitle = "Get information about map features";
    this.activeTitle = "Click to exit feature info mode";

    this.btn = $("<button>", {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-info-circle"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));

};

magic.classes.FeatureInfoButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.FeatureInfoButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.FeatureInfoButton.prototype.activate = function () {
    
    /* Trigger mapinteractionactivated event */
    $(document).trigger("mapinteractionactivated", this);  
    
    this.active = true;   
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
    /* Add map click handler (NOTE: assumes first base layer is a DEM) */
    $("#map-container").css("cursor", "help");
    magic.runtime.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoButton.prototype.deactivate = function () {
    this.active = false;    
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
    /* Remove map click handler */
    magic.runtime.featureinfo.hide();
    $("#map-container").css("cursor", "default");
    magic.runtime.map.un("singleclick", this.queryFeatures, this);
};

/**
 * Send a GetFeatureInfo request to all point layers
 * @param {jQuery.Event} evt
 */
magic.classes.FeatureInfoButton.prototype.queryFeatures = function(evt) {    
    var gfiLayer = null, gfiParams = [];
    magic.runtime.map.getLayers().forEach(function(layer) {
        /* Weed out the clickable (interactive) layers, eliminating user GPX/KML layers */
        if (layer.getVisible() === true) {
            var md = layer.get("metadata");
            if (md && md["clickable"] === true && !(md.type == "geo_kml" || md.type == "geo_gpx")) {
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
magic.classes.FeatureInfoButton.prototype.featuresAtPixel = function(px) {
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
                            "__geomtype": f.getGeometry().getType().toLowerCase(),
                            "__title": exProps["__title"] || layer.get("name")
                        }));
                    }                    
                });
            } else {
                if (feature.getGeometry()) {
                    var exProps = feature.getProperties();
                    fprops.push($.extend({}, exProps, {
                        "__geomtype": feature.getGeometry().getType().toLowerCase(),
                        "__title": exProps["__title"] || layer.get("name")
                    }));
                }          
            }
        }
    }, this);
    return(fprops);
};

    