/* Get positions of all ships through the Marine API */

magic.classes.ShipPositionButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = "Latest positions of BAS ships";
    
    this.active = false;
    this.timer = null;
    
    this.inactiveTitle = "Show latest BAS ship positions";
    this.activeTitle = "Hide BAS ship positions";
    
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
        {name: "name", alias: "Name", displayed: true},
        {name: "lon", alias: "Longitude", displayed: true},
        {name: "lat", alias: "Latitude", displayed: true},
        {name: "timestamp", alias: "Date", displayed: true},
        {name: "code", alias: "Vessel code", displayed: false} /* To force pop-up to offer "full attribute set" */        
    ];
        
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-ship"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));        
    jQuery(document).on("insetmapopened", jQuery.proxy(function(evt) {
        if (magic.runtime.inset) {
            this.insetLayer = new ol.layer.Vector({
                name: "BAS ships_inset",
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
    this.timer = window.setInterval(jQuery.proxy(this.getData, this), 300000);
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: "BAS ships",
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
    }  else {
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
magic.classes.ShipPositionButton.prototype.deactivate = function () {
    this.active = false;
    if (this.timer != null) {
        window.clearInterval(this.timer);
        this.timer = null;
    }
    this.layer.setVisible(false);
    if (this.insetLayer) {
        this.insetLayer.setVisible(false);
        this.insetLayer.getSource().clear();
    }
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
    magic.runtime.inset.deactivate();
};
    

magic.classes.ShipPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    //var shipApi = "https://legacy.bas.ac.uk/webteam/api/ship/position/";
    var shipApi = "https://api.bas.ac.uk/marine/v1/vessels/position/";        
    jQuery.ajax({
        url: shipApi,
        method: "GET",
        success: jQuery.proxy(function(response) {
            /* Format is as https://github.com/felnne/bas-api-documentation/blob/master/marine-api/v1/documentation/resources/vessel.md */           
            var data = response.data;
            if (jQuery.isArray(data)) {
                this.data = {
                    inside: [],
                    outside: []
                };                
                var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.viewdata.projection.getCode());                         
                jQuery.each(data, jQuery.proxy(function(idx, elt) {
                    var attrs = {
                        callsign: elt.callsign,
                        name: elt.name,
                        list: elt.vessel.vessel_list,
                        code: elt.vessel.vessel_code,
                        lon: elt.latest_position.longitude,
                        lat: elt.latest_position.latitude,
                        timestamp: elt.latest_position.datetime
                    };
                    var feat = new ol.Feature(attrs)
                    var geom = new ol.geom.Point([attrs.lon, attrs.lat]);
                    var inside = geom.intersectsExtent(projExtent);
                    if (inside) {
                        geom.transform("EPSG:4326", magic.runtime.viewdata.projection);                        
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
                        feat.setStyle(magic.modules.VectorStyles.ship("callsign", null, null, magic.runtime.viewdata.projection))
                        this.data.inside.push(feat);
                    } else {
                        feat.setStyle(magic.modules.VectorStyles.ship("callsign", null, null, "EPSG:3857"))
                        this.data.outside.push(feat);
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
            } else {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to make sense of returned data from marine API</div>');
            }                                    
        }, this),
        error: function(jqXhr, status, msg) {
            if (status && msg) {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Error: ' + status + ' ' + msg + ' getting vessel positions - potential network outage?</div>');
            } else {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to get ship positional data - potential network outage?</div>');                
            }      
        }
    });        
};