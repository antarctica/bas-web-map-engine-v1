/* Canned styles for vector layers */

magic.modules.VectorStyles = function () {

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
                        src: magic.config.paths.baseurl + "/static/images/airplane_" + colour + "_roundel.png"
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
                        src: magic.config.paths.baseurl + "/static/images/ship_" + colour + "_roundel.png"
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
                    var gtype = magic.modules.Common.getGeometryType(geoms[i]);
                    if (gtype == "line") {
                        rotation = magic.modules.Common.headingFromTrackGeometry(geoms[i]);
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
                var roundel = magic.config.paths.baseurl + "/static/images/" + type + "_" + colour + "_roundel.png"
                for (var i = 0; i < geoms.length; i++) {
                    var gtype = magic.modules.Common.getGeometryType(geoms[i]);
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
                if (props["current_status"].toLowerCase() == "seasonal") {
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
        }

    });

}();