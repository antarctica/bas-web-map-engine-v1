/* Map Creator map parameter selection class */

magic.classes.creator.MapParameterSelector = function(options) {
    
    /* Unpack API properties from options */
  
    /* ID prefix */
    this.prefix = options.prefix || "map-parameters";
    
    /* Internal properties */
    this.map = null;   
        
};

/**
 * Default map parameters
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 * @return {Object}
 */
magic.classes.creator.MapParameterSelector.prototype.defaultData = function(region) {
    return(magic.modules.GeoUtils.DEFAULT_MAP_PARAMS[region]);
};

/**
 * Populate the map-based parameter select according the given data
 * @param {Object} context
 */
magic.classes.creator.MapParameterSelector.prototype.loadContext = function(context) {     
    jQuery("#" + this.prefix + "-selector").closest("div.row").removeClass("hidden");    
    if (!context) {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No default map parameters for region ' + region + '</div>');
        return;
    }
    var data = context;
    if (context.data) {
        /* More complex non-embedded map schema uses 'data' field in the supplied context for layer/map information, and should only be rendered when tab shown */
       data = (typeof context.data.value === "string") ? JSON.parse(context.data.value) : context.data.value;
    }
    this.renderMap(data);
};

magic.classes.creator.MapParameterSelector.prototype.showContext = function() {
    this.map && this.map.updateSize();
};

/**
 * Actually render the map
 * @param {Object} data
 */
magic.classes.creator.MapParameterSelector.prototype.renderMap = function(data) {
    var resetMap = false;
    if (this.map) {
        /* See if projection has changed => must recreate map */
        var newProj = data.projection;
        var oldProj = this.map.getView().getProjection().getCode();
        resetMap = (newProj != oldProj);
    }            
    if (resetMap || !this.map) {
        this.map = null;
        jQuery("#" + this.prefix + "-selector-map").children().remove();
        var proj = ol.proj.get(data.projection);                               
        var view = null;
        /* Sort out the rotation (saved in degrees - OL needs radians) */
        var rotation = parseFloat(data.rotation);
        if (isNaN(rotation)) {
            rotation = 0.0;
        } else {
            rotation = Math.PI*rotation/180.0;
        }
        /* Values that may be JSON or string depending on where they came from */
        if (typeof data.center === "string") {
            data.center = JSON.parse(data.center);
        }
        if (typeof data.proj_extent === "string") {
            data.proj_extent = JSON.parse(data.proj_extent);
        }
        if (typeof data.resolutions === "string") {
            data.resolutions = JSON.parse(data.resolutions);
        }
        jQuery("#" + this.prefix + "-rotation").val(data.rotation);
        var layers = [];
        var projEp;
        var projEps = magic.modules.Endpoints.getEndpointsBy("srs", data.projection);
        for (var i = 0; i < projEps.length; i++) {
            if (projEps[i].coast_layers) {
                projEp = projEps[i];
                break;
            }
        }
        if (!projEp) {
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-top:10px">' + 
                    'No endpoint service defined for projection ' + data.projection + 
                '</div>'
            );
            return;
        }
        if (projEp.url == "osm") {
            /* OpenStreetMap is used for mid-latitude maps */
            layers.push(magic.modules.Endpoints.getMidLatitudeCoastLayer());
            view = new ol.View({                        
                center: data.center,
                minZoom: 1,
                maxZoom: 20,
                rotation: rotation,
                zoom: data.zoom,
                projection: proj
            });
        } else {
            /* Other WMS */
            proj.setExtent(data.proj_extent);   /* Don't do this for OSM - bizarre ~15km shifts happen! */
            proj.setWorldExtent(data.proj_extent);
            var coasts = projEp.coast_layers.split(",");                    
            jQuery.each(coasts, function(idx, cl) {
                var wmsSource = new ol.source.TileWMS({
                    url: projEp.url,
                    params: {
                        "LAYERS": cl, 
                        "CRS": proj.getCode(),
                        "SRS": proj.getCode(),
                        "VERSION": "1.3.0",
                        "TILED": true
                    },
                    tileGrid: new ol.tilegrid.TileGrid({
                        resolutions: data.resolutions,
                        origin: proj.getExtent().slice(0, 2)
                    }),
                    projection: proj
                });
                layers.push(new ol.layer.Tile({
                    visible: true,
                    opacity: 1.0,
                    source: wmsSource
                }));
            });
            var controls = [
                new ol.control.ZoomSlider(),
                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
                new ol.control.MousePosition({
                    projection: "EPSG:4326",
                    className: "custom-mouse-position",
                    coordinateFormat: function (xy) {
                        return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                    }
                })
            ];
            var olGrat = null;
            var graticule = projEp.graticule_layer;
            if (graticule) {                        
                /* Use prepared data for Polar Stereographic as OL control does not work */
                var wmsSource = new ol.source.ImageWMS(({
                    url: projEp.url,
                    params: {"LAYERS": graticule},
                    projection: proj
                }));
                layers.push(new ol.layer.Image({
                    visible: true,
                    opacity: 1.0,
                    source: wmsSource
                }));
            }
            view = new ol.View({
                center: data.center,
                maxResolution: data.resolutions[0],
                resolutions: data.resolutions,
                rotation: rotation,
                zoom: data.zoom,
                projection: proj
            });
        }

        this.map = new ol.Map({
            renderer: "canvas",
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
            layers: layers,
            controls: controls,
            interactions: ol.interaction.defaults(),
            view: view,
            target: this.prefix + "-selector-map"
        });
        if (olGrat != null) {
            olGrat.setMap(this.map);
        }        
    }
    
    /* Set rotation button handler */
    jQuery("#" + this.prefix + "-rotation-set").off("click").on("click", jQuery.proxy(function(evt) {
        var rotationDeg = jQuery("#" + this.prefix + "-rotation").val();
        if (!isNaN(rotationDeg) && this.map) {
            var rotationRad = Math.PI*rotationDeg/180.0;
            this.map.getView().setRotation(rotationRad);
        }
    }, this));
};

/**
 * Retrieve the current context
 * @param {boolean} embedded
 * @return {Object}
 */
magic.classes.creator.MapParameterSelector.prototype.getContext = function(embedded) {    
    var mapView = this.map.getView();
    var rotation = parseFloat(jQuery("#" + this.prefix + "-rotation").val());
    var context = {
        center: mapView.getCenter(),
        zoom: mapView.getZoom(),
        projection: mapView.getProjection().getCode(),
        proj_extent: mapView.getProjection().getExtent(),
        resolutions: mapView.getResolutions(),
        rotation: isNaN(rotation) ? 0.0 : rotation
    };
    return(embedded ? context : {
        data: context
    });
};

magic.classes.creator.MapParameterSelector.prototype.validate = function() {    
    return(true);
};
