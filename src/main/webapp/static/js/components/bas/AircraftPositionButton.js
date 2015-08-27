/* Get positions of all aircraft through the API */

magic.classes.AircraftPositionButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = "Latest positions of BAS aircraft";
    
    this.active = false;
    
    this.inactiveTitle = "Show latest BAS aircraft positions";
    this.activeTitle = "Hide BAS aircraft positions";
    
    /* Display layer within main map */
    this.geoJson = null;
    this.layer = null;
    this.insetLayer = null;
        
    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-plane"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));                 
    window.setTimeout(this.getData, 600000);
};

magic.classes.AircraftPositionButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.AircraftPositionButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.AircraftPositionButton.prototype.activate = function () {
    this.active = true;
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    var fetch = false;
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: "_bas_aircraft_locations",
            visible: true,
            source: new ol.source.Vector({
                features: []
            })
        });
        magic.runtime.map.addLayer(this.layer);
        fetch = true;
    } else {
        this.layer.setVisible(true);
    }    
    if (!this.insetLayer) {
        this.insetLayer = new ol.layer.Vector({
            name: "_bas_aircraft_locations_inset",
            visible: true,
            source: new ol.source.Vector({
                features: []
            })
        });
        if (magic.runtime.inset) {
            magic.runtime.inset.addLayer(this.insetLayer);
            fetch = true;
        }
    } else {
        this.insetLayer.setVisible(true);
        if (magic.runtime.inset) {
            magic.runtime.inset.activate();
        }
    }    
    if (fetch) {
        this.getData();
    }
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.AircraftPositionButton.prototype.deactivate = function () {
    this.active = false;
    this.layer.setVisible(false);
    this.insetLayer.setVisible(false);
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    

magic.classes.AircraftPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    var airApi = "https://api.bas.ac.uk/aircraft/v1";
    /* First retrieve a valid token */
    $.ajax({
        url: magic.config.paths.baseurl + "/airtoken",
        method: "GET",
        headers: {"content-type": "application/json; charset=utf-8"},
        success: $.proxy(function (tdata) {
            var token = tdata.token;
            /* Token ok, so retrieve actual positional data */
            $.ajax({
                url: magic.config.paths.baseurl + "/proxy?url=" + airApi + "/aircraft/position",
                headers: {"Authorization": "Bearer " + token},
                method: "GET",
                success: $.proxy(function(data) {
                    if (!this.geoJson) {
                        return;
                    }
                    var feats = this.geoJson.readFeatures(data);
                    var inFeats = [], outFeats = [];
                    var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.projection.getCode());
                    $.each(feats, $.proxy(function(idx, f) {
                        var props = $.extend({}, f.getProperties(), {
                            "__title": "Aircraft position"
                        });
                        var colour = props.speed > 5 ? "green" : "red";                        
                        var fclone = f.clone();
                        fclone.setProperties(props);
                        if (f.getGeometry().intersectsExtent(projExtent)) {                            
                            fclone.getGeometry().transform("EPSG:4326", magic.runtime.projection);
                            var style = new ol.style.Style({
                                image: new ol.style.Icon({
                                    rotateWithView: true,
                                    rotation: magic.modules.Common.toRadians(magic.modules.GeoUtils.headingWrtTrueNorth(fclone.getGeometry, props.heading)),
                                    src: magic.config.paths.baseurl + "/static/images/airplane_" + colour + "_roundel.png"
                                }),
                                text: new ol.style.Text({
                                    font: "Arial",
                                    scale: 1.2,
                                    offsetX: 14,
                                    text: props.callsign,
                                    textAlign: "left",
                                    fill: new ol.style.Fill({
                                        color: "#ff0000"
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: "#ffffff",
                                        width: 1
                                    })
                                })
                            });
                            fclone.setStyle(style);
                            inFeats.push(fclone);
                        } else {
                            fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
                            var style = new ol.style.Style({
                                image: new ol.style.Icon({
                                    rotation: magic.modules.Common.toRadians(props.heading),
                                    src: magic.config.paths.baseurl + "/static/images/airplane_" + colour + "_roundel.png"
                                }),
                                text: new ol.style.Text({
                                    font: "Arial",
                                    scale: 1.2,
                                    offsetX: 14,
                                    text: props.callsign,
                                    textAlign: "left",
                                    fill: new ol.style.Fill({
                                        color: "#ff0000"
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: "#ffffff",
                                        width: 1
                                    })
                                })
                            });
                            fclone.setStyle(style);
                            outFeats.push(fclone);
                        }                        
                    }, this));
                    this.layer.getSource().clear();
                    if (inFeats.length > 0) {
                        this.layer.getSource().addFeatures(inFeats);
                    }
                    if (magic.runtime.inset) {
                        this.insetLayer.getSource().clear();
                        if (outFeats.length > 0) {
                            this.insetLayer.getSource().addFeatures(outFeats);
                            magic.runtime.inset.activate();
                        } else {
                            /* Can dispense with displaying the inset (if no other layers still have features to show)? */
                            magic.runtime.inset.deactivate();
                        }                    
                    }
                }, this),
                error: function(jqXhr, status, msg) {
                    if (status && msg) {
                        alert("Error: " + status + " " + msg + " - potential network outage?");
                    } else {
                        alert("Failed to get aircraft positional data - potential network outage?");
                    }      
                }
            });
        }, this),
        error: function(jqXhr, status, msg) {
            if (status && msg) {
                alert("Error: " + status + " " + msg + " - potential network outage?");
            } else {
                alert("Failed to get aircraft API token - potential network outage?");
            }            
        }
    });        
};