/* Show geolocation button */

magic.classes.GeolocationButton = function (name, ribbon, map) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;
    this.map = map || magic.runtime.map;

    /* Internal properties */
    this.active = false;

    this.inactiveTitle = "Show my location";
    this.activeTitle = "Hide my location";
    
    this.trackLayer = null;
    this.tracFeature = null;        

    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-location-arrow"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
};

magic.classes.GeolocationButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.GeolocationButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.GeolocationButton.prototype.activate = function () {
    
    this.active = true;
    
    var trackStyle = new ol.style.Style({       
        stroke: new ol.style.Stroke({
            color: "rgba(0,0,255,1.0)",
            width: 3,
            lineCap: "round"
        })
    });
    if (this.trackFeature == null) {
        this.trackFeature = new ol.Feature({
            geometry: new ol.geom.LineString([])
        });
    }
    if (this.trackLayer == null) {
        this.trackLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [this.trackFeature]
            }),
            style: trackStyle
        });
    } else {
        this.trackLayer.setVisible(true);
    }
    var geolocation = new ol.Geolocation({
        tracking: true,
        projection: "EPSG:4326"
    });
    geolocation.on("change:position", $.proxy(function() {
        var coordinate = geolocation.getPosition();
        if (magic.modules.GeoUtils.withinExtent(coordinate, magic.modules.GeoUtils.projectionLatLonExtent(this.map.getView().getProjection()))) {
            this.map.setCenter(coordinate);
            this.trackFeature.getGeometry().appendCoordinate(coordinate);
        } else {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Your location is out of range of the map</p>' + 
                '</div>'
            );
        }          
    }, this));
    var marker = new ol.Overlay({
        element: $("#geolocation"),
        positioning: "center-center"
    });
    this.map.addOverlay(marker);
    marker.bindTo("position", geolocation);
    var deviceOrientation = new ol.DeviceOrientation({
        tracking: true
    });
    deviceOrientation.on("change:heading", $.proxy(function(evt) {
        var heading = evt.target.getHeading();
        this.map.setRotation(-heading);
    }, this));
    
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.GeolocationButton.prototype.deactivate = function () {
    this.active = false;
    if (this.trackLayer) {
        this.trackLayer.setVisible(false);
    }
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    