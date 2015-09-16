/* Get positions of all ships through the API */

magic.classes.ShipPositionButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = "Latest positions of BAS ships";
    
    this.active = false;
    
    this.inactiveTitle = "Show latest BAS ship positions";
    this.activeTitle = "Hide BAS ship positions";
    
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
        "html": '<span class="fa fa-ship"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));    
    window.setTimeout(this.getData, 300000);
    $(document).on("insetmapclosed", $.proxy(function(evt) {
    }, this));
};

magic.classes.ShipPositionButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.ShipPositionButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.ShipPositionButton.prototype.activate = function () {
    this.active = true;
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    var fetch = false;
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: "_bas_ship_locations",
            visible: true,
            source: new ol.source.Vector({
                features: []
            })
        });
        magic.runtime.map.addLayer(this.layer);
        fetch = true;
    }  else {
        this.layer.setVisible(true);
    }    
    if (!this.insetLayer) {
        this.insetLayer = new ol.layer.Vector({
            name: "_bas_ship_locations_inset",
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
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.ShipPositionButton.prototype.deactivate = function () {
    this.active = false;
    this.layer.setVisible(false);
    this.insetLayer.setVisible(false);
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    

magic.classes.ShipPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    var shipApi = "https://api.bas.ac.uk/marine/v1/vessels/position/";        
    $.ajax({
        url: magic.config.paths.baseurl + "/proxy?url=" + shipApi,
        method: "GET",
        success: $.proxy(function(data) {
            /* Format is as https://github.com/felnne/bas-api-documentation/blob/master/marine-api/v1/documentation/resources/vessel.md */           
            if ($.isArray(data)) {
                var inFeats = [], outFeats = [];
                var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.projection.getCode());                         
                $.each(data, function(idx, elt) {
                    var attrs = {
                        callsign: elt.callsign,
                        name: elt.name,
                        list: elt.vessel.vessel_list,
                        code: elt.vessel.vessel_code,
                        lon: elt.latest_position.longitude,
                        lat: elt.latest_position.latitude,
                        timestamp: elt.latest_position.datetime,
                        "__title" : "Ship position"
                    };
                    var feat = new ol.Feature(attrs)
                    var geom = new ol.geom.Point([attrs.lon, attrs.lat]);
                    var inside = geom.intersectsExtent(projExtent);
                    if (inside) {
                        geom.transform("EPSG:4326", magic.runtime.projection);                        
                    } else {
                        geom.transform("EPSG:4326", "EPSG:3857");
                    }
                    feat.setGeometry(geom);
                    feat.setStyle(new ol.style.Style({
                        image: new ol.style.Icon({
                            src: magic.config.paths.baseurl + "/static/images/ship_red_roundel.png"
                        }),
                        text: new ol.style.Text({
                            font: "Arial",
                            scale: 1.2,
                            offsetX: 14,
                            text: attrs.name,
                            textAlign: "left",
                            fill: new ol.style.Fill({
                                color: "#ff0000"
                            }),
                            stroke: new ol.style.Stroke({
                                color: "#ffffff",
                                width: 1
                            })
                        })
                    }));
                    if (inside) {
                        inFeats.push(feat);
                    } else {
                        outFeats.push(feat);
                    }                                        
                });                                
            } else {
                alert("Failed to make sense of returned data from marine API");
            }                        
            if (inFeats.length > 0 && this.layer) {
                this.layer.getSource().clear();
                this.layer.getSource().addFeatures(inFeats);
            }
            if (magic.runtime.inset) {                
                if (outFeats.length > 0 && this.insetLayer) {
                    this.insetLayer.getSource().clear();
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
                alert("Error: " + status + " " + msg + " getting vessel positions - potential network outage?");
            } else {
                alert("Failed to get ship positional data - potential network outage?");
            }      
        }
    });        
};