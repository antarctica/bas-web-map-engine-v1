/* Canned styles for vector layers */

magic.modules.VectorStyles = function () {

    return({
        
        aircraft: function(nameAttr, speedAttr, headingAttr, proj) {
            return(function() {
                var props = this.getProperties();
                var name = nameAttr ? props[nameAttr] : "Unknown";
                var speed = speedAttr ? (props[speedAttr] || 0) : 0;
                var heading = headingAttr ? (props[headingAttr] || 0) : 0;
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
        ship: function(nameAttr, speedAttr, headingAttr, proj) {
            return(function() {
                var props = this.getProperties();
                var name = nameAttr ? props[nameAttr] : "Unknown";
                var speed = speedAttr ? (props[speedAttr] || 0) : 0;
                var heading = headingAttr ? (props[headingAttr] || 0) : 0;
                var colour = speed > 0 ? "green" : "red";
                var rotateWithView = false;
                var rotation = 0.0;
                return([new ol.style.Style({
                    image: new ol.style.Icon({
                        rotateWithView: rotateWithView,
                        rotation: rotation,
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
        comnap_asset: function(nameAttr, speedAttr, headingAttr, proj) {
            return(function() {
                var props = this.getProperties();
                var name = nameAttr ? props[nameAttr] : "Unknown";
                var speed = speedAttr ? (props[speedAttr] || 0) : 0;
                var colour = speed > 0 ? "green" : "red";
                var rotateWithView = false;
                var rotation = 0.0;
                if (props["type"].toLowerCase() == "ship") {
                    return([new ol.style.Style({
                        image: new ol.style.Icon({
                            rotateWithView: rotateWithView,
                            rotation: rotation,
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
                } else if (props["type"].toLowerCase == "aeroplane") {
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
                }
            });
        }

    });

}();