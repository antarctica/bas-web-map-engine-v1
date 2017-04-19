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
    magic.runtime.map_container.css("cursor", "help");
    magic.runtime.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoTool.prototype.deactivate = function () {
    this.active = false;        
    /* Remove map click handler */
    this.featureinfo.hide();
    magic.runtime.map_container.css("cursor", "default");
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
                var url = null;
                var service = magic.modules.Endpoints.getEndpointBy("url", md.source.wms_source);
                if (false && service && service.has_wfs === true && (md.geom_type == "point" || md.geom_type == "line")) {
                    /* David 2017-04-19 - disabled as causing too many problems with on-the-fly reprojected layers */
                    /* Use WFS version of handling click for points or lines - a much better user experience */
                    var bxw = magic.runtime.map.getView().getResolution()*10;
                    var bxc = evt.coordinate;
                    var featName = md.source.feature_name;
                    if (featName.indexOf(":") == -1) {
                        var ws = magic.modules.Endpoints.getVirtualService(md.source.wms_source);
                        if (ws != "") {
                            featName = ws + ":" + featName;
                        }
                    }
                    var bbox = [(bxc[0] - bxw), (bxc[1] - bxw), (bxc[0] + bxw), (bxc[1] + bxw)].join(",");
                    url = md.source.wms_source.replace("wms", "wfs") + "?service=wfs&version=2.0.0&request=getfeature&typename=" + featName + "&srsName=" + 
                        magic.runtime.map.getView().getProjection().getCode() + "&bbox=" + bbox + "&outputFormat=application/json&count=10";
                } else {
                    /* GetFeatureInfo version of interactivity - needs unacceptable user precision in some cases, and it isn't possible to override Geoserver's
                    use of the SLD to determine the size of buffer to the click in all cases. Have implemented a WFS version of the same interactivity which
                    uses a bounding box computed from a 10 pixel radius around the click.  This works well for all layers natively in the map projection - it
                    fails for those in e.g. EPSG:4326 unless the map projection is declared in the layer definition, and "reproject native to declared" is 
                    selected in the Geoserver admin GUI - David 16/02/2017. */
                    url = layer.getSource().getGetFeatureInfoUrl(
                        evt.coordinate, 
                        magic.runtime.map.getView().getResolution(), 
                        magic.runtime.map.getView().getProjection(),
                        {
                            "LAYERS": md.source.feature_name,
                            "QUERY_LAYERS": md.source.feature_name,
                            "INFO_FORMAT": "application/json", 
                            "FEATURE_COUNT": 10,
                            "buffer": 20
                        }
                    );  
                }
                if (url) {
                    deferreds.push(jQuery.get(magic.modules.Common.proxyUrl(url)).success(function(data) {
                        if (typeof data == "string") {
                            data = JSON.parse(data);
                        }
                        if (jQuery.isArray(data.features) && data.features.length > 0) {
                            jQuery.each(data.features, function(idx, f) {
                                if (f.geometry) {                                    
                                    var capBits = f.id.split(/[^A-Za-z0-9]/);
                                    capBits = capBits.slice(0, capBits.length-1);
                                    var caption = magic.modules.Common.initCap(capBits.join(" "));                        
                                    fprops.push(jQuery.extend({}, f.properties, {"layer": layer}));                                       
                                }
                            });
                        }
                    }));
                }
            }
        }
    });
    jQuery.when.apply($, deferreds).done(jQuery.proxy(function() {
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
            if (clusterMembers && jQuery.isArray(clusterMembers)) {
                /* Unpack cluster features */
                jQuery.each(clusterMembers, function(fi, f) {
                    if (f.getGeometry()) {
                        var exProps = f.getProperties();
                        fprops.push(jQuery.extend({}, exProps, {"layer": layer}));                           
                    }                    
                });
            } else {
                if (feature.getGeometry()) {
                    var exProps = feature.getProperties();
                    fprops.push(jQuery.extend({}, exProps, {"layer": layer}));
                }          
            }
        }
    }, this, function(candidate) {
        return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
    }, this);
    return(fprops);
};

    