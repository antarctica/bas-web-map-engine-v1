/* Canned styles for vector layers */

magic.modules.VectorStyles = function () {
    
    var col2Hex = {
        red: "#f20000",
        orange: "#ff776b",
        green: "#5af23f",
        gold: "#ffd700",
        gray: "#777777"
    };
    
    /**
     * Get property key of given object that looks like a name
     * @param {Object} props
     * @return {String}
     */
    function getNameProperty(props) {
        var nameProp = null;
        jQuery.each(props, function(key, value) {
            if (magic.modules.Common.isNameLike(key)) {
                nameProp = value;
                return(false);
            }
        });
        return(nameProp);
    }
    
    /**
     * Canned style for map pin marker of given colour
     * @param {String} col
     * @return {Function}
     */
    function markerStyle(col) {
        return(function() {
            var name = getNameProperty(this.getProperties());
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    scale: 0.8,
                    anchor: [0.5, 1.0],
                    src: magic.config.paths.cdn + "/images/map-markers/marker_" + col + ".png"
                })
            });
            if (name != null) {
                style.setText(new ol.style.Text({
                    font: "Arial",
                    scale: 1.2,
                    offsetX: 10,
                    offsetY: -10,
                    text: name,
                    textAlign: "left",
                    fill: new ol.style.Fill({color: magic.modules.Common.rgbToDec(col2Hex[col], 0.0)}),
                    stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                }));
            }
            return([style]);
        });
    }

    return({
        
        bas_aircraft: function(proj) {
            return(function() {
                var props = this.getProperties();
                var name = props["callsign"] || "unknown aircraft";
                var speed = props["speed"] || 0;
                var heading = props["heading"] || 0;
                var tstamp = new Date(props["utc"]).getTime();
                var now = new Date().getTime();
                var tstampAge = parseFloat(now - tstamp)/(1000.0*60.0*60.0);
                var colour = (speed >= 10 && tstampAge <= 1) ? "green" : "red";
                var rotateWithView = !(proj == "EPSG:4326" || proj == "EPSG:3857");
                var rotation = rotateWithView ? magic.modules.GeoUtils.headingWrtTrueNorth(this.getGeometry(), heading) : heading;
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: rotateWithView,
                        rotation: magic.modules.Common.toRadians(rotation),
                        src: magic.config.paths.cdn + "/images/asset-symbols/airplane_" + colour + "_roundel.png"
                    }),
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 14,
                        text: name,
                        textAlign: "left",
                        fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        bas_ship: function(proj) {
            return(function() {
                var props = this.getProperties();
                var name = props["callsign"] || "unknown ship";
                var speed = props["speed"] || 0;
                var colour = speed > 0 ? "green" : "red"; 
                var heading = props["heading"] || 0;
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: true,
                        rotation: heading,
                        src: magic.config.paths.cdn + "/images/asset-symbols/ship_" + colour + "_roundel.png"
                    }),
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 14,
                        text: name,
                        textAlign: "left",
                        fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        comnap_asset: function() {
            return(function() {
                var styles = [];                
                var props = this.getProperties();
                var name = props["name"] || "unknown asset";
                var speed = props["speed"] || 0;
                var colour = speed > 0 ? "green" : "red";
                var rotation = 0;
                var geoms = this.getGeometry().getGeometries();
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.GeoUtils.getGeometryType(geoms[i]);
                    if (gtype == "line") {
                        rotation = magic.modules.GeoUtils.headingFromTrackGeometry(geoms[i]);
                    }
                }
                var type = "unknown";
                switch(props["type"].toLowerCase()) {
                    case "ship": type = "ship"; break;
                    case "aeroplane": type = "airplane"; break;
                    case "helicopter": type = "helicopter"; break;
                    default: break;
                }
                if (name != "unknown asset" && props["description"]) {
                    name = props["description"] + " (" + name + ")";
                }
                var roundel = magic.config.paths.cdn + "/images/asset-symbols/" + type + "_" + colour + "_roundel.png";
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.GeoUtils.getGeometryType(geoms[i]);
                    if (gtype == "point") {
                        styles.push(new ol.style.Style({
                            geometry: geoms[i],
                            image: new ol.style.Icon({
                                rotateWithView: true,
                                rotation: rotation,
                                src: roundel
                            }),
                            text: new ol.style.Text({
                                font: "Arial",
                                scale: 1.2,
                                offsetX: 14,
                                text: name,
                                textAlign: "left",
                                fill: new ol.style.Fill({color: colour == "red" ? "rgba(229, 0, 0, 0.0)" : "rgba(0, 128, 0, 0.0)"}),
                                stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                            })
                        }));                        
                    } else {
                        /* This is the track geometry which should have a transparent style */
                        styles.push(new ol.style.Style({
                            geometry: geoms[i],
                            fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.0)"}),
                            stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                        }));
                    }
                }
                return(styles);
            });
        },
        antarctic_facility: function() {
            return(function() {
                var props = this.getProperties();
                var fillColor = "rgba(255, 0, 0, 0.4)";
                if (!props["current_status"] || props["current_status"].toLowerCase() == "seasonal") {
                    fillColor = "rgba(255, 255, 255, 0.8)";
                }
                return([new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4.5, 
                        fill: new ol.style.Fill({color: fillColor}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 0, 0, 1.0)", width: 1.5})
                    }),                    
                    text: new ol.style.Text({
                        font: "Arial",
                        scale: 1.2,
                        offsetX: 7,
                        text: props["facility_name"],
                        textAlign: "left",
                        fill: new ol.style.Fill({color: "rgba(255, 0, 0, 0.0)"}),
                        stroke: new ol.style.Stroke({color: "rgba(255, 255, 255, 0.0)"})
                    })
                })]);
            });
        },
        bas_field_party: function(r) {
            return(function() {
                if (!r) { 
                    r = 6;
                }
                var geomType = this.getGeometry().getType();
                if (geomType == "LineString") {
                    /* Field party track */
                    return([
                       new ol.style.Style({
                           stroke: new ol.style.Stroke({
                               color: "rgba(0, 0, 255, 1.0)",
                               width: 1.5
                           })
                       }) 
                    ]);
                } else {
                    /* Point fix */
                    var props = this.getProperties();                
                    var rgba = props["rgba"] || "rgba(255, 0, 0, 1.0)";
                    var rgbaInvisible = rgba.replace("1.0)", "0.0)");
                    return([new ol.style.Style({
                        image: new ol.style.RegularShape({
                            rotateWithView: true,
                            rotation: 0,
                            points: 4,
                            radius: r,
                            fill: new ol.style.Fill({color: rgba}),
                            stroke: new ol.style.Stroke({color: rgba})
                        }),
                        text: new ol.style.Text({
                            font: "Arial",
                            scale: 1.2,
                            offsetX: 14,
                            text: props["sledge"] + ", " + moment(props["fix_date"]).format("DD/MM/YYYY"),
                            textAlign: "left",
                            fill: new ol.style.Fill({color: rgbaInvisible}),
                            stroke: new ol.style.Stroke({color: rgbaInvisible})
                        })
                    })]);
                }
            });
        },
        red_map_pin: function() {
            return(markerStyle("red"));
        },
        orange_map_pin: function() {
            return(markerStyle("orange"));
        },
        green_map_pin: function() {
            return(markerStyle("green"));
        },
        gold_map_pin: function() {
            return(markerStyle("gold"));
        },
        gray_map_pin: function() {
            return(markerStyle("gray"));
        }

    });

}();