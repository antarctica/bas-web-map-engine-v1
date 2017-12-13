/* Show graticule button */

magic.classes.GraticuleButton = function (name, ribbon) {

    var options = {
        name: name, 
        ribbon: ribbon,
        inactiveTitle: "Show graticule",
        activeTitle: "Hide graticule",
        onActivate: jQuery.proxy(this.onActivate, this),
        onDeactivate: jQuery.proxy(this.onDeactivate, this)
    };    
    
    magic.classes.MapControlButton.call(this, options);  

    /* Internal properties */
    this.graticule = null;      /* OL control for non-polar projections */
    this.graticuleLayer = null; /* Data layer for polar projections */
    
    var projection = this.map.getView().getProjection();
    var projCode = projection.getCode();
    var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(projCode);
    var isPolar = magic.modules.GeoUtils.isPolarProjection(projCode);
    if (!isPolar) {
        /* Use OL graticule control */
        if (!this.graticule) {
            projection.setWorldExtent(projExtent);
            projection.setExtent(projExtent);
            this.graticule = new ol.Graticule({showLabels: true});
        }
        this.graticule.setMap(this.map);
    } else {
        /* Use a data layer */
        if (!this.graticuleLayer) {
            var gratEp = null;
            var projEps = magic.modules.Endpoints.getEndpointsBy("srs", projCode);
            for (var i = 0; i < projEps.length; i++) {
                if (projEps[i].graticule_layer) {
                    gratEp = projEps[i];
                    break;
                }
            }
            if (gratEp) {
                /* Found a graticule data layer we can use */
                var wmsSource = new ol.source.ImageWMS(({
                    url: magic.modules.Endpoints.getOgcEndpoint(gratEp.url, "wms"),
                    params: {"LAYERS": gratEp.graticule_layer},
                    projection: projection
                }));
                var resolutions = this.map.getView().getResolutions();
                this.graticuleLayer = new ol.layer.Image({
                    name: "automated_graticule_layer",
                    visible: true,
                    source: wmsSource,
                    minResolution: resolutions[resolutions.length-1],
                    maxResolution: resolutions[0]+1
                });                
                this.map.addLayer(this.graticuleLayer);
                /* Send to top of WMS layer stack (vectors will be on top of it) */
                this.graticuleLayer.setZIndex(199);
            } else {
                /* No graticule layer found */
                alert("No endpoint exports a graticule layer - none therefore available");
            }
        }        
    }     
};

magic.classes.GraticuleButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.GraticuleButton.prototype.constructor = magic.classes.GraticuleButton;

/**
 * Activate control callback
 */
magic.classes.GraticuleButton.prototype.onActivate = function () {
    if (this.graticule) {
        this.graticule.setMap(this.map);
    } else if (this.graticuleLayer) {
        this.graticuleLayer.setVisible(true);
    }
};

/**
 * Deactivate control callback
 */
magic.classes.GraticuleButton.prototype.onDeactivate = function () {
    if (this.graticule) {
        this.graticule.setMap(null);
    } else if (this.graticuleLayer) {
        this.graticuleLayer.setVisible(false);
    }
};
    