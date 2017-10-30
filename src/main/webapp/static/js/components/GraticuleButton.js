/* Show graticule button */

magic.classes.GraticuleButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.active = true;
    this.graticule = null;      /* OL control for non-polar projections */
    this.graticuleLayer = null; /* Data layer for polar projections */    

    this.inactiveTitle = "Show graticule";
    this.activeTitle = "Hide graticule";

    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool active",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.activeTitle,
        "html": '<span class="fa fa-table"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
    
    var projection = magic.runtime.map.getView().getProjection();
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
        this.graticule.setMap(magic.runtime.map);
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
                this.graticuleLayer = new ol.layer.Image({
                    name: "automated_graticule_layer",
                    visible: true,
                    source: wmsSource,
                    minResolution: magic.runtime.viewdata.resolutions[magic.runtime.viewdata.resolutions.length-1],
                    maxResolution: magic.runtime.viewdata.resolutions[0]+1
                });                
                magic.runtime.map.addLayer(this.graticuleLayer);
                /* Send to top of WMS layer stack (vectors will be on top of it) */
                this.graticuleLayer.setZIndex(199);
            } else {
                /* No graticule layer found */
                alert("No endpoint exports a graticule layer - none therefore available");
            }
        }        
    }     
};

magic.classes.GraticuleButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.GraticuleButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.GraticuleButton.prototype.activate = function () {
    this.active = true;
    if (this.graticule) {
        this.graticule.setMap(magic.runtime.map);
    } else if (this.graticuleLayer) {
        this.graticuleLayer.setVisible(true);
    }
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.GraticuleButton.prototype.deactivate = function () {
    this.active = false;
    if (this.graticule) {
        this.graticule.setMap(null);
    } else if (this.graticuleLayer) {
        this.graticuleLayer.setVisible(false);
    }
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    