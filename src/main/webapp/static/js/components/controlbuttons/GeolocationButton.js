/* Show geolocation button */

magic.classes.GeolocationButton = function (name, ribbon, map) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        map: map,
        inactiveTitle: "Show my location",
        activeTitle: "Hide my location",
        onActivate: jQuery.proxy(this.onActivate, this),
        onDeactivate: jQuery.proxy(this.onDeactivate, this)
    };    
    
    magic.classes.MapControlButton.call(this, options);        
   
    this.marker = null;
    this.geolocation = null;
    this.deviceOrientation = null;

};

magic.classes.GeolocationButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.GeolocationButton.prototype.constructor = magic.classes.GeolocationButton;

/**
 * Activate control callback
 */
magic.classes.GeolocationButton.prototype.onActivate = function () {            
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
};

/**
 * Deactivate control callback
 */
magic.classes.GeolocationButton.prototype.onDeactivate = function () {
    if (this.marker) {
        jQuery("#geolocation").addClass("hidden");
    }
    this.geolocation.setTracking(false);
    this.deviceOrientation.setTracking(false);    
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
    var mElt = jQuery("#geolocation")[0];
    mElt.style["-webkit-transform"] = "rotate(" + heading + "rad)";
    mElt.style["transform"] = "rotate(" + heading + "rad)";
};



    