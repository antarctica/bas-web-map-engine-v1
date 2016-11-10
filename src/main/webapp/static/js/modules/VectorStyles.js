/* Canned styles for vector layers */

magic.modules.VectorStyles = function () {
    
    /**
     * Get an approximate asset heading from a COMNAP track
     * @param {ol.geom.LineString} track
     * @returns {double}
     */
    function headingFromTrackGeometry(track) {
        var heading = 0;
        var coords = track.getCoordinates();
        console.log(coords);
        if (jQuery.isArray(coords) && coords.length >= 2) {
            /* This is a simple linestring with enough points to do the calculation */
            var c0 = coords[coords.length-2];
            var c1 = coords[coords.length-1];
            var v01 = new Vector(c1[0]-c0[0], c1[1]-c0[1]);
            var v0n = new Vector(0, 1);
            heading = Math.acos(v01.unit().dot(v0n));
        }
        return(heading);
    }

    return({
        
        bas_aircraft: function(proj) {
            return(function() {
                var props = this.getProperties();
                var name = props["callsign"] || "unknown aircraft";
                var speed = props["speed"] || 0;
                var heading = props["heading"] || 0;
                var colour = speed > 5 ? "green" : "red";
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
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: false,
                        rotation: 0,
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
                        rotation = headingFromTrackGeometry(geoms[i]);
                    }
                }
                var roundel = magic.config.paths.baseurl + "/static/images/" + 
                    (props["type"].toLowerCase() == "ship" ? "ship" : "airplane") + "_" + colour + "_roundel.png"
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
        }

    });

}();