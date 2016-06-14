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
    this.data = {
        inside: [],
        outside: []
    };
    
    this.attribute_map = [
        {name: "callsign", alias: "Call sign", displayed: true},
        {name: "checktimestamp", alias: "Date", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true},
        {name: "speed", alias: "Speed", displayed: false} /* To force pop-up to offer "full attribute set" */
    ];
        
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-plane"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));                 
    window.setTimeout(this.getData, 600000);
    jQuery(document).on("insetmapopened", jQuery.proxy(function(evt) {
        if (magic.runtime.inset) {
            this.insetLayer = new ol.layer.Vector({
                name: "BAS aircraft_inset",
                visible: this.isActive(),
                source: new ol.source.Vector({
                    features: []
                }),
                metadata: {
                    is_interactive: true,
                    attribute_map: this.attribute_map
                }
            });            
            magic.runtime.inset.addLayer(this.insetLayer); 
            if (this.data.outside.length > 0) {
                var osClones = jQuery.map(this.data.outside, function(f) {
                    return(f.clone());
                });                        
                this.insetLayer.getSource().addFeatures(osClones);
            }
        }
    }, this));
    jQuery(document).on("insetmapclosed", jQuery.proxy(function(evt) {
        this.insetLayer = null;
    }, this));
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
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: "BAS aircraft",
            visible: true,
            source: new ol.source.Vector({
                features: []
            }),
            metadata: {
                is_interactive: true,
                attribute_map: this.attribute_map
            }
        });
        magic.runtime.map.addLayer(this.layer);
    } else {
        this.layer.setVisible(true);
    }  
    if (this.insetLayer) {
        this.insetLayer.setVisible(true);
    }
    this.getData();
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");   
};

/**
 * Deactivate the control
 */
magic.classes.AircraftPositionButton.prototype.deactivate = function () {
    this.active = false;
    this.layer.setVisible(false);
    if (this.insetLayer) {
        this.insetLayer.setVisible(false);
        this.insetLayer.getSource().clear();
    }
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
    magic.runtime.inset.deactivate();
};
    

magic.classes.AircraftPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    jQuery.ajax({
        /* Might be nice to get this listed as part of the maps.bas.ac.uk stable... */
        url: "http://add.antarctica.ac.uk/geoserver/assets/wfs?service=wfs&request=getfeature&version=2.0.0&typeNames=assets:latest_aircraft_positions&outputFormat=json",
        method: "GET",
        success: jQuery.proxy(function(data) {
            if (!this.geoJson) {
                return;
            }
            var feats = this.geoJson.readFeatures(data);
            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.viewdata.projection.getCode());
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var props = jQuery.extend({}, f.getProperties());
                var colour = props.speed > 5 ? "green" : "red";                        
                var fclone = f.clone();
                fclone.setProperties(props);
                if (f.getGeometry().intersectsExtent(projExtent)) {                            
                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.viewdata.projection);
                    var style = new ol.style.Style({
                        image: new ol.style.Icon({
                            rotateWithView: true,
                            rotation: magic.modules.Common.toRadians(magic.modules.GeoUtils.headingWrtTrueNorth(fclone.getGeometry(), props.heading)),
                            src: magic.config.paths.baseurl + "/static/images/airplane_" + colour + "_roundel.png"
                        }),
                        text: new ol.style.Text({
                            font: "Arial",
                            scale: 1.2,
                            offsetX: 14,
                            text: props.callsign,
                            textAlign: "left",
                            fill: new ol.style.Fill({
                                color: colour == "red" ? "#e50000" : "#008000"
                            }),
                            stroke: new ol.style.Stroke({
                                color: "#ffffff",
                                width: 1
                            })
                        })
                    });
                    fclone.setStyle(style);
                    this.data.inside.push(fclone);
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
                                color: colour == "red" ? "#e50000" : "#008000"
                            }),
                            stroke: new ol.style.Stroke({
                                color: "#ffffff",
                                width: 1
                            })
                        })
                    });
                    fclone.setStyle(style);
                    this.data.outside.push(fclone);
                }                        
            }, this));
            this.layer.getSource().clear();
            if (this.data.inside.length > 0) {
                this.layer.getSource().addFeatures(this.data.inside);
            }
            if (this.data.outside.length > 0) {
                if (this.insetLayer) {
                    this.insetLayer.getSource().clear();
                    var osClones = jQuery.map(this.data.outside, function(f) {
                        return(f.clone());
                    });      
                    this.insetLayer.getSource().addFeatures(osClones); 
                }
                if (magic.runtime.inset) {
                    magic.runtime.inset.activate();
                }
            }                  
        }, this),
        error: function(jqXhr, status, msg) {
            if (status && msg) {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Error: ' + status + ' ' + msg + ' getting aircraft positions - potential network outage?</div>');
            } else {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to get aircraft positional data - potential network outage?</div>');
            }      
        }
    });
};