/* Get information about features */

magic.classes.FeatureInfoTool = function(name, map) {

    /* API property */
    this.name = name || "feature-info-tool";
    
    this.map = map || magic.runtime.map;

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
    jQuery("#" + this.map.getTarget()).css("cursor", "help");
    this.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoTool.prototype.deactivate = function () {
    this.active = false;        
    /* Remove map click handler */
    this.featureinfo.hide();
    jQuery("#" + this.map.getTarget()).css("cursor", "default");
    this.map.un("singleclick", this.queryFeatures, this);        
};

/**
 * Send a GetFeatureInfo request to all point layers
 * @param {jQuery.Event} evt
 */
magic.classes.FeatureInfoTool.prototype.queryFeatures = function(evt) {
    
    /* Get the vector features first */
    var fprops = magic.modules.Common.featuresAtPixel(evt);
    
    /* Now the WMS GetFeatureInfo ones */
    var deferreds = [];
    this.map.forEachLayerAtPixel(evt.pixel, function(layer) {
        var url = null;
        var md = layer.get("metadata");
        var service = magic.modules.Endpoints.getEndpointBy("url", md.source.wms_source);
        if (false && service && service.has_wfs === true && (md.geom_type == "point" || md.geom_type == "line")) {
            /* David 2017-04-19 - disabled as causing too many problems with on-the-fly reprojected layers */
            /* Use WFS version of handling click for points or lines - a much better user experience */
            var bxw = this.map.getView().getResolution()*10;
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
                this.map.getView().getProjection().getCode() + "&bbox=" + bbox + "&outputFormat=application/json&count=10";
        } else {
            /* GetFeatureInfo version of interactivity - needs unacceptable user precision in some cases, and it isn't possible to override Geoserver's
            use of the SLD to determine the size of buffer to the click in all cases. Have implemented a WFS version of the same interactivity which
            uses a bounding box computed from a 10 pixel radius around the click.  This works well for all layers natively in the map projection - it
            fails for those in e.g. EPSG:4326 unless the map projection is declared in the layer definition, and "reproject native to declared" is 
            selected in the Geoserver admin GUI - David 16/02/2017. */
            url = layer.getSource().getGetFeatureInfoUrl(
                evt.coordinate, 
                this.map.getView().getResolution(), 
                this.map.getView().getProjection(),
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
                            fprops.push(jQuery.extend({}, f.properties, {"layer": layer}));                                       
                        }
                    });
                }
            }));
        }
    }, this, function(layer) {
        var md = layer.get("metadata");
        return(layer.getVisible() === true && md && md.source && md.source.wms_source && md.is_interactive === true);
    }, this);
 
    /* Now apply all the feature queries and assemble a pop-up */
    jQuery.when.apply(jQuery, deferreds).done(jQuery.proxy(function() {
        this.featureinfo.show(evt.coordinate, fprops);
    }, this));
};

/**
 * Callback to destroy all pop-ups which reference a layer that got turned off by the user
 */
magic.classes.FeatureInfoTool.prototype.layerVisibilityHandler = function() {
    this.featureinfo.hideInvisibleLayerPopups();
};
