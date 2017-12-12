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
     
    this.marker = null;
    this.geolocation = null;
    this.deviceOrientation = null;

    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-location-arrow"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
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
        
    if (this.marker == null) {
        this.marker = new ol.Overlay({
            element: jQuery("#geolocation")[0],
            positioning: "center-center"
        });
        this.map.addOverlay(this.marker);
    }   
    if (this.geolocation == null) {
        this.geolocation = new ol.Geolocation({
            tracking: true,
            trackingOptions: {
                enableHighAccuracy: true
            },
            projection: this.map.getView().getProjection()
        });
        this.geolocation.on("change:position", this.showLocation, this);
    } else {
        this.geolocation.setTracking(true);
        this.showLocation();
    }
    if (this.deviceOrientation == null) {
        this.deviceOrientation = new ol.DeviceOrientation({
            tracking: true
        });
        this.deviceOrientation.on("change:heading", this.showHeading, this);
    } else {
        this.deviceOrientation.setTracking(true);
        this.showHeading();
    }
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");    
};

/**
 * Deactivate the control
 */
magic.classes.GeolocationButton.prototype.deactivate = function () {
    this.active = false;   
    if (this.marker) {
        jQuery("#geolocation").addClass("hidden");
    }
    this.geolocation.setTracking(false);
    this.deviceOrientation.setTracking(false);
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};

/**
 * Show a marker at the current location
 */
magic.classes.GeolocationButton.prototype.showLocation = function () {
    var coordinate = this.geolocation.getPosition();
    if (coordinate) {                
        var projc = ol.proj.transform(coordinate, this.map.getView().getProjection(), "EPSG:4326");                
        if (magic.modules.GeoUtils.withinExtent(projc, magic.modules.GeoUtils.projectionLatLonExtent(this.map.getView().getProjection()))) {
            /* Display the marker and append current location to cumulative track */
            jQuery("#geolocation").removeClass("hidden");
            this.marker.setPosition(coordinate);
            /* Current location on the map - project to map projection and center the map */                                        
            this.map.getView().setCenter(coordinate);                                 
            /* Update tooltip */
            this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
        } else {
            /* Update tooltip to indicate out of range (might be good to change colour too) */
            this.btn.attr("data-original-title", "Your location is out of range of the map").tooltip("fixTitle");
        } 
    }
};

/**
 * Show current heading
 */
magic.classes.GeolocationButton.prototype.showHeading = function () {
    var heading = this.deviceOrientation.getHeading();
    //this.map.getView().setRotation(-rotation);
    var mElt = jQuery("#geolocation")[0];
    mElt.style["-webkit-transform"] = "rotate(" + heading + "rad)";
    mElt.style["transform"] = "rotate(" + heading + "rad)";
};



    